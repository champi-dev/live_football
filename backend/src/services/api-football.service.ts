import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { CacheService, CacheKeys } from '../utils/cache';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'api-football-v1.p.rapidapi.com';

export class APIFootballService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `https://${RAPIDAPI_HOST}/v3`,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });
  }

  /**
   * Get live fixtures for major leagues
   */
  async getLiveFixtures() {
    try {
      // Check cache first
      const cached = await CacheService.get(CacheKeys.liveMatches());
      if (cached) {
        logger.debug('Returning cached live matches');
        return cached;
      }

      const response = await this.client.get('/fixtures', {
        params: {
          live: 'all',
        },
      });

      const fixtures = response.data.response;

      // Cache for 30 seconds
      await CacheService.set(CacheKeys.liveMatches(), fixtures, 30);

      return fixtures;
    } catch (error) {
      logger.error('Error fetching live fixtures:', error);
      throw error;
    }
  }

  /**
   * Get fixtures by date
   */
  async getFixturesByDate(date: string, leagueId?: number) {
    try {
      const params: any = { date };
      if (leagueId) {
        params.league = leagueId;
      }

      const response = await this.client.get('/fixtures', { params });
      return response.data.response;
    } catch (error) {
      logger.error('Error fetching fixtures by date:', error);
      throw error;
    }
  }

  /**
   * Get fixture details by ID
   */
  async getFixtureById(fixtureId: number) {
    try {
      // Check cache first
      const cacheKey = CacheKeys.match(fixtureId);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        logger.debug(`Returning cached fixture ${fixtureId}`);
        return cached;
      }

      const response = await this.client.get('/fixtures', {
        params: { id: fixtureId },
      });

      const fixture = response.data.response[0];

      // Cache for 1 minute for live matches, 1 hour for finished
      const ttl = fixture.fixture.status.short === 'FT' ? 3600 : 60;
      await CacheService.set(cacheKey, fixture, ttl);

      return fixture;
    } catch (error) {
      logger.error(`Error fetching fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  /**
   * Get fixture events (goals, cards, etc.)
   */
  async getFixtureEvents(fixtureId: number) {
    try {
      const cacheKey = CacheKeys.matchEvents(fixtureId);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get('/fixtures/events', {
        params: { fixture: fixtureId },
      });

      const events = response.data.response;

      // Cache for 30 seconds
      await CacheService.set(cacheKey, events, 30);

      return events;
    } catch (error) {
      logger.error(`Error fetching events for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  /**
   * Get fixture statistics
   */
  async getFixtureStatistics(fixtureId: number) {
    try {
      const cacheKey = CacheKeys.matchStats(fixtureId);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.client.get('/fixtures/statistics', {
        params: { fixture: fixtureId },
      });

      const stats = response.data.response;

      // Cache for 30 seconds
      await CacheService.set(cacheKey, stats, 30);

      return stats;
    } catch (error) {
      logger.error(`Error fetching stats for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  /**
   * Search teams by name
   */
  async searchTeams(query: string) {
    try {
      const response = await this.client.get('/teams', {
        params: { search: query },
      });

      return response.data.response;
    } catch (error) {
      logger.error(`Error searching teams with query ${query}:`, error);
      throw error;
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

      const response = await this.client.get('/teams', {
        params: { id: teamId },
      });

      const team = response.data.response[0];

      // Cache team data for 24 hours
      await CacheService.set(cacheKey, team, 86400);

      return team;
    } catch (error) {
      logger.error(`Error fetching team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get team fixtures
   */
  async getTeamFixtures(teamId: number, last?: number, next?: number) {
    try {
      const params: any = { team: teamId };
      if (last) params.last = last;
      if (next) params.next = next;

      const response = await this.client.get('/fixtures', { params });
      return response.data.response;
    } catch (error) {
      logger.error(`Error fetching fixtures for team ${teamId}:`, error);
      throw error;
    }
  }
}

export const apiFootballService = new APIFootballService();
