import { prisma } from '../config/database';
import { footballDataService } from './football-data.service';
import { MatchStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { CacheService } from '../utils/cache';

export class MatchService {
  /**
   * Sync fixture from API to database
   * Now using football-data.org API format with full Deep Data support
   */
  static async syncFixture(apiMatch: any) {
    try {
      const matchId = apiMatch.id;
      const homeTeam = apiMatch.homeTeam;
      const awayTeam = apiMatch.awayTeam;

      // Ensure teams exist in database
      await this.ensureTeamExists(homeTeam);
      await this.ensureTeamExists(awayTeam);

      // Map API status to our enum
      const status = this.mapStatus(apiMatch.status);

      // Extract referees (main referee only)
      const referee = apiMatch.referees?.find((r: any) => r.type === 'REFEREE')?.name;

      // Upsert match with all Deep Data fields
      const match = await prisma.match.upsert({
        where: { id: matchId },
        create: {
          id: matchId,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: apiMatch.competition?.id || 0,
          leagueName: apiMatch.competition?.name || 'Unknown',
          matchDate: new Date(apiMatch.utcDate),
          status,
          homeScore: apiMatch.score?.fullTime?.home || 0,
          awayScore: apiMatch.score?.fullTime?.away || 0,
          halfTimeHomeScore: apiMatch.score?.halfTime?.home,
          halfTimeAwayScore: apiMatch.score?.halfTime?.away,
          venue: apiMatch.venue,
          attendance: apiMatch.attendance,
          referee,
          homeFormation: homeTeam.formation,
          awayFormation: awayTeam.formation,
          homeCoach: homeTeam.coach?.name,
          awayCoach: awayTeam.coach?.name,
          elapsedTime: this.calculateElapsedTime(apiMatch),
          isMajorMatch: true,
        },
        update: {
          status,
          homeScore: apiMatch.score?.fullTime?.home || 0,
          awayScore: apiMatch.score?.fullTime?.away || 0,
          halfTimeHomeScore: apiMatch.score?.halfTime?.home,
          halfTimeAwayScore: apiMatch.score?.halfTime?.away,
          attendance: apiMatch.attendance,
          referee,
          homeFormation: homeTeam.formation,
          awayFormation: awayTeam.formation,
          homeCoach: homeTeam.coach?.name,
          awayCoach: awayTeam.coach?.name,
          elapsedTime: this.calculateElapsedTime(apiMatch),
          lastUpdated: new Date(),
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      // Sync lineups (starting XI and bench)
      if (homeTeam.lineup || awayTeam.lineup) {
        await this.syncLineups(matchId, homeTeam, awayTeam);
      }

      // Sync match statistics
      if (homeTeam.statistics || awayTeam.statistics) {
        await this.syncMatchStatistics(matchId, homeTeam.statistics, awayTeam.statistics);
      }

      // For live or finished matches, fetch detailed data to get events
      // The bulk /matches endpoint doesn't include goals/bookings/substitutions
      if (match.status === 'LIVE' || match.status === 'HT' || match.status === 'FT') {
        try {
          logger.debug(`Fetching detailed match data for ${matchId} to sync events`);
          const detailedMatch = await footballDataService.getMatchById(matchId);
          if (detailedMatch.goals || detailedMatch.bookings || detailedMatch.substitutions) {
            await this.syncMatchEventsEnhanced(matchId, detailedMatch);
            logger.debug(`Synced ${detailedMatch.goals?.length || 0} goals, ${detailedMatch.bookings?.length || 0} bookings, ${detailedMatch.substitutions?.length || 0} substitutions for match ${matchId}`);
          }
        } catch (error) {
          logger.error(`Failed to fetch detailed match data for ${matchId}:`, error);
        }
      }

      return match;
    } catch (error) {
      logger.error('Error syncing fixture:', error);
      throw error;
    }
  }

  /**
   * Sync team lineups (starting XI and substitutes)
   */
  private static async syncLineups(matchId: number, homeTeam: any, awayTeam: any) {
    try {
      // Clear existing lineups for this match
      await prisma.matchLineup.deleteMany({ where: { matchId } });

      const lineups: any[] = [];

      // Home team lineup
      if (homeTeam.lineup) {
        homeTeam.lineup.forEach((player: any) => {
          lineups.push({
            matchId,
            teamId: homeTeam.id,
            playerName: player.name,
            shirtNumber: player.shirtNumber,
            position: player.position,
            isStarting: true,
          });
        });
      }

      // Home team bench
      if (homeTeam.bench) {
        homeTeam.bench.forEach((player: any) => {
          lineups.push({
            matchId,
            teamId: homeTeam.id,
            playerName: player.name,
            shirtNumber: player.shirtNumber,
            position: player.position,
            isStarting: false,
          });
        });
      }

      // Away team lineup
      if (awayTeam.lineup) {
        awayTeam.lineup.forEach((player: any) => {
          lineups.push({
            matchId,
            teamId: awayTeam.id,
            playerName: player.name,
            shirtNumber: player.shirtNumber,
            position: player.position,
            isStarting: true,
          });
        });
      }

      // Away team bench
      if (awayTeam.bench) {
        awayTeam.bench.forEach((player: any) => {
          lineups.push({
            matchId,
            teamId: awayTeam.id,
            playerName: player.name,
            shirtNumber: player.shirtNumber,
            position: player.position,
            isStarting: false,
          });
        });
      }

      // Bulk insert lineups
      if (lineups.length > 0) {
        await prisma.matchLineup.createMany({ data: lineups });
      }
    } catch (error) {
      logger.error('Error syncing lineups:', error);
    }
  }

  /**
   * Sync match statistics (possession, shots, fouls, etc.)
   */
  private static async syncMatchStatistics(matchId: number, homeStats: any[], awayStats: any[]) {
    try {
      // Helper to find stat value
      const getStat = (stats: any[], type: string) => {
        const stat = stats?.find((s: any) => s.type === type);
        return stat?.value || null;
      };

      await prisma.matchStatistics.upsert({
        where: { matchId },
        create: {
          matchId,
          homePossession: getStat(homeStats, 'BALL_POSSESSION'),
          awayPossession: getStat(awayStats, 'BALL_POSSESSION'),
          homeShotsTotal: getStat(homeStats, 'SHOTS'),
          awayShotsTotal: getStat(awayStats, 'SHOTS'),
          homeShotsOnTarget: getStat(homeStats, 'SHOTS_ON_GOAL'),
          awayShotsOnTarget: getStat(awayStats, 'SHOTS_ON_GOAL'),
          homeShotsOffTarget: getStat(homeStats, 'SHOTS_OFF_GOAL'),
          awayShotsOffTarget: getStat(awayStats, 'SHOTS_OFF_GOAL'),
          homeCornerKicks: getStat(homeStats, 'CORNER_KICKS'),
          awayCornerKicks: getStat(awayStats, 'CORNER_KICKS'),
          homeFouls: getStat(homeStats, 'FOULS'),
          awayFouls: getStat(awayStats, 'FOULS'),
          homeOffsides: getStat(homeStats, 'OFFSIDES'),
          awayOffsides: getStat(awayStats, 'OFFSIDES'),
          homeYellowCards: getStat(homeStats, 'YELLOW_CARDS'),
          awayYellowCards: getStat(awayStats, 'YELLOW_CARDS'),
          homeRedCards: getStat(homeStats, 'RED_CARDS'),
          awayRedCards: getStat(awayStats, 'RED_CARDS'),
          homeSaves: getStat(homeStats, 'SAVES'),
          awaySaves: getStat(awayStats, 'SAVES'),
        },
        update: {
          homePossession: getStat(homeStats, 'BALL_POSSESSION'),
          awayPossession: getStat(awayStats, 'BALL_POSSESSION'),
          homeShotsTotal: getStat(homeStats, 'SHOTS'),
          awayShotsTotal: getStat(awayStats, 'SHOTS'),
          homeShotsOnTarget: getStat(homeStats, 'SHOTS_ON_GOAL'),
          awayShotsOnTarget: getStat(awayStats, 'SHOTS_ON_GOAL'),
          homeShotsOffTarget: getStat(homeStats, 'SHOTS_OFF_GOAL'),
          awayShotsOffTarget: getStat(awayStats, 'SHOTS_OFF_GOAL'),
          homeCornerKicks: getStat(homeStats, 'CORNER_KICKS'),
          awayCornerKicks: getStat(awayStats, 'CORNER_KICKS'),
          homeFouls: getStat(homeStats, 'FOULS'),
          awayFouls: getStat(awayStats, 'FOULS'),
          homeOffsides: getStat(homeStats, 'OFFSIDES'),
          awayOffsides: getStat(awayStats, 'OFFSIDES'),
          homeYellowCards: getStat(homeStats, 'YELLOW_CARDS'),
          awayYellowCards: getStat(awayStats, 'YELLOW_CARDS'),
          homeRedCards: getStat(homeStats, 'RED_CARDS'),
          awayRedCards: getStat(awayStats, 'RED_CARDS'),
          homeSaves: getStat(homeStats, 'SAVES'),
          awaySaves: getStat(awayStats, 'SAVES'),
        },
      });
    } catch (error) {
      logger.error('Error syncing match statistics:', error);
    }
  }

  /**
   * Sync match events with enhanced details (goals with assists, cards, substitutions)
   */
  private static async syncMatchEventsEnhanced(matchId: number, apiMatch: any) {
    try {
      // Clear existing events
      await prisma.matchEvent.deleteMany({ where: { matchId } });

      const events: any[] = [];

      // Sync goals
      if (apiMatch.goals) {
        apiMatch.goals.forEach((goal: any) => {
          events.push({
            matchId,
            eventType: 'Goal',
            teamId: goal.team.id,
            playerName: goal.scorer?.name,
            assistName: goal.assist?.name,
            minute: goal.minute,
            injuryTime: goal.injuryTime,
            detail: goal.type, // e.g., "PENALTY", "REGULAR", "OWN_GOAL"
          });
        });
      }

      // Sync bookings (cards)
      if (apiMatch.bookings) {
        apiMatch.bookings.forEach((booking: any) => {
          events.push({
            matchId,
            eventType: 'Card',
            teamId: booking.team.id,
            playerName: booking.player?.name,
            minute: booking.minute,
            injuryTime: booking.injuryTime,
            detail: booking.card, // "YELLOW_CARD" or "RED_CARD"
          });
        });
      }

      // Sync substitutions
      if (apiMatch.substitutions) {
        apiMatch.substitutions.forEach((sub: any) => {
          events.push({
            matchId,
            eventType: 'Substitution',
            teamId: sub.team.id,
            playerName: sub.playerIn?.name,
            assistName: sub.playerOut?.name, // Reusing assistName field for playerOut
            minute: sub.minute,
            injuryTime: sub.injuryTime,
            detail: `${sub.playerOut?.name} → ${sub.playerIn?.name}`,
          });
        });
      }

      // Bulk insert events
      if (events.length > 0) {
        await prisma.matchEvent.createMany({ data: events });
      }
    } catch (error) {
      logger.error('Error syncing enhanced match events:', error);
    }
  }

  /**
   * Ensure team exists in database
   * Updated for football-data.org format (uses 'crest' instead of 'logo')
   */
  private static async ensureTeamExists(apiTeam: any) {
    await prisma.team.upsert({
      where: { id: apiTeam.id },
      create: {
        id: apiTeam.id,
        name: apiTeam.name,
        logoUrl: apiTeam.crest || apiTeam.logo,
        isMajor: true,
      },
      update: {
        name: apiTeam.name,
        logoUrl: apiTeam.crest || apiTeam.logo,
      },
    });
  }

  /**
   * Map API status to our MatchStatus enum
   * Updated for football-data.org status strings
   */
  private static mapStatus(apiStatus: string): MatchStatus {
    const statusMap: Record<string, MatchStatus> = {
      'SCHEDULED': MatchStatus.NS,
      'TIMED': MatchStatus.NS,
      'IN_PLAY': MatchStatus.LIVE,
      'PAUSED': MatchStatus.HT,
      'FINISHED': MatchStatus.FT,
      'SUSPENDED': MatchStatus.PST,
      'POSTPONED': MatchStatus.PST,
      'CANCELLED': MatchStatus.CANC,
      'AWARDED': MatchStatus.FT,
      // Keep old API-FOOTBALL statuses for backwards compatibility
      'NS': MatchStatus.NS,
      '1H': MatchStatus.LIVE,
      'HT': MatchStatus.HT,
      '2H': MatchStatus.LIVE,
      'ET': MatchStatus.LIVE,
      'P': MatchStatus.LIVE,
      'FT': MatchStatus.FT,
      'AET': MatchStatus.FT,
      'PEN': MatchStatus.FT,
      'PST': MatchStatus.PST,
      'CANC': MatchStatus.CANC,
      'ABD': MatchStatus.CANC,
      'AWD': MatchStatus.FT,
      'WO': MatchStatus.FT,
      'TBD': MatchStatus.TBD,
    };

    return statusMap[apiStatus] || MatchStatus.NS;
  }

  /**
   * Calculate elapsed time for a match
   */
  private static calculateElapsedTime(apiMatch: any): number | null {
    if (apiMatch.status === 'IN_PLAY') {
      // Estimate based on match start time
      const matchStart = new Date(apiMatch.utcDate);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - matchStart.getTime()) / 60000);
      return elapsed > 0 ? elapsed : 0;
    }
    return null;
  }

  /**
   * Get matches with filters, search, and pagination (with Redis caching)
   */
  static async getMatches(options: {
    leagueId?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      leagueId,
      date,
      dateFrom,
      dateTo,
      search,
      status,
      page = 1,
      limit = 20,
    } = options;

    // Create cache key based on query parameters
    const cacheKey = `matches:query:${JSON.stringify(options)}`;

    // Try to get from cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached matches query');
      return cached;
    }

    const where: any = {
      isMajorMatch: true,
    };

    // League filter
    if (leagueId) {
      where.leagueId = leagueId;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date filters (use UTC to match database timestamps)
    if (date) {
      // Parse date as UTC to avoid timezone issues
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      where.matchDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (dateFrom || dateTo) {
      where.matchDate = {};
      if (dateFrom) {
        where.matchDate.gte = new Date(dateFrom + 'T00:00:00.000Z');
      }
      if (dateTo) {
        where.matchDate.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Search filter (team names)
    if (search) {
      where.OR = [
        { homeTeam: { name: { contains: search, mode: 'insensitive' } } },
        { awayTeam: { name: { contains: search, mode: 'insensitive' } } },
        { leagueName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.match.count({ where });

    // Get paginated matches
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [
        { matchDate: 'desc' },
        { status: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = {
      matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result - 30 seconds for queries with search, 60 seconds otherwise
    const ttl = search ? 30 : 60;
    await CacheService.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Get live matches (legacy - redirects to getMatches)
   */
  static async getLiveMatches(leagueId?: number, date?: string) {
    const result = await this.getMatches({
      leagueId,
      date: date || new Date().toISOString().split('T')[0],
      limit: 100,
    });
    return result.matches;
  }

  /**
   * Get match by ID with all Deep Data (lineups, statistics, events, insights)
   */
  static async getMatchById(matchId: number) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        matchEvents: {
          orderBy: { minute: 'asc' },
        },
        matchLineups: {
          orderBy: [
            { isStarting: 'desc' }, // Starting XI first
            { position: 'asc' },
          ],
        },
        matchStatistics: true,
        aiInsights: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return match;
  }

  /**
   * Sync match events from API
   */
  static async syncMatchEvents(matchId: number, apiEvents: any[]) {
    try {
      for (const event of apiEvents) {
        const eventType = this.mapEventType(event.type);
        if (!eventType) continue;

        await prisma.matchEvent.upsert({
          where: {
            id: `${matchId}-${event.time.elapsed}-${event.type}-${event.player?.id || 0}`,
          },
          create: {
            id: `${matchId}-${event.time.elapsed}-${event.type}-${event.player?.id || 0}`,
            matchId,
            eventType,
            teamId: event.team.id,
            playerName: event.player?.name,
            minute: event.time.elapsed,
            detail: event.detail,
          },
          update: {},
        });
      }
    } catch (error) {
      logger.error('Error syncing match events:', error);
    }
  }

  /**
   * Map API event type to our EventType enum
   */
  private static mapEventType(apiType: string) {
    const typeMap: Record<string, any> = {
      'Goal': 'Goal',
      'Card': 'Card',
      'subst': 'Substitution',
      'Var': 'VAR',
    };

    return typeMap[apiType];
  }
}
