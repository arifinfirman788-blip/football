/**
 * 球队研究数据：
 * 1. 页面先读取这里的本地兜底资料，保证无网络/无 API Key 时也能展示。
 * 2. 后续可通过 /api/team-research 联网刷新，逐步补全真实赛程、阵容和维度数据。
 */

import { MATCHES_DATA, TEAMS, GROUPS_DATA } from './data';
import { CONFIRMED_COACHES, CONFIRMED_SQUADS } from './confirmedSquads';

export interface TeamFixtureResearch {
  stage: string;
  time: string;
  opponent: string;
  opponentFlag: string;
  venue?: string;
  result?: string;
  status: '已结束' | '未开始' | '待定';
}

export interface SquadPlayerResearch {
  name: string;
  englishName?: string;
  position: string;
  club?: string;
  number?: number;
  status?: '官方' | '临时名单' | '预测' | '待确认';
}

export interface WorldCupHistoryResearch {
  year: string;
  finish: string;
  record?: string;
  goals?: string;
}

export interface TeamMetricResearch {
  label: string;
  value: string;
  score: number;
}

export interface TeamResearchProfile {
  teamId: string;
  englishName: string;
  group?: string;
  confederation?: string;
  fifaRank?: number;
  titles?: number;
  coach?: string;
  squadStatus: '官方已公布' | '临时名单' | '预测名单' | '待官方公布';
  updatedAt: string;
  summary: string;
  fixtures: TeamFixtureResearch[];
  squad: SquadPlayerResearch[];
  worldCupHistory: WorldCupHistoryResearch[];
  metrics: TeamMetricResearch[];
  sources: Array<{ title: string; url: string }>;
}

const officialSources = [
  {
    title: 'FIFA 2026 官方赛程',
    url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums'
  },
  {
    title: 'FIFA 2026 阵容公告',
    url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/all-world-cup-squad-announcements'
  },
  {
    title: 'FIFA 参赛名单规则',
    url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/squad-lists-number-date'
  }
];

