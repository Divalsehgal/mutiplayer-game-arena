import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

/** Shown once the same player has joined this room from another tab or device. */
export function SessionSupersededScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold">You're playing in another tab</h1>
      <p className="mb-8 mt-3 max-w-[40ch] text-muted-foreground">
        This room opened in another tab or device, so the game carries on there. Close this one, or pick a new game.
      </p>
      <Button onClick={() => navigate('/play')}>Back to games</Button>
    </div>
  );
}
