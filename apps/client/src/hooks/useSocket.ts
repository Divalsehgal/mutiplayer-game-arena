import { useEffect, useState } from 'react';
import { socket, connectSocket } from '../api/socket';
import { useAuthStore } from '../store/auth';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { accessToken, user } = useAuthStore();
  const playerUid = user?._id || user?.id;

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      setIsConnected(false);
    });

    // Connect or update socket auth when identity changes
    connectSocket(accessToken || undefined, playerUid);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error');
    };
  }, [accessToken, playerUid]);

  return { isConnected, socket };
}