const TEAM_RESEARCH_OVERRIDES: Record<string, TeamResearchProfile> = {
  brazil: {
    teamId: 'brazil',
    englishName: 'Brazil',
    group: 'C',
    confederation: 'CONMEBOL',
    fifaRank: 5,
    titles: 5,
    squadStatus: '待官方公布',
    updatedAt: '2026-05-29',
    summary: '巴西位于 2026 世界杯 C 组，同组对手为摩洛哥、海地、苏格兰。小组赛赛程已公布，阵容字段仍需等最终名单确认。',
    fixtures: [
      { stage: '小组赛·第1轮', time: '2026-06-13 23:00', opponent: '摩洛哥', opponentFlag: '🇲🇦', venue: 'East Rutherford', result: 'VS', status: '未开始' },
      { stage: '小组赛·第2轮', time: '2026-06-20 02:00', opponent: '海地', opponentFlag: '🇭🇹', venue: 'Philadelphia', result: 'VS', status: '未开始' },
      { stage: '小组赛·第3轮', time: '2026-06-24 23:00', opponent: '苏格兰', opponentFlag: '🏴', venue: 'Miami Gardens', result: 'VS', status: '未开始' }
    ],
    squad: [
      { name: '维尼修斯', englishName: 'Vinicius Jr.', position: '前锋', club: '皇家马德里', status: '预测' },
      { name: '罗德里戈', englishName: 'Rodrygo', position: '前锋', club: '皇家马德里', status: '预测' },
      { name: '卡塞米罗', englishName: 'Casemiro', position: '中场', status: '预测' },
      { name: '阿利森', englishName: 'Alisson Becker', position: '门将', club: '利物浦', status: '预测' }
    ],
    worldCupHistory: [
      { year: '2022', finish: '八强', record: '3胜1平1负', goals: '8进3失' },
      { year: '2018', finish: '八强', record: '3胜1平1负', goals: '8进3失' },
      { year: '2014', finish: '第四名', record: '3胜2平2负', goals: '11进14失' }
    ],
    metrics: [
      { label: '进攻火力', value: '边路爆点突出', score: 91 },
      { label: '阵容厚度', value: '前场选择丰富', score: 88 },
      { label: '大赛经验', value: '淘汰赛经验充足', score: 90 },
      { label: '防守稳定', value: '需关注转换保护', score: 78 }
    ],
    sources: officialSources
  },
  france: {
    teamId: 'france',
    englishName: 'France',
    group: 'I',
    confederation: 'UEFA',
    fifaRank: 2,
    titles: 2,
    squadStatus: '待官方公布',
    updatedAt: '2026-05-29',
    summary: '法国位于 2026 世界杯 I 组，同组对手为塞内加尔、伊拉克、挪威。球队近三届世界杯稳定进入深轮次，是预测模型里的强势样本。',
    fixtures: [
      { stage: '小组赛·第1轮', time: '2026-06-14 02:00', opponent: '挪威', opponentFlag: '🇳🇴', result: 'VS', status: '未开始' },
      { stage: '小组赛·第2轮', time: '2026-06-20', opponent: '塞内加尔', opponentFlag: '🇸🇳', result: 'VS', status: '未开始' },
      { stage: '小组赛·第3轮', time: '2026-06-25', opponent: '伊拉克', opponentFlag: '🇮🇶', result: 'VS', status: '未开始' }
    ],
    squad: [
      { name: '姆巴佩', englishName: 'Kylian Mbappe', position: '前锋', club: '皇家马德里', status: '预测' },
      { name: '格列兹曼', englishName: 'Antoine Griezmann', position: '中前场', status: '预测' },
      { name: '楚阿梅尼', englishName: 'Aurelien Tchouameni', position: '中场', club: '皇家马德里', status: '预测' },
      { name: '迈尼昂', englishName: 'Mike Maignan', position: '门将', status: '预测' }
    ],
    worldCupHistory: [
      { year: '2022', finish: '亚军', record: '5胜1平1负', goals: '16进8失' },
      { year: '2018', finish: '冠军', record: '6胜1平0负', goals: '14进6失' },
      { year: '2014', finish: '八强', record: '3胜1平1负', goals: '10进3失' }
    ],
    metrics: [
      { label: '反击威胁', value: '速度优势明显', score: 94 },
      { label: '阵容厚度', value: '多位置储备强', score: 92 },
      { label: '大赛经验', value: '连续两届决赛', score: 95 },
      { label: '控场能力', value: '中场对抗强', score: 86 }
    ],
    sources: officialSources
  },
  argentina: {
    teamId: 'argentina',
    englishName: 'Argentina',
    group: 'J',
    confederation: 'CONMEBOL',
    fifaRank: 1,
    titles: 3,
    squadStatus: '待官方公布',
    updatedAt: '2026-05-29',
    summary: '阿根廷位于 2026 世界杯 J 组，同组对手为阿尔及利亚、奥地利、约旦。球队作为卫冕冠军，杯赛经验和团队成熟度仍是核心优势。',
    fixtures: [
      { stage: '小组赛·第1轮', time: '2026-06-14 23:00', opponent: '约旦', opponentFlag: '🇯🇴', result: 'VS', status: '未开始' },
      { stage: '小组赛·第2轮', time: '2026-06-20', opponent: '奥地利', opponentFlag: '🇦🇹', result: 'VS', status: '未开始' },
      { stage: '小组赛·第3轮', time: '2026-06-25', opponent: '阿尔及利亚', opponentFlag: '🇩🇿', result: 'VS', status: '未开始' }
    ],
    squad: [
      { name: '梅西', englishName: 'Lionel Messi', position: '前锋', status: '预测' },
      { name: '劳塔罗', englishName: 'Lautaro Martinez', position: '前锋', status: '预测' },
      { name: '麦卡利斯特', englishName: 'Alexis Mac Allister', position: '中场', status: '预测' },
      { name: '埃米利亚诺·马丁内斯', englishName: 'Emiliano Martinez', position: '门将', status: '预测' }
    ],
    worldCupHistory: [
      { year: '2022', finish: '冠军', record: '5胜1平1负', goals: '15进8失' },
      { year: '2018', finish: '十六强', record: '1胜1平2负', goals: '6进9失' },
      { year: '2014', finish: '亚军', record: '5胜1平1负', goals: '8进4失' }
    ],
    metrics: [
      { label: '杯赛韧性', value: '淘汰赛经验顶级', score: 96 },
      { label: '中场控制', value: '节奏管理成熟', score: 89 },
      { label: '终结能力', value: '锋线效率稳定', score: 86 },
      { label: '体能风险', value: '需关注核心负荷', score: 72 }
    ],
    sources: officialSources
  }
};

const defaultMetrics: TeamMetricResearch[] = [
  { label: '进攻火力', value: '待补充真实数据', score: 72 },
  { label: '防守稳定', value: '待补充真实数据', score: 70 },
  { label: '大赛经验', value: '待补充真实数据', score: 68 },
  { label: '阵容完整', value: '等待官方名单', score: 65 }
];

const getTeamGroup = (teamId: string) => GROUPS_DATA.find(group => group.teams.some(entry => entry.team.id === teamId))?.id;

const buildTeamFixtures = (teamId: string): TeamFixtureResearch[] => {
  const fixtures = MATCHES_DATA.filter(match => match.homeTeam.id === teamId || match.awayTeam.id === teamId);
  return fixtures.map((match) => ({
    stage: match.stage,
    time: `${match.dateKey} ${match.timestamp}`,
    opponent: match.homeTeam.id === teamId ? match.awayTeam.name : match.homeTeam.name,
    opponentFlag: match.homeTeam.id === teamId ? match.awayTeam.flag : match.homeTeam.flag,
    venue: match.time.split(' 星期')[0],
    result: match.status === 'unstarted' ? 'VS' : `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`,
    status: match.status === 'ended' ? '已结束' : '未开始'
  }));
};

