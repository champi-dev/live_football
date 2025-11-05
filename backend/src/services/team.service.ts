import { prisma } from '../config/database';
import { footballDataService } from './football-data.service';
import { AppError } from '../middleware/errorHandler';

export class TeamService {
  /**
   * Search teams
   */
  static async searchTeams(query: string) {
    // First, search in our database
    const dbTeams = await prisma.team.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        isMajor: true,
      },
      take: 10,
    });

    if (dbTeams.length > 0) {
      return dbTeams;
    }

    // If not found, search via API
    const apiTeams = await footballDataService.searchTeams(query);

    // Store teams in database (football-data.org returns teams directly, not nested)
    for (const apiTeam of apiTeams.slice(0, 10)) {
      await prisma.team.upsert({
        where: { id: apiTeam.id },
        create: {
          id: apiTeam.id,
          name: apiTeam.name,
          logoUrl: apiTeam.crest || apiTeam.logo,
          country: apiTeam.area?.name,
          isMajor: false,
        },
        update: {
          name: apiTeam.name,
          logoUrl: apiTeam.crest || apiTeam.logo,
          country: apiTeam.area?.name,
        },
      });
    }

    // Return from database
    return prisma.team.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10,
    });
  }

  /**
   * Follow a team
   */
  static async followTeam(
    userId: string,
    teamId: number,
    preferences?: {
      notifyMatchStart?: boolean;
      notifyGoals?: boolean;
      notifyFinalScore?: boolean;
    }
  ) {
    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Create or update follow
    const follow = await prisma.teamFollow.upsert({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      create: {
        userId,
        teamId,
        notifyMatchStart: preferences?.notifyMatchStart ?? true,
        notifyGoals: preferences?.notifyGoals ?? true,
        notifyFinalScore: preferences?.notifyFinalScore ?? true,
      },
      update: {
        notifyMatchStart: preferences?.notifyMatchStart ?? true,
        notifyGoals: preferences?.notifyGoals ?? true,
        notifyFinalScore: preferences?.notifyFinalScore ?? true,
      },
      include: {
        team: true,
      },
    });

    return follow;
  }

  /**
   * Unfollow a team
   */
  static async unfollowTeam(userId: string, teamId: number) {
    await prisma.teamFollow.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get user's followed teams
   */
  static async getFollowedTeams(userId: string) {
    const follows = await prisma.teamFollow.findMany({
      where: { userId },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return follows;
  }

  /**
   * Check if user follows a team
   */
  static async isFollowing(userId: string, teamId: number) {
    const follow = await prisma.teamFollow.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return !!follow;
  }
}
