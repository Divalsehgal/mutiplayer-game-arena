import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { socket } from '../../api/socket';
import { useAuthStore } from '../../store/auth';
import { usePageMeta } from '../../hooks/usePageMeta';
import { RoomState } from '../../types';
import { CreateRoomCard } from './components/CreateRoomCard';
import { PublicRoomsList } from './components/PublicRoomsList';

const ROOMS_REFRESH_MS = 10000;

export default function LobbyScreen() {
  usePageMeta({ title: 'Play', path: '/play', noindex: true });

  const { user } = useAuthStore();
  const playerName = user?.user_name || 'Player';
  const [roomId, setRoomId] = useState('');
  const [gameType, setGameType] = useState('TIC_TAC_TOE');
  const [isPublic, setIsPublic] = useState(true);
  const [vsComputer, setVsComputer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<RoomState[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () =>
      socket.emit('get-public-rooms', (res) => {
        if (res.ok) setPublicRooms(res.rooms);
      });
    refresh();
    const interval = setInterval(refresh, ROOMS_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = () => {
    setError(null);
    setLoading(true);
    socket.emit('create-room', { hostName: playerName, gameType, isPublic, vsComputer }, (res) => {
      setLoading(false);
      if (res.ok && res.roomId) {
        // A game against the computer starts right away, so skip the waiting room.
        navigate(vsComputer ? `/game/${res.roomId}` : `/room/${res.roomId}`);
      } else {
        setError(res.error || "Couldn't create the room. Please try again.");
      }
    });
  };

  const handleJoinRoom = (targetId?: string) => {
    setError(null);
    const idToJoin = (targetId || roomId).trim();
    if (!idToJoin) return setError('Enter a room code to join.');

    setLoading(true);
    socket.emit('join-room', { roomId: idToJoin, name: playerName }, (res) => {
      setLoading(false);
      if (res.ok) {
        navigate(`/room/${idToJoin}`);
      } else {
        setError(res.error || "We couldn't find that room.");
      }
    });
  };

  return (
    <div className="page-frame py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Play</h1>

      {error && (
        <p role="alert" className="mb-6 rounded-md bg-[#2c1a20] p-3 text-sm text-[#e5566f]">
          {error}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)]">
        <CreateRoomCard
          gameType={gameType}
          setGameType={setGameType}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          vsComputer={vsComputer}
          setVsComputer={setVsComputer}
          handleCreateRoom={handleCreateRoom}
          loading={loading}
        />

        <div className="flex flex-col gap-10">
          <section aria-labelledby="join-title">
            <h2 id="join-title" className="mb-3 text-lg font-semibold">Join with a code</h2>
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }}
            >
              <Input
                aria-label="Room code"
                placeholder="Room code"
                value={roomId}
                maxLength={16}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="tabular tracking-wider"
              />
              <Button type="submit" disabled={loading} className="h-11 px-6">
                Join
              </Button>
            </form>
          </section>

          <PublicRoomsList rooms={publicRooms} onJoin={(id) => handleJoinRoom(id)} />
        </div>
      </div>
    </div>
  );
}