const buildPlaceholderSquad = (teamName: string): SquadPlayerResearch[] => {
  const plan = [
    ['门将', 3],
    ['后卫', 8],
    ['中场', 8],
    ['前锋', 7],
  ] as const;
  let number = 1;
  return plan.flatMap(([position, count]) => (
    Array.from({ length: count }, (_, idx) => ({
      name: `${teamName}${position}${idx + 1}`,
      englishName: `${teamName} ${position} ${idx + 1}`,
      position,
      number: number++,
      status: '待确认' as const
    }))
  ));
};

const buildPlaceholderHistory = (): WorldCupHistoryResearch[] => ([
  { year: '2022', finish: '待补充' },
  { year: '2018', finish: '待补充' },
  { year: '2014', finish: '待补充' }
]);

const buildPlaceholderMetrics = (): TeamMetricResearch[] => ([
  { label: '进攻火力', value: '待补充真实数据', score: 72 },
  { label: '防守稳定', value: '待补充真实数据', score: 70 },
  { label: '大赛经验', value: '待补充真实数据', score: 68 },
  { label: '阵容完整', value: '等待官方名单', score: 65 }
]);

const buildGenericTeamResearch = (teamId: string): TeamResearchProfile => {
  const team = TEAMS[teamId];
  const groupId = getTeamGroup(teamId);
  const confirmedSquad = CONFIRMED_SQUADS[teamId];
  return {
    teamId,
    englishName: team?.name || teamId,
    group: groupId,
    confederation: '待补充',
    fifaRank: team?.rank,
    coach: CONFIRMED_COACHES[teamId],
    titles: undefined,
    squadStatus: confirmedSquad ? '官方已公布' : '待官方公布',
    updatedAt: '2026-05-29',
    summary: `${team?.name || teamId} 已进入 2026 世界杯${groupId ? ` ${groupId} 组` : ''}。赛程已挂接，阵容与历史战绩字段先以结构化占位，后续可继续补全真实名单和历届成绩。`,
    fixtures: buildTeamFixtures(teamId),
    squad: confirmedSquad || buildPlaceholderSquad(team?.name || teamId),
    worldCupHistory: buildPlaceholderHistory(),
    metrics: buildPlaceholderMetrics(),
    sources: officialSources
  };
};

const normalizeTeamResearch = (teamId: string, profile: TeamResearchProfile): TeamResearchProfile => {
  const team = TEAMS[teamId];
  const confirmedSquad = CONFIRMED_SQUADS[teamId];
  const generatedSquad = buildPlaceholderSquad(team?.name || teamId);
  return {
    ...profile,
    coach: CONFIRMED_COACHES[teamId] || profile.coach,
    squadStatus: confirmedSquad ? '官方已公布' : profile.squadStatus,
    fixtures: profile.fixtures.length > 0 ? profile.fixtures : buildTeamFixtures(teamId),
    squad: confirmedSquad || (profile.squad.length >= 26
      ? profile.squad
      : [
          ...profile.squad,
          ...generatedSquad.slice(profile.squad.length)
        ]),
  };
};

export const TEAM_RESEARCH_DATA: Record<string, TeamResearchProfile> = Object.fromEntries(
  Object.keys(TEAMS).map(teamId => [
    teamId,
    normalizeTeamResearch(teamId, TEAM_RESEARCH_OVERRIDES[teamId] || buildGenericTeamResearch(teamId))
  ])
);

export const getFallbackTeamResearch = (teamId: string, teamName: string, flag: string, rank?: number): TeamResearchProfile => ({
  teamId,
  englishName: teamId.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
  fifaRank: rank,
  squadStatus: '待官方公布',
  updatedAt: '2026-05-29',
  summary: `${flag} ${teamName} 的详细资料正在补全中。当前页面已接入统一数据结构，可继续补充官方赛程、最终阵容、近三届世界杯战绩和多维预测指标。`,
  fixtures: [
    { stage: '小组赛', time: '待官方赛程确认', opponent: '同组球队', opponentFlag: '⚽', status: '待定' },
    { stage: '小组赛', time: '待官方赛程确认', opponent: '同组球队', opponentFlag: '⚽', status: '待定' },
    { stage: '小组赛', time: '待官方赛程确认', opponent: '同组球队', opponentFlag: '⚽', status: '待定' }
  ],
  squad: [
    { name: '官方名单待公布', position: '全位置', status: '待确认' }
  ],
  worldCupHistory: [
    { year: '2022', finish: '待补充' },
    { year: '2018', finish: '待补充' },
    { year: '2014', finish: '待补充' }
  ],
  metrics: defaultMetrics,
  sources: officialSources
});
