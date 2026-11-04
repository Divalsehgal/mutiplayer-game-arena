import { RoomState, RoundResult } from '@/types';
import { create } from 'zustand'

interface RoomStoreState {
  room: RoomState | null | undefined;
  history: RoundResult[];
  isConnected: boolean;
  error: string | null;
  ttlWarning: number | null;
  setRoom: (room: RoomState | null) => void;
  addHistory: (result: RoundResult) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setTtlWarning: (secondsLeft: number | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  room: undefined,
  history: [],
  isConnected: false,
  error: null,
  ttlWarning: null,
  setRoom: (room) => set({ room }),
  addHistory: (result) => set((state) => ({ history: [...state.history, result] })),
  setIsConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  setTtlWarning: (ttlWarning) => set({ ttlWarning }),
  reset: () => set({ room: undefined, history: [], error: null, ttlWarning: null }),
}))
