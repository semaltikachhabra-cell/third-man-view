import type { Dossier, Innings, Player } from "./types";

// Offline fallback so the app always works at submission time.
// Figures are ILLUSTRATIVE (not real match data) and the UI labels them as sample data.
const inn = (against: string, runs: number, balls: number, out = true): Innings => ({ against, runs, balls, out });
const bowl = (against: string, wickets: number, conceded: number, overs: number): Innings => ({
  against, runs: 0, balls: 0, out: false, wickets, conceded, overs,
});

const p = (name: string, role: string, team: string, recent: Innings[], bowling?: string): Player => ({
  name, role, team, bowlingStyle: bowling, recent,
});

export const sampleDossier: Dossier = {
  match: {
    teamA: "India",
    teamB: "Australia",
    format: "T20I",
    venue: "Narendra Modi Stadium, Ahmedabad",
    status: "Sample fixture",
  },
  squads: {
    India: [
      p("Abhishek Sharma", "Opening Batter", "India", [inn("AUS", 54, 28), inn("AUS", 12, 9), inn("ENG", 68, 34), inn("ENG", 5, 6), inn("NZ", 41, 22)]),
      p("Sanju Samson", "Wicketkeeper Batter", "India", [inn("AUS", 31, 21), inn("AUS", 8, 10), inn("ENG", 22, 15), inn("ENG", 47, 26), inn("NZ", 0, 2)]),
      p("Suryakumar Yadav", "Top-order Batter (C)", "India", [inn("AUS", 39, 24), inn("AUS", 61, 33, false), inn("ENG", 14, 11), inn("ENG", 28, 17), inn("NZ", 52, 30)]),
      p("Tilak Varma", "Middle-order Batter", "India", [inn("AUS", 24, 20), inn("AUS", 7, 8), inn("ENG", 55, 37, false), inn("ENG", 19, 16), inn("NZ", 33, 27)]),
      p("Hardik Pandya", "All-rounder", "India", [inn("AUS", 38, 19, false), inn("AUS", 15, 12), inn("ENG", 29, 18), inn("ENG", 6, 7), inn("NZ", 44, 21, false)], "Right-arm medium"),
      p("Shivam Dube", "All-rounder", "India", [inn("AUS", 17, 12), inn("AUS", 34, 20), inn("ENG", 9, 8), inn("ENG", 26, 16, false), inn("NZ", 12, 10)], "Right-arm medium"),
      p("Axar Patel", "Spin All-rounder", "India", [inn("AUS", 21, 14, false), inn("AUS", 9, 8), inn("ENG", 17, 13), inn("ENG", 0, 1), inn("NZ", 11, 9)], "Slow left-arm orthodox"),
      p("Kuldeep Yadav", "Spinner", "India", [bowl("AUS", 2, 24, 4), bowl("AUS", 1, 31, 4), bowl("ENG", 3, 27, 4), bowl("ENG", 0, 38, 4), bowl("NZ", 2, 29, 4)], "Left-arm wrist spin"),
      p("Varun Chakravarthy", "Spinner", "India", [bowl("AUS", 2, 22, 4), bowl("AUS", 1, 26, 4), bowl("ENG", 2, 30, 4), bowl("ENG", 1, 28, 4), bowl("NZ", 3, 19, 4)], "Right-arm leg spin"),
      p("Arshdeep Singh", "Fast Bowler", "India", [bowl("AUS", 1, 33, 4), bowl("AUS", 2, 29, 4), bowl("ENG", 0, 41, 4), bowl("ENG", 3, 25, 4), bowl("NZ", 1, 35, 4)], "Left-arm fast-medium"),
      p("Jasprit Bumrah", "Fast Bowler", "India", [bowl("AUS", 2, 18, 4), bowl("AUS", 3, 21, 4), bowl("ENG", 1, 24, 4), bowl("ENG", 2, 17, 4), bowl("NZ", 2, 22, 4)], "Right-arm fast"),
      p("Shubman Gill", "Opening Batter", "India", [inn("AUS", 28, 22), inn("AUS", 11, 12), inn("ENG", 37, 25), inn("ENG", 4, 5), inn("NZ", 29, 24)]),
    ],
    Australia: [
      p("Travis Head", "Opening Batter", "Australia", [inn("IND", 22, 14), inn("IND", 47, 25), inn("SA", 71, 38), inn("SA", 9, 7), inn("PAK", 36, 20)]),
      p("Mitchell Marsh", "All-rounder (C)", "Australia", [inn("IND", 30, 18), inn("IND", 5, 6), inn("SA", 44, 27), inn("SA", 18, 12), inn("PAK", 61, 32, false)], "Right-arm medium"),
      p("Josh Inglis", "Wicketkeeper Batter", "Australia", [inn("IND", 14, 12), inn("IND", 40, 22), inn("SA", 6, 8), inn("SA", 32, 19), inn("PAK", 27, 17)]),
      p("Tim David", "Finisher", "Australia", [inn("IND", 19, 10, false), inn("IND", 8, 7), inn("SA", 35, 18), inn("SA", 12, 9), inn("PAK", 4, 5)]),
      p("Glenn Maxwell", "All-rounder", "Australia", [inn("IND", 11, 9), inn("IND", 26, 14), inn("SA", 0, 3), inn("SA", 52, 24), inn("PAK", 18, 11)], "Off-spin"),
      p("Marcus Stoinis", "All-rounder", "Australia", [inn("IND", 16, 13), inn("IND", 21, 15, false), inn("SA", 33, 22), inn("SA", 7, 6), inn("PAK", 29, 19)], "Right-arm medium"),
      p("Pat Cummins", "Fast Bowler", "Australia", [bowl("IND", 1, 34, 4), bowl("IND", 0, 41, 4), bowl("SA", 2, 28, 4), bowl("SA", 1, 32, 4), bowl("PAK", 2, 26, 4)], "Right-arm fast"),
      p("Mitchell Starc", "Fast Bowler", "Australia", [bowl("IND", 2, 37, 4), bowl("IND", 1, 44, 4), bowl("SA", 1, 30, 4), bowl("SA", 3, 27, 4), bowl("PAK", 0, 39, 4)], "Left-arm fast"),
      p("Josh Hazlewood", "Fast Bowler", "Australia", [bowl("IND", 1, 28, 4), bowl("IND", 2, 31, 4), bowl("SA", 2, 24, 4), bowl("SA", 0, 35, 4), bowl("PAK", 1, 29, 4)], "Right-arm fast-medium"),
      p("Adam Zampa", "Spinner", "Australia", [bowl("IND", 2, 29, 4), bowl("IND", 1, 36, 4), bowl("SA", 3, 25, 4), bowl("SA", 1, 33, 4), bowl("PAK", 2, 27, 4)], "Right-arm leg spin"),
      p("Cameron Green", "All-rounder", "Australia", [inn("IND", 23, 18), inn("IND", 4, 6), inn("SA", 38, 26), inn("SA", 15, 14), inn("PAK", 20, 15)], "Right-arm fast-medium"),
      p("Matthew Short", "Opening Batter", "Australia", [inn("IND", 9, 8), inn("IND", 33, 21), inn("SA", 24, 16), inn("SA", 51, 29), inn("PAK", 13, 10)], "Off-spin"),
    ],
  },
  venueHistory: [
    { teams: "IND v ENG", firstInningsScore: "224/2", result: "Team batting first won" },
    { teams: "IND v NZ", firstInningsScore: "234/4", result: "Team batting first won" },
    { teams: "IND v ENG", firstInningsScore: "166/8", result: "Team batting second won" },
    { teams: "IND v AUS", firstInningsScore: "187/5", result: "Team batting first won" },
  ],
  h2h: {
    total: 32,
    wins: { India: 20, Australia: 11 },
    noResult: 1,
    recent: ["India won by 6 wickets", "Australia won by 5 wickets", "India won by 20 runs", "India won by 44 runs", "Australia won by 4 wickets"],
  },
  dataSource: "sample",
  warnings: ["Showing built-in sample data (illustrative figures, not live)."],
};
