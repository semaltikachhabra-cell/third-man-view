import { generateBrief } from "@/lib/brief";
import type { BriefRequest, Format } from "@/lib/types";

export const maxDuration = 120;

const FORMATS: Format[] = ["T20I", "ODI", "Test"];

export async function POST(request: Request) {
  let body: Partial<BriefRequest> & Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  let req: BriefRequest;
  if (body.mode === "id" && body.matchId?.trim()) {
    req = { mode: "id", matchId: body.matchId.trim() };
  } else if (body.mode === "teams" && body.teamA?.trim() && body.teamB?.trim() && FORMATS.includes(body.format as Format)) {
    if (body.teamA.trim().toLowerCase() === body.teamB.trim().toLowerCase()) {
      return Response.json({ error: "Pick two different teams." }, { status: 400 });
    }
    req = { mode: "teams", teamA: body.teamA.trim(), teamB: body.teamB.trim(), format: body.format as Format };
  } else {
    return Response.json({ error: "Provide a match ID, or two teams and a format." }, { status: 400 });
  }

  try {
    return Response.json(await generateBrief(req));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Could not generate the brief." }, { status: 502 });
  }
}
