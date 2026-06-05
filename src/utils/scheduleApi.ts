import { MATCHES_DATA, TEAMS } from '../data';
import { Match, Team } from '../types';
import { API_BASE_URL } from './apiConfig';

interface ApiMessage {
  code: number;
  detail: string | null;
  message: string;
  status: number;
}

interface ApiPageData<T> {
  currentPage: number;
  list: T[];
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

interface ApiPageResponse<T> {
  data: ApiPageData<T>;
  message: ApiMessage;
}

interface ApiResponse<T> {
  data: T;
  message: ApiMessage;
}

interface ApiMatchItem {
  id: number;
  match_no: number;
  stage: string;
  stage_label: string;
  group_id: number | null;
  group_name: string | null;
  round_no: number | null;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_team_flag: string | null;
  away_team_flag: string | null;
  home_world_rank: number | null;
  away_world_rank: number | null;
  venue_name: string | null;
  start_time: string;
  status: 'not_started' | 'live' | 'finished';
  home_score: number | null;
  away_score: number | null;
  regular_result: string | null;
  winner_team_id: number | null;
  is_settled: boolean;
}

interface ApiPredictionItem {
  prediction_id: number;
  match_id: number;
  match_no: number;
  stage: string;
  stage_label: string;
  group_id: number | null;
  group_name: string | null;
  round_no: number | null;
  venue_name: string | null;
  start_time: string;
  status: 'not_started' | 'live' | 'finished';
  home_team_id: number;
  home_team_name: string;
  home_team_flag: string | null;
  home_world_rank: number | null;
  away_team_id: number;
  away_team_name: string;
  away_team_flag: string | null;
  away_world_rank: number | null;
  prediction_result: 'home_win' | 'draw' | 'away_win';
  prediction_label: string;
  home_score: number | null;
  away_score: number | null;
  regular_result: string | null;
  regular_result_label: string | null;
  settlement_status: 'pending' | 'settled';
  is_correct: number | null;
  points_awarded: number;
  submitted_at: string;
  last_updated_at: string;
  settled_at: string | null;
}

interface ApiGroupTeamItem {
  group_team_id: number;
  group_id: number;
  team_id: number;
  team_name: string;
  team_short_name: string | null;
  country_code: string | null;
  flag_url: string | null;
  world_rank: number | null;
  played: number;
  win_count: number;
  draw_count: number;
  lose_count: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  rank_no: number | null;
}

interface ApiGroupTeamsData {
  group: {
    id: number;
    name: string;
    sort_no: number | null;
  };
  teams: ApiGroupTeamItem[];
}

export interface ScheduleGroupStanding {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiffValue: number;
  goalDiff: string;
  points: number;
  rank: number;
}

export interface ScheduleGroupData {
  id: string;
  numericId: number;
  name: string;
  sortNo: number;
  standings: ScheduleGroupStanding[];
}

const teamByName = new Map<string, Team>(
  Object.values(TEAMS).map((team) => [team.name, team])
);

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatBeijingDateParts = (isoString: string) => {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((part) => part.type === type)?.value || ''
  );

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const weekday = getPart('weekday');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return {
    dateKey: `${year}-${pad2(Number(month))}-${pad2(Number(day))}`,
    time: `北京时间 ${month}月${day}日 ${weekday}`,
    timestamp: `${hour}:${minute}`,
  };
};

const mapStageLabel = (item: ApiMatchItem) => {
  if (item.stage === 'group' && item.round_no) {
    return `${item.stage_label}·第${item.round_no}轮`;
  }
  return item.stage_label || item.stage;
};

const mapStatus = (status: ApiMatchItem['status']): Match['status'] => {
  if (status === 'live') return 'conducting';
  if (status === 'finished') return 'ended';
  return 'unstarted';
};

const mapTeam = (name: string, rank: number | null, fallbackFlagUrl: string | null): Team => {
  const localTeam = teamByName.get(name);
  if (localTeam) {
    return {
      ...localTeam,
      rank: rank ?? localTeam.rank,
    };
  }

  return {
    id: name,
    name,
    flag: fallbackFlagUrl || '🏳️',
    rank: rank ?? 0,
  };
};

