import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { socket } from '../../api/socket';
import { useAuthStore } from '../../store/auth';
import { RoomState } from '../../types';
import { CreateRoomCard } from './components/CreateRoomCard';
import { PublicRoomsList } from './components/PublicRoomsList';

const MIN_NAME_LENGTH = 2;

export default function LobbyScreen() {
  const { user } = useAuthStore();
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState(user?.user_name || sessionStorage.getItem('playerName') || '');
  const [gameType, setGameType] = useState('RPS');
  const [isPublic, setIsPublic] = useState(true);
  const [vsComputer, setVsComputer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<RoomState[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch public rooms on mount
    socket.emit('get-public-rooms', (res) => {
      if (res.ok) setPublicRooms(res.rooms);
    });

    // Refresh public rooms every 10 seconds
    const interval = setInterval(() => {
      socket.emit('get-public-rooms', (res) => {
        if (res.ok) setPublicRooms(res.rooms);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const hasValidName = () => {
    if (playerName.trim().length < MIN_NAME_LENGTH) {
      setError(`Enter a name with at least ${MIN_NAME_LENGTH} characters.`);
      return false;
    }
    return true;
  };

  const handleCreateRoom = () => {
    setError(null);
    if (!hasValidName()) return;

    setLoading(true);
    sessionStorage.setItem('playerName', playerName);

    socket.emit('create-room', {
        hostName: playerName,
        gameType,
        isPublic,
        vsComputer
    }, (res) => {
      setLoading(false);
      if (res.ok && res.roomId && vsComputer && !res.room?.players.some((p) => p.isBot)) {
        // An older server ignores vsComputer and makes a normal room with nobody to play.
        socket.emit('leave-room', { roomId: res.roomId });
        setError("The server couldn't add a computer player. Make sure it's running the latest version.");
      } else if (res.ok && res.roomId) {
        // A game against the computer starts right away, so skip the waiting room.
        navigate(vsComputer ? `/game/${res.roomId}` : `/room/${res.roomId}`);
      } else {
        setError(res.error || "Couldn't create the room. Please try again.");
      }
    });
  };

  const handleJoinRoom = (targetId?: string) => {
    setError(null);
    const idToJoin = targetId || roomId;
    if (!idToJoin.trim()) return setError('Enter a room code to join.');
    if (!hasValidName()) return;

    setLoading(true);
    sessionStorage.setItem('playerName', playerName);

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
    <div className="flex flex-col lg:flex-row gap-8 p-4 lg:p-8 h-full max-w-6xl mx-auto w-full">
      <div className="w-full lg:w-[380px] space-y-6 flex-shrink-0">
        <div className="space-y-2">
          <label htmlFor="player-name" className="text-sm font-medium">Your name</label>
          <Input
            id="player-name"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">This is what other players will see.</p>
        </div>

        {error && (
          <p role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </p>
        )}

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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Join with a code</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }}
            >
              <Input
                placeholder="Room code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="h-11 font-mono"
              />
              <Button type="submit" disabled={loading} className="h-11 px-6">
                Join
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <PublicRoomsList
        rooms={publicRooms}
        onJoin={(id) => handleJoinRoom(id)}
      />
    </div>
  );
}
