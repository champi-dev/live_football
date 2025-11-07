import { Request, Response, NextFunction } from 'express';
import { MatchService } from '../services/match.service';
import { AIService } from '../services/ai.service';
import { footballDataService } from '../services/football-data.service';
import { AppError } from '../middleware/errorHandler';

export class MatchesController {
  /**
   * Get matches with filters, search, and pagination
   */
  static async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        league,
        date,
        dateFrom,
        dateTo,
        search,
        status,
        page,
        limit,
      } = req.query;

      const result = await MatchService.getMatches({
        leagueId: league ? parseInt(league as string) : undefined,
        date: date as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.matches,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get live matches (legacy endpoint)
   */
  static async getLiveMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { league, date } = req.query;

      const matches = await MatchService.getLiveMatches(
        league ? parseInt(league as string) : undefined,
        date as string
      );

      res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get match details by ID
   */
  static async getMatchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const match = await MatchService.getMatchById(parseInt(id));

      if (!match) {
        throw new AppError('Match not found', 404);
      }

      res.status(200).json({
        success: true,
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AI insights for a match
   */
  static async generateInsights(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { type, deepAnalysis } = req.body;

      const match = await MatchService.getMatchById(parseInt(id));

      if (!match) {
        throw new AppError('Match not found', 404);
      }

      let insight;

      if (deepAnalysis) {
        insight = await AIService.generateDeepAnalysis(match);
      } else {
        switch (type) {
          case 'pre_match':
            insight = await AIService.generatePreMatchInsight(match);
            break;
          case 'live_update':
            insight = await AIService.generateLiveMatchInsight(match, match.matchEvents);
            break;
          case 'halftime':
            insight = await AIService.generateHalftimeInsight(match, match.matchEvents);
            break;
          case 'post_match':
            insight = await AIService.generatePostMatchInsight(match, match.matchEvents);
            break;
          default:
            throw new AppError('Invalid insight type', 400);
        }
      }

      res.status(200).json({
        success: true,
        data: insight,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get match insights
   */
  static async getMatchInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const insights = await AIService.getMatchInsights(parseInt(id));

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync today's matches from football-data.org
   */
  static async syncTodayMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await footballDataService.getTodayMatches();

      const syncedMatches = [];
      for (const match of matches) {
        const syncedMatch = await MatchService.syncFixture(match);
        syncedMatches.push(syncedMatch);
      }

      res.status(200).json({
        success: true,
        message: `Synced ${syncedMatches.length} matches from football-data.org`,
        data: syncedMatches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync matches by date range from football-data.org
   */
  static async syncMatchesByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo } = req.body;

      if (!dateFrom || !dateTo) {
        throw new AppError('dateFrom and dateTo are required', 400);
      }

      const matches = await footballDataService.getMatchesByDateRange(dateFrom, dateTo);

      const syncedMatches = [];
      for (const match of matches) {
        const syncedMatch = await MatchService.syncFixture(match);
        syncedMatches.push(syncedMatch);
      }

      res.status(200).json({
        success: true,
        message: `Synced ${syncedMatches.length} matches from ${dateFrom} to ${dateTo}`,
        data: syncedMatches,
      });
    } catch (error) {
      next(error);
    }
  }
}
