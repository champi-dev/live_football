import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export const setupSocketServer = (io: Server) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('subscribe_match', (data: { matchId: string }) => {
      socket.join(`match_${data.matchId}`);
      logger.debug(`Socket ${socket.id} subscribed to match ${data.matchId}`);
    });

    socket.on('unsubscribe_match', (data: { matchId: string }) => {
      socket.leave(`match_${data.matchId}`);
      logger.debug(`Socket ${socket.id} unsubscribed from match ${data.matchId}`);
    });

    socket.on('subscribe_team', (data: { teamId: string }) => {
      socket.join(`team_${data.teamId}`);
      logger.debug(`Socket ${socket.id} subscribed to team ${data.teamId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Utility functions to emit events
export const emitMatchUpdate = (io: Server, matchId: string, data: any) => {
  io.to(`match_${matchId}`).emit('match_update', data);
};

export const emitMatchEvent = (io: Server, matchId: string, event: any) => {
  io.to(`match_${matchId}`).emit('match_event', event);
};

export const emitMatchStarted = (io: Server, matchId: string, data: any) => {
  io.to(`match_${matchId}`).emit('match_started', data);
};

export const emitMatchEnded = (io: Server, matchId: string, data: any) => {
  io.to(`match_${matchId}`).emit('match_ended', data);
};

export const emitAIInsight = (io: Server, matchId: string, insight: any) => {
  io.to(`match_${matchId}`).emit('ai_insight', insight);
};
