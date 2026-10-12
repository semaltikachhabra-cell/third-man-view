"use client";

import { useState } from "react";
import type { Brief, Format } from "@/lib/types";

const RATING: Record<string, string> = {
  hot: "bg-green-500/20 text-green-300",
  steady: "bg-amber-500/20 text-amber-300",
  cold: "bg-red-500/20 text-red-300",
  unknown: "bg-zinc-500/20 text-zinc-300",
};

export default function Home() {
  const [mode, setMode] = useState<"teams" | "id">("teams");
  const [matchId, setMatchId] = useState("");
  const [teamA, setTeamA] = useState("India");
  const [teamB, setTeamB] = useState("Australia");
  const [format, setFormat] = useState<Format>("T20I");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBrief(null);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "id" ? { mode, matchId } : { mode, teamA, teamB, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setBrief(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toMarkdown(b: Brief) {
    const m = b.dossier.match;
    return [
      `# ${m.teamA} vs ${m.teamB} (${m.format}) – Pre-match briefing`,
      `${m.venue}${m.date ? ` · ${m.date}` : ""}`,
      `\n## Predicted India XI`,
      ...b.predictedXI.xi.map((p, i) => `${i + 1}. **${p.name}** (${p.role}) – ${p.reason}`),
      `\n**Key call:** ${b.predictedXI.keyCall}`,
      `\n## Venue trends`,
      ...b.venueTrends.map((t, i) => `${i + 1}. **${t.title}** – ${t.detail}`),
      `\n## Head-to-head`,
      `${m.teamA}: ${b.dossier.h2h.wins[m.teamA] ?? 0} · ${m.teamB}: ${b.dossier.h2h.wins[m.teamB] ?? 0} (of ${b.dossier.h2h.total})`,
      `\n## Player form`,
      ...b.playerForm.map((p) => `- **${p.name}** (${p.team}, ${p.rating}) – ${p.summary}`),
    ].join("\n");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Third Man View · Match Intel</h1>
      <p className="mt-1 text-zinc-400">Know the match before the toss.</p>

      <form onSubmit={generate} className="mt-6 space-y-3 rounded-xl border border-zinc-800 p-4">
        <div className="flex gap-2">
          {(["teams", "id"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-sm ${mode === m ? "bg-blue-600" : "bg-zinc-800"}`}>
              {m === "teams" ? "Teams + Format" : "Match ID"}
            </button>
          ))}
        </div>
        {mode === "id" ? (
          <input value={matchId} onChange={(e) => setMatchId(e.target.value)} placeholder="Match ID"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2" />
        ) : (
          <div className="flex flex-wrap gap-2">
            <input value={teamA} onChange={(e) => setTeamA(e.target.value)} className="flex-1 rounded-lg bg-zinc-900 px-3 py-2" />
            <span className="self-center">vs</span>
            <input value={teamB} onChange={(e) => setTeamB(e.target.value)} className="flex-1 rounded-lg bg-zinc-900 px-3 py-2" />
            {(["T20I", "ODI", "Test"] as Format[]).map((f) => (
              <button key={f} type="button" onClick={() => setFormat(f)}
                className={`rounded-lg px-3 py-2 text-sm ${format === f ? "bg-orange-500 text-black" : "bg-zinc-800"}`}>{f}</button>
            ))}
          </div>
        )}
        <button disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold disabled:opacity-50">
          {loading ? "Generating briefing…" : "Generate Briefing"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-red-300">{error}</p>}

      {brief && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">{brief.dossier.match.teamA} vs {brief.dossier.match.teamB} · {brief.dossier.match.format}</h2>
              <p className="text-zinc-400">{brief.dossier.match.venue}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(toMarkdown(brief))}
              className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black">Copy for newsletter</button>
          </div>

          {brief.dossier.warnings.map((w) => (
            <p key={w} className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">{w}</p>
          ))}

          <div className="rounded-xl border border-zinc-800 p-4">
            <h3 className="font-semibold">Predicted India XI</h3>
            <ol className="mt-2 space-y-1">
              {brief.predictedXI.xi.map((p) => (
                <li key={p.name}><b>{p.name}</b> <span className="text-zinc-400">({p.role})</span> – {p.reason}</li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-zinc-300"><b>Key call:</b> {brief.predictedXI.keyCall}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 p-4">
            <h3 className="font-semibold">Top 3 venue trends</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {brief.venueTrends.map((t) => <li key={t.title}><b>{t.title}</b> – {t.detail}</li>)}
            </ol>
          </div>

          <div className="rounded-xl border border-zinc-800 p-4">
            <h3 className="font-semibold">Head-to-head</h3>
            <p className="mt-1">
              {brief.dossier.match.teamA} {brief.dossier.h2h.wins[brief.dossier.match.teamA] ?? 0} – {brief.dossier.h2h.wins[brief.dossier.match.teamB] ?? 0} {brief.dossier.match.teamB}
              <span className="text-zinc-400"> (of {brief.dossier.h2h.total})</span>
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 p-4">
            <h3 className="font-semibold">Player form</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {brief.playerForm.map((p) => (
                <div key={p.team + p.name} className="rounded-lg bg-zinc-900 p-3">
                  <div className="flex items-center justify-between">
                    <b>{p.name}</b>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${RATING[p.rating] ?? RATING.unknown}`}>{p.rating}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{p.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
