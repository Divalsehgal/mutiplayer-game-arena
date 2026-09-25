import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '@/api/socket';
import { useRoomConnection } from './useRoomConnection';

export function useRoomLogic(roomId: string | undefined) {
  const navigate = useNavigate();
  const connection = useRoomConnection(roomId);
  const { room } = connection;

  // Auto-navigate to game arena when room status transitions to playing
  useEffect(() => {
    if (room?.status === 'playing' && roomId) {
      navigate(`/game/${roomId}`, { replace: true });
    }
  }, [room?.status, roomId, navigate]);

  const handleStartGame = () => {
    if (!roomId) return;
    socket.emit('game-ready', { roomId });
  };

  return {
    ...connection,
    handleStartGame
  };
}
