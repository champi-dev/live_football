export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  notificationEnabled: boolean;
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  logoUrl?: string;
  country?: string;
  leagueId?: number;
  leagueName?: string;
  isMajor: boolean;
}

export type MatchStatus = 'NS' | 'LIVE' | 'HT' | 'FT' | 'PST' | 'CANC' | 'TBD';

export interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  leagueId: number;
  leagueName: string;
  matchDate: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  venue?: string;
  attendance?: number;
  referee?: string;
  homeFormation?: string;
  awayFormation?: string;
  homeCoach?: string;
  awayCoach?: string;
  elapsedTime?: number;
  homeTeam: Team;
  awayTeam: Team;
  matchEvents?: MatchEvent[];
  matchLineups?: MatchLineup[];
  matchStatistics?: MatchStatistics;
  aiInsights?: AIInsight[];
}

export type EventType = 'Goal' | 'Card' | 'Substitution' | 'VAR';

export interface MatchEvent {
  id: string;
  matchId: number;
  eventType: EventType;
  teamId: number;
  playerName?: string;
  assistName?: string;
  minute: number;
  injuryTime?: number;
  detail?: string;
  createdAt: string;
}

export interface MatchLineup {
  id: string;
  matchId: number;
  teamId: number;
  playerName: string;
  shirtNumber?: number;
  position?: string;
  isStarting: boolean;
}

export interface MatchStatistics {
  id: string;
  matchId: number;
  homePossession?: number;
  awayPossession?: number;
  homeShotsTotal?: number;
  awayShotsTotal?: number;
  homeShotsOnTarget?: number;
  awayShotsOnTarget?: number;
  homeShotsOffTarget?: number;
  awayShotsOffTarget?: number;
  homeCornerKicks?: number;
  awayCornerKicks?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeOffsides?: number;
  awayOffsides?: number;
  homeYellowCards?: number;
  awayYellowCards?: number;
  homeRedCards?: number;
  awayRedCards?: number;
  homeSaves?: number;
  awaySaves?: number;
}

export type InsightType = 'pre_match' | 'live_update' | 'halftime' | 'post_match';

export interface AIInsight {
  id: string;
  matchId: number;
  insightType: InsightType;
  content: string;
  generatedAtMinute?: number;
  tokensUsed?: number;
  createdAt: string;
}

export interface TeamFollow {
  id: string;
  userId: string;
  teamId: number;
  notifyMatchStart: boolean;
  notifyGoals: boolean;
  notifyFinalScore: boolean;
  team: Team;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
