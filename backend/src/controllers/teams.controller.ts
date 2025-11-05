import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/team.service';
import { AppError } from '../middleware/errorHandler';

export class TeamsController {
  /**
   * Search teams
   */
  static async searchTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new AppError('Search query is required', 400);
      }

      const teams = await TeamService.searchTeams(q);

      res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Follow a team
   */
  static async followTeam(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const preferences = req.body;

      const follow = await TeamService.followTeam(
        req.user.userId,
        parseInt(id),
        preferences
      );

      res.status(200).json({
        success: true,
        data: follow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unfollow a team
   */
  static async unfollowTeam(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;

      await TeamService.unfollowTeam(req.user.userId, parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Team unfollowed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
