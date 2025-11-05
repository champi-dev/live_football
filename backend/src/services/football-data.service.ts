import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { CacheService, CacheKeys } from '../utils/cache';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

/**
 * Football-Data.org API Service
 * Free tier: 10 requests per minute
 * Covers: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, etc.
 */
export class FootballDataService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.football-data.org/v4',
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_API_KEY,
      },
    });
  }

  /**
   * Get live and today's matches
   */
  async getTodayMatches() {
    try {
      const cached = await CacheService.get(CacheKeys.liveMatches());
      if (cached) {
        logger.debug('Returning cached matches from football-data.org');
        return cached;
      }

      const today = new Date().toISOString().split('T')[0];

      const response = await this.client.get('/matches', {
        params: {
          date: today,
        },
      });

      const matches = response.data.matches;

      // Cache for 30 seconds
      await CacheService.set(CacheKeys.liveMatches(), matches, 30);

      return matches;
    } catch (error: any) {
      logger.error('Error fetching matches from football-data.org:', error.message);
      return [];
    }
  }

  /**
   * Get match by ID
   */
  async getMatchById(matchId: number) {
    try {
      const cacheKey = CacheKeys.match(matchId);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/matches/${matchId}`);
      const match = response.data;

      // Cache for 1 minute for live, 1 hour for finished
      const ttl = match.status === 'FINISHED' ? 3600 : 60;
      await CacheService.set(cacheKey, match, ttl);

      return match;
    } catch (error: any) {
      logger.error(`Error fetching match ${matchId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get matches by date range
   */
  async getMatchesByDateRange(dateFrom: string, dateTo: string) {
    try {
      const response = await this.client.get('/matches', {
        params: {
          dateFrom,
          dateTo,
        },
      });

      return response.data.matches;
    } catch (error: any) {
      logger.error('Error fetching matches by date:', error.message);
      return [];
    }
  }

  /**
   * Get competitions (leagues)
   */
  async getCompetitions() {
    try {
      const response = await this.client.get('/competitions');
      return response.data.competitions;
    } catch (error: any) {
      logger.error('Error fetching competitions:', error.message);
      return [];
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: number) {
    try {
      const cacheKey = CacheKeys.team(teamId);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get(`/teams/${teamId}`);
      const team = response.data;

      // Cache for 24 hours
      await CacheService.set(cacheKey, team, 86400);

      return team;
    } catch (error: any) {
      logger.error(`Error fetching team ${teamId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get team matches
   */
  async getTeamMatches(teamId: number, status?: 'SCHEDULED' | 'LIVE' | 'FINISHED') {
    try {
      const params: any = {};
      if (status) params.status = status;

      const response = await this.client.get(`/teams/${teamId}/matches`, { params });
      return response.data.matches;
    } catch (error: any) {
      logger.error(`Error fetching team ${teamId} matches:`, error.message);
      return [];
    }
  }

  /**
   * Search teams (limited in free tier)
   */
  async searchTeams(query: string) {
    try {
      // Note: football-data.org doesn't have a direct search endpoint
      // We'll need to get teams from competitions
      const competitions = await this.getCompetitions();
      const teams: any[] = [];

      // Get teams from major competitions only (to save API calls)
      const majorCompetitions = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL'];

      for (const comp of competitions.filter((c: any) => majorCompetitions.includes(c.code))) {
        try {
          const response = await this.client.get(`/competitions/${comp.code}/teams`);
          teams.push(...response.data.teams);
        } catch (err) {
          // Skip if error
          continue;
        }
      }

      // Filter by query
      return teams.filter((team: any) =>
        team.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error: any) {
      logger.error('Error searching teams:', error.message);
      return [];
    }
  }
}

export const footballDataService = new FootballDataService();