export const mapApiMatchToMatch = (item: ApiMatchItem): Match => {
  const beijingTime = formatBeijingDateParts(item.start_time);

  return {
    id: String(item.id),
    stage: mapStageLabel(item),
    time: beijingTime.time,
    dateKey: beijingTime.dateKey,
    timestamp: beijingTime.timestamp,
    kickoffUtc: item.start_time,
    venue: item.venue_name || undefined,
    groupId: item.group_id ?? undefined,
    homeTeam: mapTeam(item.home_team_name, item.home_world_rank, item.home_team_flag),
    awayTeam: mapTeam(item.away_team_name, item.away_world_rank, item.away_team_flag),
    homeScore: item.home_score ?? undefined,
    awayScore: item.away_score ?? undefined,
    status: mapStatus(item.status),
    group: item.group_name?.replace(/组$/, '') || undefined,
  };
};

export const fetchScheduleMatches = async (): Promise<Match[]> => {
  const response = await fetch(`${API_BASE_URL}/api/matches?page=1&page_size=100`);
  if (!response.ok) {
    throw new Error(`赛程接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiMatchItem>;
  if (payload.message?.code !== 0 || !Array.isArray(payload.data?.list)) {
    throw new Error(payload.message?.message || '赛程接口返回异常');
  }

  return payload.data.list.map(mapApiMatchToMatch);
};

export const fetchMyPredictionMatches = async (userId: number): Promise<Match[]> => {
  const response = await fetch(`${API_BASE_URL}/api/public/users/${userId}/predictions?page=1&page_size=100`);
  if (!response.ok) {
    throw new Error(`我的竞猜接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiPredictionItem>;
  if (payload.message?.code !== 0 || !Array.isArray(payload.data?.list)) {
    throw new Error(payload.message?.message || '我的竞猜接口返回异常');
  }

  return payload.data.list.map((item) => mapApiMatchToMatch({
    id: item.match_id,
    match_no: item.match_no,
    stage: item.stage,
    stage_label: item.stage_label,
    group_id: item.group_id,
    group_name: item.group_name,
    round_no: item.round_no,
    home_team_id: item.home_team_id,
    away_team_id: item.away_team_id,
    home_team_name: item.home_team_name,
    away_team_name: item.away_team_name,
    home_team_flag: item.home_team_flag,
    away_team_flag: item.away_team_flag,
    home_world_rank: item.home_world_rank,
    away_world_rank: item.away_world_rank,
    venue_name: item.venue_name,
    start_time: item.start_time,
    status: item.status,
    home_score: item.home_score,
    away_score: item.away_score,
    regular_result: item.regular_result,
    winner_team_id: null,
    is_settled: item.settlement_status === 'settled',
  }));
};

export const fetchGroupTeams = async (groupId: number): Promise<ScheduleGroupData> => {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/teams`);
  if (!response.ok) {
    throw new Error(`分组球队接口请求失败，group_id=${groupId}，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ApiGroupTeamsData>;
  if (payload.message?.code !== 0 || !payload.data?.group || !Array.isArray(payload.data?.teams)) {
    throw new Error(payload.message?.message || `分组球队接口返回异常，group_id=${groupId}`);
  }

  const standings = payload.data.teams
    .map((item) => ({
      team: mapTeam(item.team_name, item.world_rank, item.flag_url),
      played: item.played,
      wins: item.win_count,
      draws: item.draw_count,
      losses: item.lose_count,
      goalsFor: item.goals_for,
      goalsAgainst: item.goals_against,
      goalDiffValue: item.goal_diff,
      goalDiff: item.goal_diff > 0 ? `+${item.goal_diff}` : `${item.goal_diff}`,
      points: item.points,
      rank: item.rank_no ?? 0,
    }))
    .sort((a, b) => (
      (a.rank && b.rank ? a.rank - b.rank : 0)
      || b.points - a.points
      || b.goalDiffValue - a.goalDiffValue
      || b.goalsFor - a.goalsFor
      || a.team.rank - b.team.rank
    ))
    .map((standing, index) => ({
      ...standing,
      rank: standing.rank || index + 1,
    }));

  return {
    id: payload.data.group.name.replace(/组$/, ''),
    numericId: payload.data.group.id,
    name: payload.data.group.name,
    sortNo: payload.data.group.sort_no ?? payload.data.group.id,
    standings,
  };
};

export const getScheduleFallbackMatches = () => MATCHES_DATA;
