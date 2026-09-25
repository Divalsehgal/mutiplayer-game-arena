import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GAME_NAMES } from '@/constants/gameConstants';

interface CreateRoomCardProps {
  gameType: string;
  setGameType: (type: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  vsComputer: boolean;
  setVsComputer: (vsComputer: boolean) => void;
  handleCreateRoom: () => void;
  loading: boolean;
}

export const CreateRoomCard: React.FC<CreateRoomCardProps> = ({
  gameType,
  setGameType,
  isPublic,
  setIsPublic,
  vsComputer,
  setVsComputer,
  handleCreateRoom,
  loading,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Create a room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium mb-2">Game</legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(GAME_NAMES).map(([type, name]) => (
              <Button
                key={type}
                type="button"
                variant={gameType === type ? "default" : "outline"}
                aria-pressed={gameType === type}
                onClick={() => setGameType(type)}
                className="h-auto min-h-14 py-2 px-2 text-xs leading-tight whitespace-normal"
              >
                {name}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium mb-2">Play against</legend>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={!vsComputer ? "default" : "outline"}
              aria-pressed={!vsComputer}
              onClick={() => setVsComputer(false)}
            >
              Other players
            </Button>
            <Button
              type="button"
              variant={vsComputer ? "default" : "outline"}
              aria-pressed={vsComputer}
              onClick={() => setVsComputer(true)}
            >
              Computer
            </Button>
          </div>
        </fieldset>

        {!vsComputer && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">Who can join</legend>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={isPublic ? "default" : "outline"}
                aria-pressed={isPublic}
                onClick={() => setIsPublic(true)}
              >
                Anyone
              </Button>
              <Button
                type="button"
                variant={!isPublic ? "default" : "outline"}
                aria-pressed={!isPublic}
                onClick={() => setIsPublic(false)}
              >
                Only with code
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isPublic
                ? 'Your room will be listed under Open rooms.'
                : "Your room won't be listed. Share the code with friends."}
            </p>
          </fieldset>
        )}

        <Button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full h-12 text-base"
        >
          {vsComputer ? 'Start game' : 'Create room'}
        </Button>
      </CardContent>
    </Card>
  );
};
