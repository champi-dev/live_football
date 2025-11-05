import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToMatch(matchId: number) {
    if (!this.socket) this.connect();
    this.socket?.emit('subscribe_match', { matchId });
  }

  unsubscribeFromMatch(matchId: number) {
    this.socket?.emit('unsubscribe_match', { matchId });
  }

  subscribeToTeam(teamId: number) {
    if (!this.socket) this.connect();
    this.socket?.emit('subscribe_team', { teamId });
  }

  onMatchUpdate(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('match_update', callback);
  }

  onMatchEvent(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('match_event', callback);
  }

  onMatchStarted(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('match_started', callback);
  }

  onMatchEnded(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('match_ended', callback);
  }

  onAIInsight(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('ai_insight', callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const websocketService = new WebSocketService();
