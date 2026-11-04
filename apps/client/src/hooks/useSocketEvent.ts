import { useEffect } from 'react';
import { socket } from '../api/socket';
import { ServerToClientEvents } from '../types/events';

// Allow any in the listener argument type because socket listeners are heterogeneous
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSocketEvent<K extends keyof ServerToClientEvents, T extends (...args: any[]) => void>(
  event: K,
  callback: T
) {
  useEffect(() => {
    // We need to cast to any to interoperate with socket.io's listener typings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).on(event, callback);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).off(event, callback);
    };
  }, [event, callback]);
}
