// Temporary diagnostic: lists what the cricket provider returns (never exposes the key).
export async function GET() {
  const key = process.env.CRICKET_API_KEY;
  if (!key) return Response.json({ keySet: false });
  const out: Record<string, unknown> = { keySet: true };
  for (const ep of ["matches", "currentMatches"]) {
    const r = await fetch(`https://api.cricapi.com/v1/${ep}?apikey=${key}&offset=0`);
    const j = await r.json();
    out[ep] = { status: j.status, reason: j.reason, info: j.info, sample: (j.data ?? []).slice(0, 25).map((m: { name: string; matchType: string; date: string; matchEnded: boolean }) => `${m.date} | ${m.matchType} | ${m.name} | ended:${m.matchEnded}`) };
  }
  return Response.json(out);
}
