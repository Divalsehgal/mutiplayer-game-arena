import { describe, it, expect, beforeEach } from 'vitest';
import { useRoomStore } from './index';

describe('Room Store', () => {
  beforeEach(() => {
    useRoomStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useRoomStore.getState();
    expect(state.room).toBeUndefined();
    expect(state.history).toEqual([]);
    expect(state.isConnected).toBe(false);
    expect(state.error).toBeNull();
    expect(state.ttlWarning).toBeNull();
  });

  it('should handle setRoom', () => {
    const mockRoom = { id: 'r1', status: 'waiting' } as any;
    useRoomStore.getState().setRoom(mockRoom);
    expect(useRoomStore.getState().room).toEqual(mockRoom);
  });

  it('should handle addHistory', () => {
    const mockResult = { round: 1, winner: 'p1' } as any;
    useRoomStore.getState().addHistory(mockResult);
    expect(useRoomStore.getState().history).toEqual([mockResult]);
    
    const mockResult2 = { round: 2, winner: 'p2' } as any;
    useRoomStore.getState().addHistory(mockResult2);
    expect(useRoomStore.getState().history).toEqual([mockResult, mockResult2]);
  });

  it('should handle setIsConnected', () => {
    useRoomStore.getState().setIsConnected(true);
    expect(useRoomStore.getState().isConnected).toBe(true);
  });

  it('should handle setError', () => {
    useRoomStore.getState().setError('Test error');
    expect(useRoomStore.getState().error).toBe('Test error');
  });

  it('should handle setTtlWarning', () => {
    useRoomStore.getState().setTtlWarning(30);
    expect(useRoomStore.getState().ttlWarning).toBe(30);
  });

  it('should handle reset', () => {
    useRoomStore.getState().setRoom({ id: 'r1' } as any);
    useRoomStore.getState().addHistory({ round: 1 } as any);
    useRoomStore.getState().setError('error');
    useRoomStore.getState().setTtlWarning(10);
    
    useRoomStore.getState().reset();
    
    const state = useRoomStore.getState();
    expect(state.room).toBeUndefined();
    expect(state.history).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.ttlWarning).toBeNull();
  });
});
