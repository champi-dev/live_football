import cron from 'node-cron';
import { Server } from 'socket.io';
import { footballDataService } from './football-data.service';
import { MatchService } from './match.service';
import { logger } from '../utils/logger';
import { emitMatchUpdate, emitMatchEvent } from '../websocket/socketServer';

/**
 * Match Sync Service
 * Automatically syncs live matches from Football-Data.org API
 * Runs as a background job and emits WebSocket events for real-time updates
 */
export class MatchSyncService {
  private io: Server;
  private syncJob: cron.ScheduledTask | null = null;
  private isEnabled: boolean = true;
  private lastSyncTime: Date | null = null;
  private syncCount: number = 0;
  private errorCount: number = 0;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Start the automated sync scheduler
   * Syncs every 2 minutes during match hours (6am-2am local time)
   */
  start() {
    if (this.syncJob) {
      logger.warn('Match sync service is already running');
      return;
    }

    // Sync every 2 minutes during active hours (6am to 2am)
    // This avoids hitting API rate limits (10 requests/minute)
    // Cron: */2 6-23,0-1 * * * (every 2 minutes from 6am to 2am)
    this.syncJob = cron.schedule('*/2 6-23,0-1 * * *', async () => {
      if (!this.isEnabled) return;

      try {
        await this.syncTodayMatches();
      } catch (error) {
        logger.error('Match sync job failed:', error);
        this.errorCount++;
      }
    });

    // Also run immediately on startup
    this.syncTodayMatches().catch((error) => {
      logger.error('Initial sync failed:', error);
    });

    logger.info('✅ Match sync service started - Running every 2 minutes during match hours');
  }

  /**
   * Stop the sync scheduler
   */
  stop() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
      logger.info('Match sync service stopped');
    }
  }

  /**
   * Enable/disable syncing
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    logger.info(`Match sync service ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get sync service statistics
   */
  getStats() {
    return {
      isEnabled: this.isEnabled,
      isRunning: !!this.syncJob,
      lastSyncTime: this.lastSyncTime,
      syncCount: this.syncCount,
      errorCount: this.errorCount,
      uptime: this.lastSyncTime
        ? Math.floor((Date.now() - this.lastSyncTime.getTime()) / 1000)
        : null,
    };
  }

  /**
   * Manually trigger a sync
   */
  async syncNow() {
    return this.syncTodayMatches();
  }

  /**
   * Sync today's matches and emit WebSocket events for changes
   */
  private async syncTodayMatches() {
    const startTime = Date.now();
    logger.info('🔄 Starting automated match sync...');

    try {
      // Fetch today's matches from API
      const apiMatches = await footballDataService.getTodayMatches();

      if (!apiMatches || apiMatches.length === 0) {
        logger.info('No matches found for today');
        this.lastSyncTime = new Date();
        this.syncCount++;
        return { synced: 0, updated: 0, errors: 0 };
      }

      logger.info(`Found ${apiMatches.length} matches from API`);

      let syncedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Process each match
      for (const apiMatch of apiMatches) {
        try {
          // Get existing match from database
          const existingMatch = await MatchService.getMatchById(apiMatch.id);

          // Sync to database
          const syncedMatch = await MatchService.syncFixture(apiMatch);
          syncedCount++;

          // Check if match data changed (for WebSocket emission)
          const hasScoreChanged =
            existingMatch &&
            (existingMatch.homeScore !== syncedMatch.homeScore ||
              existingMatch.awayScore !== syncedMatch.awayScore);

          const hasStatusChanged =
            existingMatch && existingMatch.status !== syncedMatch.status;

          // Emit WebSocket events if there are changes
          if (hasScoreChanged || hasStatusChanged) {
            logger.info(
              `📢 Match ${syncedMatch.id} updated: ${syncedMatch.homeTeam.name} ${syncedMatch.homeScore}-${syncedMatch.awayScore} ${syncedMatch.awayTeam.name} (${syncedMatch.status})`
            );

            // Emit match update via WebSocket
            emitMatchUpdate(this.io, syncedMatch.id.toString(), {
              matchId: syncedMatch.id,
              homeScore: syncedMatch.homeScore,
              awayScore: syncedMatch.awayScore,
              status: syncedMatch.status,
              elapsedTime: syncedMatch.elapsedTime,
              lastUpdated: syncedMatch.lastUpdated,
            });

            updatedCount++;

            // If match just started
            if (
              existingMatch?.status === 'NS' &&
              (syncedMatch.status === 'LIVE' || syncedMatch.status === 'HT')
            ) {
              logger.info(`⚽ Match ${syncedMatch.id} has started!`);
              this.io
                .to(`match_${syncedMatch.id}`)
                .emit('match_started', { matchId: syncedMatch.id });
            }

            // If match just finished
            if (existingMatch?.status !== 'FT' && syncedMatch.status === 'FT') {
              logger.info(
                `🏁 Match ${syncedMatch.id} has finished: ${syncedMatch.homeScore}-${syncedMatch.awayScore}`
              );
              this.io
                .to(`match_${syncedMatch.id}`)
                .emit('match_ended', {
                  matchId: syncedMatch.id,
                  finalScore: `${syncedMatch.homeScore}-${syncedMatch.awayScore}`,
                });
            }
          }
        } catch (error: any) {
          logger.error(`Failed to sync match ${apiMatch.id}:`, error.message);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.lastSyncTime = new Date();
      this.syncCount++;

      logger.info(
        `✅ Sync completed in ${duration}ms: ${syncedCount} synced, ${updatedCount} updated, ${errorCount} errors`
      );

      return {
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`Match sync failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Sync matches for a specific date range
   */
  async syncDateRange(dateFrom: string, dateTo: string) {
    logger.info(`Syncing matches from ${dateFrom} to ${dateTo}...`);

    try {
      const apiMatches = await footballDataService.getMatchesByDateRange(
        dateFrom,
        dateTo
      );

      if (!apiMatches || apiMatches.length === 0) {
        logger.info(`No matches found for date range ${dateFrom} to ${dateTo}`);
        return { synced: 0 };
      }

      logger.info(`Found ${apiMatches.length} matches for date range`);

      let syncedCount = 0;
      for (const apiMatch of apiMatches) {
        try {
          await MatchService.syncFixture(apiMatch);
          syncedCount++;
        } catch (error: any) {
          logger.error(`Failed to sync match ${apiMatch.id}:`, error.message);
        }
      }

      logger.info(`✅ Synced ${syncedCount} matches for date range`);
      return { synced: syncedCount };
    } catch (error: any) {
      logger.error('Date range sync failed:', error);
      throw error;
    }
  }
}

// Singleton instance (initialized in index.ts with io)
let matchSyncServiceInstance: MatchSyncService | null = null;

export const initializeMatchSyncService = (io: Server) => {
  if (!matchSyncServiceInstance) {
    matchSyncServiceInstance = new MatchSyncService(io);
    matchSyncServiceInstance.start();
  }
  return matchSyncServiceInstance;
};

export const getMatchSyncService = () => {
  if (!matchSyncServiceInstance) {
    throw new Error('Match sync service not initialized');
  }
  return matchSyncServiceInstance;
};
