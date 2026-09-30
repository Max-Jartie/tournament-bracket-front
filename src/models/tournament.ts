export type MatchStatus = 'pending' | 'ready' | 'completed';

export interface Player {
  id: string;
  name: string;
  disqualified?: boolean;
}

export interface Match {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: Player | null;
  player2: Player | null;
  winnerId: string | null;
  status: MatchStatus;
  sourceMatch1Id?: string;
  sourceMatch2Id?: string;
}

export interface Round {
  id: string;
  index: number;
  name: string;
  matches: Match[];
}

export interface Tournament {
  players: Player[];
  rounds: Round[];
  thirdPlaceMatch: Match | null;
  champion: Player | null;
  started: boolean;
}
