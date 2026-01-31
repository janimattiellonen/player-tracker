export interface TournamentResult {
  place: string;
  points: string;
  tournament: {
    name: string;
    url: string;
  };
  tier: string;
  dates: string;
  prize: string;
}

export interface PlayerResults {
  pdgaNumber: string;
  results: TournamentResult[];
}
