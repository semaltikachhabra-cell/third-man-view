import { buildLiveDossier } from "./cricket";
import { geminiJSON } from "./gemini";
import { sampleDossier } from "./sample";
import type { Brief, BriefRequest, Dossier, FormAndVenue, XI } from "./types";

const str = { type: "STRING" };
const obj = (properties: Record<string, unknown>) => ({ type: "OBJECT", properties, required: Object.keys(properties) });

const FORM_SCHEMA = obj({
  playerForm: { type: "ARRAY", items: obj({ name: str, team: str, summary: str, rating: { type: "STRING", enum: ["hot", "steady", "cold", "unknown"] } }) },
  venueTrends: { type: "ARRAY", items: obj({ title: str, detail: str }) },
  takeaways: { type: "ARRAY", items: str },
  angles: { type: "ARRAY", items: str },
});
const XI_SCHEMA = obj({
  team: str,
  xi: { type: "ARRAY", items: obj({ name: str, role: str, reason: str }) },
  keyCall: str,
  confidence: { type: "STRING", enum: ["High", "Medium", "Low"] },
});

const RULES = `You are a cricket analyst writing for a newsletter. Use ONLY the JSON data provided. Never invent statistics, scores or players.
If data is missing for a player or venue, say so briefly (rating "unknown") instead of guessing. Keep each line to one or two crisp sentences.`;

function compact(d: Dossier) {
  return JSON.stringify({
    match: d.match,
    venueHistory: d.venueHistory,
    h2h: d.h2h,
    squads: Object.fromEntries(Object.entries(d.squads).map(([t, ps]) => [t, ps.map((p) => ({ name: p.name, role: p.role, bowling: p.bowlingStyle, last5: p.recent }))])),
  });
}

function validateForm(x: unknown): FormAndVenue {
  const o = x as FormAndVenue;
  if (!Array.isArray(o?.playerForm) || !Array.isArray(o?.venueTrends)) throw new Error("Bad form JSON");
  return { playerForm: o.playerForm, venueTrends: o.venueTrends.slice(0, 3), takeaways: (o.takeaways ?? []).slice(0, 4), angles: (o.angles ?? []).slice(0, 3) };
}

function validateXI(known: Set<string>) {
  return (x: unknown): XI => {
    const o = x as XI;
    if (!Array.isArray(o?.xi) || o.xi.length !== 11) throw new Error("XI must have exactly 11 players");
    const bad = o.xi.filter((p) => !known.has(p.name));
    if (bad.length) throw new Error(`Unknown players: ${bad.map((p) => p.name).join(", ")}`);
    if (new Set(o.xi.map((p) => p.name)).size !== 11) throw new Error("Duplicate players in XI");
    return o;
  };
}

// Warm-instance cache so repeat requests (and demos) are instant and don't burn API quota.
const cache = new Map<string, { at: number; brief: Brief }>();

export async function generateBrief(req: BriefRequest): Promise<Brief> {
  const key = JSON.stringify(req).toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.brief;
  const brief = await buildBrief(req);
  cache.set(key, { at: Date.now(), brief });
  return brief;
}

async function buildBrief(req: BriefRequest): Promise<Brief> {
  let dossier: Dossier;
  try {
    dossier = await buildLiveDossier(req);
    const squadSize = Object.values(dossier.squads).reduce((n, s) => n + s.length, 0);
    if (squadSize < 12) throw new Error("Squad data too thin");
  } catch (e) {
    dossier = { ...sampleDossier, warnings: [`Live data unavailable (${e instanceof Error ? e.message : "error"}). Showing sample data.`] };
  }

  const india = Object.keys(dossier.squads).find((t) => /india/i.test(t)) ?? dossier.match.teamA;
  const indiaPlayers = new Set((dossier.squads[india] ?? []).map((p) => p.name));
  const data = compact(dossier);

  const [fv, xi] = await Promise.all([
    geminiJSON(
      `${RULES}\nTask: (1) For EVERY player in both squads give a one-sentence form summary from last5 and a rating (hot/steady/cold/unknown). (2) Give exactly the 3 most relevant venue trends for this format at this venue, using venueHistory and the squads' strengths (e.g. pace vs spin, toss/batting-first pattern). (3) Give 3-4 short key takeaways for the match, and 3 suggested angles/questions for the writer's newsletter piece.\nDATA: ${data}`,
      FORM_SCHEMA, validateForm),
    geminiJSON(
      `${RULES}\nTask: Predict India's playing XI (exactly 11 names, copied exactly from the India squad) for this match, balancing batting depth, 5-6 bowling options and venue conditions. Give a one-line reason per pick, a keyCall: the single toughest selection decision, and a confidence (High/Medium/Low) based on how complete the data is.\nDATA: ${data}`,
      XI_SCHEMA, validateXI(indiaPlayers)),
  ]);

  return { dossier, playerForm: fv.playerForm, venueTrends: fv.venueTrends, takeaways: fv.takeaways, angles: fv.angles, predictedXI: xi, generatedAt: new Date().toISOString() };
}
