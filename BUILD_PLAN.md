# End-Term Build: Pre-Match Cricket Intelligence Briefing (Medium)

## Rules from the booklet
1. Use live external data wherever possible; the system must work with some data at submission time.
2. All AI tasks use **Gemini Flash**. No Claude API.
3. Deploy on **Vercel**. Submit: public URL + GitHub repo link + Components Map.
Scoring: Components Map 10 / Vercel link 10 / Design 10 / Backend + build quality 25 / Demo video 5 per the doc, but you've said none is required (Build = 60%). Viva Thu 15 Oct.

## The problem (Statement 3, Medium)
Arjun runs the newsletter *Third Man View* (2,400 subscribers). Before every India match he spends 1.5h (T20I) to 3h (ODI/Test) researching. Build an agent that, given a match (match ID **or** team names + format), fetches live data and produces a structured brief:
- Form summary per player (both squads, last 5 innings)
- Venue statistics, with the **3 most relevant venue trends**
- Head-to-head record
- Arjun's AI-assisted **predicted playing XI with one-line reasoning per pick**

## Scope (what we build, what we don't)
In: match input (ID or teams+format), data fetch, Gemini-generated brief, copy/export for the newsletter, graceful errors.
Out: auth, database, payments, sending the newsletter.
Success: a brief for an upcoming or recent India match in under ~30s that Arjun can paste into his newsletter.

## Architecture (Next.js on Vercel)
```
[Input form] -> POST /api/brief
   1. resolve match (ID lookup, or teams+format -> upcoming/recent fixture)
   2. fetch in parallel: squads, per-player last-5 innings, venue stats, H2H
   3. normalise into one JSON "match dossier"
   4. Gemini Flash call #1: form summaries + venue trends (JSON schema output)
   5. Gemini Flash call #2: predicted XI + one-line reasoning (grounded only in the dossier)
   6. validate JSON, fill gaps with "data unavailable" flags
-> Brief UI (sections) + copy as markdown/newsletter text
```
Reliability design (this is the 25% marks and your viva material):
- Gemini gets only the fetched dossier, told not to invent stats; every stat shown comes from the data, the model only summarises and reasons.
- Structured JSON output with schema validation; retry once on malformed output.
- Fallback cache: a pre-saved real dossier so the demo works if the data API is down or rate-limited.
- Edge cases: unknown team, no upcoming match, squad not announced (use last XI), missing player data, new venue (no history), API timeout, ODI vs Test vs T20I (different number of innings and venue metrics).

## Components Map (deliverable, 10%)
Input (match ID / teams+format) -> Match resolver -> Data fetchers (squads, player form, venue, H2H) -> Dossier builder -> Gemini Flash (form + venue trends) -> Gemini Flash (XI + reasoning) -> Validator/fallback -> Brief UI + export. Draw as a simple left-to-right diagram with the external APIs and Gemini marked as external.

## Timeline back from 11:59 PM
- 8:15 PM: this plan confirmed; keys obtained; repo created
- 8:15-10:00: backend (resolver, fetchers, dossier, 2 Gemini calls, validation)
- 10:00-10:30: UI wired to the API; deploy to Vercel; test live URL
- 10:30-10:50: apply designed UI
- 10:50-11:30: components map, README, edge-case testing on the live URL
- 11:30-11:45: check links open logged out; you submit on Nexus

## What I need from you
1. **Gemini API key** (Google AI Studio, free). Put it in Vercel env vars, never in the repo.
2. **Cricket data API key.** There's no official Cricinfo API. Easiest options: CricAPI (cricapi.com) free tier, or a Cricbuzz API on RapidAPI. Sign up and send me which one you got (I'll write the code for it). Never paste keys into chat; put them in a local `.env.local` I'll create a template for.
3. **GitHub** repo (or let me create the files locally and you push) and **Vercel** account connected to it.
4. Confirm you were on **Medium** (the booklet's Statement 3 is Medium).
5. Generated UI images from the prompt below.
6. You submit on Nexus (Vercel link + Components Map; no demo video needed).

## UI prompt for ChatGPT image generation
> Design a high-fidelity web app UI mockup, desktop 1440x900, for "Third Man View: Match Intel", a pre-match cricket intelligence briefing tool for a cricket newsletter writer. Visual concept: a broadcast-night cricket control room. Deep midnight-navy background with floodlight-glow gradients, India-blue (#0B5FFF) and electric saffron-orange (#FF8A1F) accents, pitch-green (#2ECC71) for "in form" and crimson for "out of form". Glassmorphism cards with subtle grain, razor-thin glowing borders, large condensed sports-broadcast headlines (like a TV scorebug) paired with a clean modern sans for body text.
> Show three screens in one image, side by side:
> (1) Landing/input: a huge headline "Know the match before the toss." A single command-bar style input with a toggle between "Match ID" and "Teams + Format" (T20I / ODI / Test chips), a glowing "Generate Briefing" button, and a faint stadium-floodlight silhouette in the background.
> (2) Loading state: an animated-looking progress timeline styled as a ball-by-ball over tracker, with six dots filling as steps complete: "Finding match", "Pulling squads", "Reading player form", "Scanning the pitch", "Head-to-head", "Picking the XI".
> (3) The briefing result page: a sticky top "scorebug" bar with IND vs opponent, format, venue and date. Below, a bento grid: a pitch-shaped card showing the predicted XI laid out on a top-down cricket field (11 circular player avatars with role icons, each with a one-line reason on hover), player form cards with 5-innings mini bar sparklines and green/amber/red form badges, a venue card with the "Top 3 trends" as bold numbered callouts and a small bar chart, a head-to-head card with a split win/loss ring chart in team colors, and a floating "Copy for newsletter" button with an "Export Markdown" secondary button.
> Style: premium, dramatic, modern sports-tech dashboard, consistent 8px grid, rounded 20px corners, high contrast and readable text, no real player photos or logos, realistic placeholder stats. Also include a small mobile (390px) version of the result page in the corner.
