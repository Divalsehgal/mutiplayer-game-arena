import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GAME_NAMES } from '@arena/shared';

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

interface Option<T> {
  value: T;
  label: string;
}

function Segmented<T>({ legend, options, value, onChange }: {
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted-foreground">{legend}</legend>
      <div className="flex rounded-full bg-secondary p-1">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              value === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
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
      <CardHeader>
        <CardTitle className="text-lg">New game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm text-muted-foreground">Game</legend>
          <div className="flex flex-col gap-1">
            {Object.entries(GAME_NAMES).map(([type, name]) => (
              <button
                key={type}
                type="button"
                aria-pressed={gameType === type}
                onClick={() => setGameType(type)}
                className={`flex items-center justify-between rounded-md px-4 py-3 text-left font-medium transition-colors ${
                  gameType === type ? 'bg-raised text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {name}
                {gameType === type && <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />}
              </button>
            ))}
          </div>
        </fieldset>

        <Segmented
          legend="Opponent"
          value={vsComputer}
          onChange={setVsComputer}
          options={[{ value: false, label: 'People' }, { value: true, label: 'Computer' }]}
        />

        {!vsComputer && (
          <Segmented
            legend="Who can join"
            value={isPublic}
            onChange={setIsPublic}
            options={[{ value: true, label: 'Anyone' }, { value: false, label: 'Only with code' }]}
          />
        )}

        <Button onClick={handleCreateRoom} disabled={loading} size="lg" className="w-full">
          {vsComputer ? 'Start game' : 'Create room'}
        </Button>
      </CardContent>
    </Card>
  );
};
