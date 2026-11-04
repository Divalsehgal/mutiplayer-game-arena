import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../api/socket';
import { useRoomConnection } from './useRoomConnection';

export function useGameLogic(roomId: string | undefined) {
  const navigate = useNavigate();
  const connection = useRoomConnection(roomId);
  const { room } = connection;

  // Auto-navigate back to lobby if match is interrupted
  useEffect(() => {
    if (room?.status === "waiting-for-players" && roomId) {
      navigate(`/room/${roomId}`);
    }
  }, [room?.status, roomId, navigate]);

  const handleRPSMove = (move: string) => {
    if (!roomId) return;
    socket.emit('game-move', { roomId, move });
  };

  const handleSnakeLadderMove = () => {
    if (!roomId) return;
    socket.emit('game-move', { roomId, move: 'roll' });
  };

  const handleTicTacToeMove = (index: number) => {
    if (!roomId) return;
    socket.emit('game-move', { roomId, move: index.toString() });
  };

  const handleNextRound = () => {
    if (!roomId) return;
    socket.emit('game-ready', { roomId });
  };

  return {
    ...connection,
    handleRPSMove,
    handleSnakeLadderMove,
    handleTicTacToeMove,
    handleNextRound
  };
}
