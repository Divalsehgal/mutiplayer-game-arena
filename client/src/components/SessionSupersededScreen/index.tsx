import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

/**
 * Shown on the Room/Game screens once this tab's session has been superseded
 * by the same player joining from another tab or device (see useRoomConnection's
 * "session-taken-over" handling). This tab's room state is now stale.
 */
export function SessionSupersededScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-semibold mb-2">You're playing in another tab</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">You opened this room in another tab or on another device, so this tab is no longer connected.</p>
      <Button onClick={() => navigate('/')}>Back to lobby</Button>
    </div>
  );
}
