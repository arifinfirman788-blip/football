/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  flag: string; // Emoji flag or URL, let's map beautiful SVG or clean icons
  rank: number;
}

export interface Match {
  id: string;
  stage: string;       // e.g. "小组赛·第2轮", "1/8决赛"
  time: string;        // e.g. "2025年6月2日", "06-02 23:00"
  dateKey: string;     // e.g. "2025-06-02"
  timestamp: string;   // e.g. "20:00", "23:00"
  kickoffUtc?: string; // Official source kickoff time in UTC for timezone-safe display
  venue?: string;
  city?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  status: 'conducting' | 'unstarted' | 'ended'; // "进行中" | "未开始" | "已结束"
  userChoice?: 'home' | 'draw' | 'away';        // prediction choice if any
  group?: string;      // e.g. "A组", "B组", "C组", etc.
}

export interface GroupTeam {
  team: Team;
  played: number;
  points: number;
  goalDiff: string; // e.g. "+3", "0", "-4"
  rank: number;
}

export interface Group {
  id: string; // A, B, C, D
  teams: GroupTeam[];
}

export interface TransferHistory {
  date: string;       // e.g. "2023.08"
  clubAddress: string; // e.g. "利雅得新月"
  fee: string;        // e.g. "转会费 €9000万" / "出道"
}

export interface Player {
  id: string;
  name: string;
  englishName: string;
  number: number;
  position: string;
  photo: string;
  teamName: string;
  flag: string;
  worldRank: number;
  age: number;
  height: string;
  weight: string;
  club: string;
  nationality: string;
  stats: {
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    speed: number;
  };
  starRatings: {
    speed: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
  };
  transfers: TransferHistory[];
}

export interface PredictionSlip {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  matchTime: string;
  choice: 'home' | 'draw' | 'away';
  status: 'pending' | 'submitted' | 'settled';
}
