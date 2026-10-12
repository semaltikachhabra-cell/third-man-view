"use client";

import { useEffect, useState } from "react";
import type { Brief, Format } from "@/lib/types";
import { Card, Donut, FormRow, Logo, Pitch, code, parseRuns } from "@/components/ui";

const STEPS = [
  ["🔍", "Finding match", "Fetching official match data…"],
  ["👥", "Pulling squads", "Getting latest squad and injuries…"],
  ["📊", "Reading player form", "Analysing last 5 innings…"],
  ["🏟️", "Scanning the pitch", "Checking venue history and conditions…"],
  ["🏆", "Head-to-head", "Crunching previous encounters…"],
  ["👕", "Picking the XI", "Running combination analysis…"],
];
const RECENT: { label: string; a: string; b: string; f: Format }[] = [
  { label: "IND vs AUS (T20I)", a: "India", b: "Australia", f: "T20I" },
  { label: "ENG vs IND (ODI)", a: "India", b: "England", f: "ODI" },
  { label: "IND vs NZ (Test)", a: "India", b: "New Zealand", f: "Test" },
];

export default function Home() {
  const [mode, setMode] = useState<"id" | "teams">("teams");
  const [matchId, setMatchId] = useState("");
  const [teamA, setTeamA] = useState("India");
  const [teamB, setTeamB] = useState("Australia");
  const [format, setFormat] = useState<Format>("T20I");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, [loading]);

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setStep(0); window.scrollTo(0, 0); setError(""); setBrief(null); setShowAll(false);
    try {
      const res = await fetch("/api/brief", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "id" ? { mode, matchId } : { mode, teamA, teamB, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setBrief(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  function markdown(b: Brief) {
    const m = b.dossier.match, h = b.dossier.h2h;
    return [
      `# ${m.teamA} vs ${m.teamB} (${m.format}): pre-match briefing`, `${m.venue}${m.date ? ` · ${m.date}` : ""}`,
      `\n## Predicted XI (confidence: ${b.predictedXI.confidence})`, ...b.predictedXI.xi.map((p, i) => `${i + 1}. **${p.name}** (${p.role}): ${p.reason}`),
      `\n**Key call:** ${b.predictedXI.keyCall}`,
      `\n## Top 3 venue trends`, ...b.venueTrends.map((t, i) => `${i + 1}. **${t.title}**: ${t.detail}`),
      `\n## Head-to-head`, `${m.teamA} ${h.wins[m.teamA] ?? 0} – ${h.wins[m.teamB] ?? 0} ${m.teamB} (${h.total} matches)`,
      `\n## Key takeaways`, ...b.takeaways.map((t) => `- ${t}`),
      `\n## Angles for your write-up`, ...b.angles.map((t) => `- ${t}`),
      `\n## Player form`, ...b.playerForm.map((p) => `- **${p.name}** (${p.team}, ${p.rating}): ${p.summary}`),
    ].join("\n");
  }
  const copy = async () => { if (!brief) return; await navigator.clipboard.writeText(markdown(brief)); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const download = () => {
    if (!brief) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown(brief)], { type: "text/markdown" }));
    a.download = `briefing-${code(brief.dossier.match.teamA)}-v-${code(brief.dossier.match.teamB)}.md`; a.click();
  };
  const reset = () => { setBrief(null); setError(""); };

  const actions = (className = "") => (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button onClick={reset} className="btn-ghost">🔍 New Briefing</button>
      <button onClick={download} className="btn-ghost">⬇ Export Markdown</button>
      <button onClick={copy} className="btn-orange">{copied ? "✓ Copied" : "📋 Copy for newsletter"}</button>
    </div>
  );

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8">
        <Logo />
        <h1 className="mt-14 text-5xl font-extrabold italic leading-tight tracking-tight">Pulling every<br /><span className="grad-blue">angle together…</span></h1>
        <p className="mt-4 text-slate-300">Analysing squads, form, pitch and history. This takes less than a minute.</p>
        <ol className="mt-8 space-y-3">
          {STEPS.map(([icon, title, sub], i) => (
            <li key={title} className={`glass flex items-center gap-4 rounded-2xl p-4 transition ${i === step ? "ring-2 ring-orange-400/70" : i < step ? "ring-1 ring-green-400/50" : "opacity-60"}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-xl">{icon}</span>
              <div className="flex-1"><div className="font-bold">{title}</div><div className="text-xs text-slate-400">{sub}</div></div>
              {i < step ? <span className="grid h-7 w-7 place-items-center rounded-full bg-green-500 text-black">✓</span> : i === step ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" /> : <span className="h-6 w-6 rounded-full border-2 border-slate-500" />}
            </li>
          ))}
        </ol>
      </main>
    );
  }

  /* ---------- Result ---------- */
  if (brief) {
    const d = brief.dossier, m = d.match;
    const byName = new Map(Object.values(d.squads).flat().map((p) => [p.name, p]));
    const inXI = new Set(brief.predictedXI.xi.map((p) => p.name));
    const sorted = [...brief.playerForm].sort((a, b) => Number(/india/i.test(b.team)) - Number(/india/i.test(a.team)) || Number(inXI.has(b.name)) - Number(inXI.has(a.name)));
    const shown = showAll ? sorted : sorted.slice(0, 5);
    const scores = d.venueHistory.map((v) => ({ label: v.teams, runs: parseRuns(v.firstInningsScore) })).filter((v) => v.runs !== undefined) as { label: string; runs: number }[];
    const avg = scores.length ? Math.round(scores.reduce((s, v) => s + v.runs, 0) / scores.length) : undefined;
    const maxRuns = Math.max(...scores.map((s) => s.runs), 1);
    const wA = d.h2h.wins[m.teamA] ?? 0, wB = d.h2h.wins[m.teamB] ?? 0;
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3"><Logo />{actions()}</header>

        <div className="glass mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl p-4">
          <div className="flex items-center gap-3 text-3xl font-extrabold"><span>{code(m.teamA)}</span><span className="text-sm font-medium text-slate-400">VS</span><span>{code(m.teamB)}</span></div>
          <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold">{m.format}</span>
          <div className="text-sm text-slate-300">📍 {m.venue}</div>
          {m.date && <div className="text-sm text-slate-300">🗓 {m.date}</div>}
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${d.dataSource === "live" ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}`}>{d.dataSource === "live" ? "Live data" : "Sample data"}</span>
        </div>
        {d.warnings.map((w) => <p key={w} className="mt-3 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">{w}</p>)}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card title="Predicted XI" icon="📋" right={<span className="rounded-full bg-white/10 px-3 py-1 text-xs">Confidence <b className="ml-1 rounded-full bg-green-500 px-2 py-0.5 text-black">{brief.predictedXI.confidence}</b></span>}>
            <Pitch xi={brief.predictedXI.xi} />
            <p className="mt-3 text-sm text-slate-300"><b className="text-orange-300">Key call:</b> {brief.predictedXI.keyCall}</p>
            <p className="mt-1 text-[11px] text-slate-500">Hover a player for the reasoning.</p>
          </Card>

          <Card title="Player Form" icon="📈" right={<button onClick={() => setShowAll(!showAll)} className="text-sm text-sky-300">{showAll ? "Show less" : `View all →`}</button>}>
            {shown.map((p) => <FormRow key={p.team + p.name} name={p.name} rating={p.rating} summary={p.summary} player={byName.get(p.name)} />)}
            <p className="mt-2 text-[11px] text-slate-500">Bars: runs (batters) or wickets (bowlers) over the last 5 innings.</p>
          </Card>

          <Card title="Venue Intel" icon="📍" right={<span className="text-xs text-slate-400">{d.venueHistory.length} recent matches</span>}>
            <div className="text-sm text-slate-300">{m.venue}{avg !== undefined && <> · Avg 1st inns: <b>{avg}</b></>}</div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold">Top 3 trends</div>
                <ol className="space-y-3">{brief.venueTrends.map((t, i) => (
                  <li key={t.title} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500 font-bold text-black">{i + 1}</span><div className="text-sm"><b>{t.title}</b><div className="text-slate-300">{t.detail}</div></div></li>
                ))}</ol>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">First-innings scores</div>
                {scores.length ? <div className="flex h-36 items-end gap-3">{scores.map((s, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1"><span className="text-[11px]">{s.runs}</span><div className="w-full rounded-t bg-gradient-to-t from-blue-600 to-sky-400" style={{ height: `${(s.runs / maxRuns) * 100}px` }} /><span className="text-center text-[9px] text-slate-400">{s.label}</span></div>
                ))}</div> : <p className="text-sm text-slate-400">No venue scores available.</p>}
              </div>
            </div>
          </Card>

          <Card title="Head-to-Head" icon="🏆" right={<span className="text-xs text-slate-400">Last {d.h2h.total} meetings ({m.format})</span>}>
            <Donut a={wA} b={wB} labelA={code(m.teamA)} labelB={code(m.teamB)} />
            <ul className="mt-3 space-y-1 text-xs text-slate-400">{d.h2h.recent.slice(0, 3).map((r) => <li key={r}>• {r}</li>)}</ul>
          </Card>

          <Card title="Key Takeaways" icon="💡"><ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">{brief.takeaways.map((t) => <li key={t}>{t}</li>)}</ul></Card>
          <Card title="Suggested Angles for Your Write-up" icon="✍️"><ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">{brief.angles.map((t) => <li key={t}>{t}</li>)}</ul></Card>
        </div>
        {actions("mt-6 sm:hidden")}
      </main>
    );
  }

  /* ---------- Landing ---------- */
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex items-center justify-between"><Logo /><nav className="hidden gap-5 text-sm text-slate-300 sm:flex"><span>How it works</span><span>Sample Brief</span><span>For Writers</span></nav></header>
      <h1 className="mt-14 text-6xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">Know the match<br /><span className="grad-fire">before the toss.</span></h1>
      <p className="mt-5 max-w-xl text-lg text-slate-300">AI-powered pre-match intelligence for cricket writers, newsletters and creators.</p>
      <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-300"><span>⚡ Squad insights in seconds</span><span>📊 Form, matchups and pitch intel</span><span>📄 Ready to use in your write-up</span></div>

      <form onSubmit={generate} className="glass mt-8 rounded-3xl p-5">
        <div className="inline-flex rounded-xl bg-white/5 p-1">
          {(["id", "teams"] as const).map((k) => <button key={k} type="button" onClick={() => setMode(k)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === k ? "bg-blue-600" : "text-slate-300"}`}>{k === "id" ? "Match ID" : "Teams + Format"}</button>)}
        </div>
        {mode === "id" ? (
          <label className="mt-4 block text-sm text-slate-300">Enter match ID
            <input value={matchId} onChange={(e) => setMatchId(e.target.value)} placeholder="e.g. 123718" className="field mt-2" />
          </label>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3"><input aria-label="Team A" value={teamA} onChange={(e) => setTeamA(e.target.value)} className="field" /><span className="text-slate-400">vs</span><input aria-label="Team B" value={teamB} onChange={(e) => setTeamB(e.target.value)} className="field" /></div>
            <div className="flex gap-2">{(["T20I", "ODI", "Test"] as Format[]).map((f) => <button key={f} type="button" onClick={() => setFormat(f)} className={`rounded-lg px-4 py-2 text-sm font-bold ${format === f ? "bg-orange-500 text-black" : "bg-white/10"}`}>{f}</button>)}</div>
          </div>
        )}
        <div className="mt-4 text-sm text-slate-400">or try a recent match</div>
        <div className="mt-2 flex flex-wrap gap-2">{RECENT.map((r) => <button key={r.label} type="button" onClick={() => { setMode("teams"); setTeamA(r.a); setTeamB(r.b); setFormat(r.f); }} className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10">{r.label}</button>)}</div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button disabled={mode === "id" && !matchId.trim()} className="btn-orange mt-5 w-full py-4 text-lg disabled:opacity-50">✦ Generate Briefing →</button>
      </form>
    </main>
  );
}
