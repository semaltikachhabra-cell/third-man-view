"use client";

import type { Brief, Player } from "@/lib/types";

export const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export const short = (n: string) => { const p = n.split(" "); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(" ")}` : n; };
export const code = (t: string) => t.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();

export function Card({ title, icon, right, children, className = "" }: { title: string; icon: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-3xl p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/20 text-base">{icon}</span>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 items-end gap-[3px]">{[14, 26, 36, 22, 30, 16].map((h, i) => <span key={i} className="w-[4px] rounded-full bg-gradient-to-t from-orange-500 to-amber-300" style={{ height: h }} />)}</div>
      <div className="leading-tight"><div className="text-xl font-extrabold tracking-tight">Third Man View</div><div className="text-[10px] tracking-[0.25em] text-blue-300">MATCH INTEL</div></div>
    </div>
  );
}

function rowOf(p: { role: string }) {
  if (/keeper|\bwk\b/i.test(p.role)) return 0;
  if (/all-?rounder/i.test(p.role)) return 2;
  if (/bowl|fast|spin|pace/i.test(p.role)) return 3;
  return 1;
}
const TAG = (r: string) => (/keeper/i.test(r) ? "WK" : /all-?rounder/i.test(r) ? "AR" : /bowl|fast|spin|pace/i.test(r) ? "BOWL" : "BAT");

export function Pitch({ xi }: { xi: Brief["predictedXI"]["xi"] }) {
  const rows: typeof xi[] = [[], [], [], []];
  xi.forEach((p) => rows[rowOf(p)].push(p));
  return (
    <div className="pitch relative rounded-2xl p-4">
      <div className="relative z-10 flex flex-col gap-5 py-2">
        {rows.filter((r) => r.length).map((r, i) => (
          <div key={i} className="flex flex-wrap justify-center gap-x-5 gap-y-3">
            {r.map((p) => (
              <div key={p.name} className="group relative flex w-[72px] flex-col items-center text-center">
                <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-sky-300 bg-gradient-to-br from-blue-700 to-slate-900 text-sm font-bold shadow-lg shadow-black/40">{initials(p.name)}</div>
                <div className="mt-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold leading-tight">{short(p.name)}<div className="text-[9px] font-medium text-sky-300">{TAG(p.role)}</div></div>
                <div className="pointer-events-none absolute bottom-full z-30 mb-1 hidden w-48 rounded-lg bg-slate-950 p-2 text-left text-[11px] text-slate-200 shadow-xl ring-1 ring-sky-400/40 group-hover:block">{p.reason}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ player, bowler }: { player?: Player; bowler: boolean }) {
  const vals = (player?.recent ?? []).slice(0, 5).map((i) => (bowler ? i.wickets ?? 0 : i.runs));
  if (!vals.length) return <span className="text-xs text-slate-500">no data</span>;
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-1.5">
      {vals.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className={`w-2.5 rounded-sm ${bowler ? "bg-orange-400" : v >= 40 ? "bg-green-400" : v >= 20 ? "bg-amber-400" : "bg-red-400"}`} style={{ height: 6 + (v / max) * 26 }} />
          <span className="text-[10px] text-slate-400">{v}</span>
        </div>
      ))}
    </div>
  );
}

const BADGE: Record<string, string> = {
  hot: "bg-green-500 text-black", steady: "bg-amber-400 text-black", cold: "bg-red-500 text-white", unknown: "bg-slate-600 text-white",
};
const LABEL: Record<string, string> = { hot: "In form", steady: "Patchy", cold: "Out of form", unknown: "No data" };

export function FormRow({ name, rating, summary, player }: { name: string; rating: string; summary: string; player?: Player }) {
  const bowler = !!player && rowOf(player) === 3;
  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0" title={summary}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-orange-400/80 bg-slate-800 text-sm font-bold">{initials(name)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{short(name)}</div>
        <div className="text-[11px] text-slate-400">{player?.role ?? ""}</div>
      </div>
      <Sparkline player={player} bowler={bowler} />
      <span className={`w-[84px] shrink-0 rounded-md px-2 py-1 text-center text-xs font-bold ${BADGE[rating] ?? BADGE.unknown}`}>{LABEL[rating] ?? "No data"}</span>
    </div>
  );
}

export function Donut({ a, b, labelA, labelB }: { a: number; b: number; labelA: string; labelB: string }) {
  const total = Math.max(a + b, 1);
  const r = 62, c = 2 * Math.PI * r, da = (a / total) * c;
  return (
    <div className="flex items-center justify-center gap-6">
      <div className="text-center"><div className="text-3xl font-extrabold">{a}</div><div className="text-xs text-sky-300">{labelA}</div></div>
      <svg width="160" height="160" viewBox="0 0 160 160" aria-label="head to head">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f97316" strokeWidth="16" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="#2563eb" strokeWidth="16" strokeDasharray={`${da} ${c}`} transform="rotate(-90 80 80)" />
      </svg>
      <div className="text-center"><div className="text-3xl font-extrabold">{b}</div><div className="text-xs text-orange-300">{labelB}</div></div>
    </div>
  );
}

export function parseRuns(s?: string) { const m = s?.match(/^(\d+)/); return m ? Number(m[1]) : undefined; }
