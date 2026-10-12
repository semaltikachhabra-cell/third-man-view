import type { BriefRequest, Dossier, Format, Innings, Player } from "./types";

// Live data from CricketData.org (api.cricapi.com). Free tier ~100 hits/day, so every call is cached.
const BASE = "https://api.cricapi.com/v1";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function api(path: string, params: Record<string, string> = {}): Promise<any> {
  const key = process.env.CRICKET_API_KEY;
  if (!key) throw new Error("CRICKET_API_KEY is not set");
  const qs = new URLSearchParams({ apikey: key, ...params });
  const res = await fetch(`${BASE}/${path}?${qs}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Cricket API ${path} ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error(`Cricket API ${path}: ${json.reason ?? "failed"}`);
  return json.data;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const fmtOf = (t?: string): Format | undefined => {
  const x = (t ?? "").toLowerCase();
  return x === "t20" || x === "t20i" ? "T20I" : x === "odi" ? "ODI" : x === "test" ? "Test" : undefined;
};
const hasTeam = (m: any, team: string) => (m.teams ?? []).some((t: string) => norm(t).includes(norm(team)) || norm(team).includes(norm(t)));

async function allMatches(): Promise<any[]> {
  const pages = await Promise.all([0, 25, 50].map((o) => api("matches", { offset: String(o) }).catch(() => [])));
  const cur = await api("currentMatches", { offset: "0" }).catch(() => []);
  const seen = new Map<string, any>();
  for (const m of [...cur, ...pages.flat()]) if (m?.id) seen.set(m.id, m);
  return [...seen.values()];
}

export async function resolveMatch(req: BriefRequest, matches: any[]): Promise<any> {
  if (req.mode === "id") {
    const info = await api("match_info", { id: req.matchId });
    return info;
  }
  const cands = matches
    .filter((m) => hasTeam(m, req.teamA) && hasTeam(m, req.teamB) && fmtOf(m.matchType) === req.format)
    .sort((a, b) => +new Date(a.dateTimeGMT ?? 0) - +new Date(b.dateTimeGMT ?? 0));
  const now = Date.now();
  const upcoming = cands.find((m) => !m.matchEnded && +new Date(m.dateTimeGMT ?? 0) >= now - 6 * 3600e3);
  const found = upcoming ?? cands[cands.length - 1];
  if (!found) throw new Error(`No ${req.format} match found for ${req.teamA} vs ${req.teamB}.`);
  return found;
}

function collect(card: any, name: string, into: Map<string, Innings[]>, against: string) {
  for (const inn of card?.scorecard ?? []) {
    for (const b of inn.batting ?? []) {
      const n = b.batsman?.name;
      if (!n) continue;
      const list = into.get(n) ?? [];
      list.push({ against, runs: Number(b.r) || 0, balls: Number(b.b) || 0, out: !/not out/i.test(b.dismissal ?? "") });
      into.set(n, list);
    }
    for (const w of inn.bowling ?? []) {
      const n = w.bowler?.name;
      if (!n) continue;
      const list = into.get(n) ?? [];
      list.push({ against, runs: 0, balls: 0, out: false, wickets: Number(w.w) || 0, conceded: Number(w.r) || 0, overs: Number(w.o) || 0 });
      into.set(n, list);
    }
  }
  void name;
}

export async function buildLiveDossier(req: BriefRequest): Promise<Dossier> {
  const warnings: string[] = [];
  const matches = await allMatches();
  const m = await resolveMatch(req, matches);
  const [teamA, teamB] = (m.teams as string[]) ?? (req.mode === "teams" ? [req.teamA, req.teamB] : ["", ""]);
  const format = fmtOf(m.matchType) ?? (req.mode === "teams" ? req.format : "T20I");

  // Squads
  const squads: Record<string, Player[]> = {};
  try {
    const sq = await api("match_squad", { id: m.id });
    for (const t of sq) {
      squads[t.teamName] = (t.players ?? []).map((pl: any) => ({
        name: pl.name, role: pl.role ?? "Player", team: t.teamName, battingStyle: pl.battingStyle, bowlingStyle: pl.bowlingStyle, recent: [],
      }));
    }
  } catch {
    warnings.push("Squad list unavailable from the data provider.");
  }

  // Recent form: aggregate the last few completed scorecards per team (same format preferred)
  const done = matches.filter((x) => x.matchEnded && x.id !== m.id);
  const recentFor = (team: string) =>
    done.filter((x) => hasTeam(x, team) && fmtOf(x.matchType) === format)
      .sort((a, b) => +new Date(b.dateTimeGMT ?? 0) - +new Date(a.dateTimeGMT ?? 0)).slice(0, 4);

  for (const team of [teamA, teamB]) {
    const byPlayer = new Map<string, Innings[]>();
    const recents = recentFor(team);
    if (!recents.length) warnings.push(`No recent ${format} matches found for ${team}; form may be thin.`);
    const cards = await Promise.all(recents.map((r) => api("match_scorecard", { id: r.id }).catch(() => null)));
    cards.forEach((c, i) => c && collect(c, team, byPlayer, (recents[i].teams as string[]).find((t) => t !== team) ?? "opp"));
    const key = Object.keys(squads).find((k) => hasTeam({ teams: [k] }, team)) ?? team;
    squads[key] = (squads[key] ?? []).map((pl) => ({ ...pl, recent: (byPlayer.get(pl.name) ?? []).slice(0, 5) }));
    if (!squads[key].length) {
      warnings.push(`No squad for ${team}; listing players seen in recent scorecards instead.`);
      squads[key] = [...byPlayer.entries()].map(([name, recent]) => ({ name, role: "Player", team, recent: recent.slice(0, 5) }));
    }
  }

  // Venue history + head-to-head from the matches the provider exposes
  const venue = m.venue ?? "Unknown venue";
  const venueHistory = done.filter((x) => x.venue && norm(x.venue) === norm(venue) && fmtOf(x.matchType) === format).slice(0, 6).map((x) => ({
    date: x.date, teams: (x.teams ?? []).join(" v "), result: x.status,
    firstInningsScore: x.score?.[0] ? `${x.score[0].r}/${x.score[0].w} (${x.score[0].o} ov)` : undefined,
  }));
  if (venueHistory.length < 2) warnings.push("Limited venue history available from the provider.");

  const h2hMatches = done.filter((x) => hasTeam(x, teamA) && hasTeam(x, teamB) && fmtOf(x.matchType) === format);
  const wins: Record<string, number> = { [teamA]: 0, [teamB]: 0 };
  let noResult = 0;
  for (const x of h2hMatches) {
    const s = String(x.status ?? "").toLowerCase();
    if (s.includes(norm(teamA).slice(0, 5)) && s.includes("won")) wins[teamA]++;
    else if (s.includes(norm(teamB).slice(0, 5)) && s.includes("won")) wins[teamB]++;
    else noResult++;
  }
  if (h2hMatches.length < 3) warnings.push("Head-to-head covers only the recent matches the provider exposes, not all-time.");

  return {
    match: { id: m.id, teamA, teamB, format, venue, date: m.date, status: m.status },
    squads, venueHistory,
    h2h: { total: h2hMatches.length, wins, noResult, recent: h2hMatches.slice(0, 5).map((x) => `${x.date}: ${x.status}`) },
    dataSource: "live", warnings,
  };
}
