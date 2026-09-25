import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, getPlayerUid } from '../api/socket';
import { useRoomStore } from '../store/room';
import { useSocket } from './useSocket';
import { useSocketEvent } from './useSocketEvent';
import { useAuthStore } from '../store/auth';
import { RoomState, JoinRoomResponse } from '../types';

/**
 * Shared connection lifecycle for the Room (lobby) and Game screens: register the
 * player, join the room, keep the room store in sync with server broadcasts, and
 * run the inactivity countdown. Both screens layer their own navigation triggers
 * and (for Game) move handlers on top of this.
 */
export function useRoomConnection(roomId: string | undefined) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isConnected } = useSocket();
  const { room, setRoom, ttlWarning, setTtlWarning, reset } = useRoomStore();
  const playerUid = user?._id || user?.id || getPlayerUid();
  const [superseded, setSuperseded] = useState(false);

  // A fresh room means a fresh session - clear any stale takeover state.
  useEffect(() => {
    setSuperseded(false);
  }, [roomId]);

  // Countdown for inactivity warning
  useEffect(() => {
    if (ttlWarning === null || ttlWarning <= 0) return;
    const interval = setInterval(() => {
      setTtlWarning(ttlWarning - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [ttlWarning, setTtlWarning]);

  // Register + join on mount (and whenever identity/connection changes) so
  // refreshing or opening a shared link directly always re-syncs room state.
  useEffect(() => {
    if (!isConnected || !roomId) return;

    const name = user?.user_name || sessionStorage.getItem('playerName') || "Player";
    const avatar = user?.avatar;

    type RegisterPayload = { playerUid: string; name: string; avatar?: string };
    type JoinPayload = { roomId: string; name: string; avatar?: string };

    const registerPayload: RegisterPayload = avatar ? { playerUid, name, avatar } : { playerUid, name };

    socket.emit('register', registerPayload, () => {
      const joinPayload: JoinPayload = avatar ? { roomId: roomId as string, name, avatar } : { roomId: roomId as string, name };

      socket.emit('join-room', joinPayload, (res: JoinRoomResponse) => {
        if (res?.ok && res.room) {
          setRoom(res.room);
        } else {
          console.error("Match not found or join failed:", res.error || res);
          setRoom(null);
        }
      });
    });
  }, [isConnected, roomId, playerUid, setRoom, user?.avatar, user?.user_name]);

  useSocketEvent("room-update", (updatedRoom: RoomState | null) => {
    if (!updatedRoom) {
      setRoom(null);
      return;
    }
    setRoom(updatedRoom);
  });

  useSocketEvent("ROOM_WARNING", ({ secondsLeft }: { secondsLeft: number }) => {
    setTtlWarning(secondsLeft);
  });

  useSocketEvent("room-error", (err: unknown) => {
    const code = (err as { code?: string } | null)?.code;
    if (code === "ROOM_EXPIRED") {
      setRoom(null);
      navigate('/');
    }
  });

  // The same player joined this room from another tab/device - this tab is no
  // longer the live session, so stop treating its (now stale) room state as current.
  useSocketEvent("session-taken-over", () => {
    setSuperseded(true);
  });

  const handleExtendSession = () => {
    if (!roomId) return;
    socket.emit('extend-room', { roomId }, () => setTtlWarning(null));
  };

  const handleLeave = () => {
    if (!roomId) return;
    socket.emit('leave-room', { roomId });
    reset();
    navigate('/');
  };

  return {
    room,
    playerUid,
    ttlWarning,
    superseded,
    handleExtendSession,
    handleLeave
  };
}
