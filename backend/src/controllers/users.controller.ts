import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/team.service';
import { AppError } from '../middleware/errorHandler';

export class UsersController {
  /**
   * Get user's followed teams
   */
  static async getFollowedTeams(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const follows = await TeamService.getFollowedTeams(req.user.userId);

      res.status(200).json({
        success: true,
        data: follows,
      });
    } catch (error) {
      next(error);
    }
  }
}
