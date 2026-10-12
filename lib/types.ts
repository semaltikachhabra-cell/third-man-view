export type Format = "T20I" | "ODI" | "Test";

export type BriefRequest =
  | { mode: "id"; matchId: string }
  | { mode: "teams"; teamA: string; teamB: string; format: Format };

export interface Innings {
  against: string;
  runs: number;
  balls: number;
  out: boolean;
  wickets?: number;
  conceded?: number;
  overs?: number;
}

export interface Player {
  name: string;
  role: string;
  team: string;
  battingStyle?: string;
  bowlingStyle?: string;
  recent: Innings[];
}

export interface Dossier {
  match: {
    id?: string;
    teamA: string;
    teamB: string;
    format: Format;
    venue: string;
    date?: string;
    status?: string;
  };
  squads: Record<string, Player[]>;
  venueHistory: { date?: string; teams: string; firstInningsScore?: string; result?: string }[];
  h2h: { total: number; wins: Record<string, number>; noResult: number; recent: string[] };
  dataSource: "live" | "sample";
  warnings: string[];
}

export interface PlayerForm {
  name: string;
  team: string;
  summary: string;
  rating: "hot" | "steady" | "cold" | "unknown";
}

export interface FormAndVenue {
  playerForm: PlayerForm[];
  venueTrends: { title: string; detail: string }[];
  takeaways: string[];
  angles: string[];
}

export interface XI {
  team: string;
  xi: { name: string; role: string; reason: string }[];
  keyCall: string;
  confidence: "High" | "Medium" | "Low";
}

export interface Brief {
  dossier: Dossier;
  playerForm: PlayerForm[];
  venueTrends: FormAndVenue["venueTrends"];
  takeaways: string[];
  angles: string[];
  predictedXI: XI;
  generatedAt: string;
}
