/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  flag: string; // 当前使用 Emoji 国旗；如替换为切图，可改为图片 URL。
  rank: number;
}

export interface Match {
  id: string;
  stage: string;       // 例如“小组赛·第2轮”“1/8决赛”。
  time: string;        // 页面展示用的北京时间日期文案。
  dateKey: string;     // 北京时间日期，格式 YYYY-MM-DD。
  timestamp: string;   // 北京时间，格式 HH:mm。
  kickoffUtc?: string; // 官方 UTC 开球时间。倒计时优先使用它，避免浏览器时区差异。
  venue?: string;
  city?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  status: 'conducting' | 'unstarted' | 'ended'; // 进行中 / 未开始 / 已结束。
  userChoice?: 'home' | 'draw' | 'away';        // 可选：用户对该场比赛的本地选择。
  group?: string;      // 小组编号，例如 A、B、C。
}

export interface GroupTeam {
  team: Team;
  played: number;
  points: number;
  goalDiff: string; // 示例："+3"、"0"、"-4"。
  rank: number;
}

export interface Group {
  id: string; // 小组编号，例如 A、B、C、D。
  teams: GroupTeam[];
}

export interface TransferHistory {
  date: string;        // 示例："2023.08"。
  clubAddress: string; // 示例："利雅得新月"。
  fee: string;         // 示例："转会费 €9000万" / "出道"。
}

export interface Player {
  id: string;
  name: string;
  englishName: string;
  profileStatus?: 'confirmed' | 'pending' | 'loading';
  profileSummary?: string;
  profileDataNote?: string;
  profileUpdatedAt?: string;
  profileSources?: Array<{ title: string; uri: string }>;
  number?: number;
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

export interface PredictionRecord {
  // 用户提交后的竞猜明细。正式版建议与服务端竞猜订单结构保持一致。
  matchId: string;
  fixture: string;
  choice: string;
  outcome: 'home' | 'draw' | 'away';
  time: string;
  dateKey: string;
  timestamp: string;
  stage: string;
  status: '待开奖' | '猜对 +1' | '猜错 +0';
  points: number | null; // 空值代表赛后尚未结算；0 和 1 分别代表猜错、猜对。
}
