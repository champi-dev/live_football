import { useEffect, useRef } from 'react';
import { websocketService } from '../services/websocket';

export function useMatchUpdates(matchId: number, onUpdate: (data: any) => void) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!matchId) return;

    // Connect and subscribe
    websocketService.subscribeToMatch(matchId);

    // Set up event listeners
    const handleUpdate = (data: any) => {
      if (data.matchId === matchId) {
        onUpdateRef.current(data);
      }
    };

    websocketService.onMatchUpdate(handleUpdate);
    websocketService.onMatchEvent(handleUpdate);

    // Cleanup
    return () => {
      websocketService.unsubscribeFromMatch(matchId);
      websocketService.off('match_update', handleUpdate);
      websocketService.off('match_event', handleUpdate);
    };
  }, [matchId]);
}

export function useWebSocketConnection() {
  useEffect(() => {
    websocketService.connect();

    return () => {
      websocketService.disconnect();
    };
  }, []);
}
