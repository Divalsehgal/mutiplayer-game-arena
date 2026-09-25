import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameHeader } from './index';

describe('GameHeader', () => {
    const defaultProps: any = {
        room: { 
            status: 'playing', 
            gameState: { roundCount: 1 } 
        },
        playerUid: 'u1',
        player: { name: 'Alpha', score: 5, role: 'player' },
        opponent: { name: 'Bravo', score: 3, role: 'player' },
        isSpectator: false
    };

    it('should render player and opponent scores', () => {
        render(<GameHeader {...defaultProps} />);
        expect(screen.getByText('5')).toBeDefined();
        expect(screen.getByText('3')).toBeDefined();
    });

    it('should show player and opponent names', () => {
        render(<GameHeader {...defaultProps} />);
        expect(screen.getByText(/Alpha/i)).toBeDefined();
        expect(screen.getByText(/Bravo/i)).toBeDefined();
    });

    it('should show round count', () => {
        render(<GameHeader {...defaultProps} />);
        expect(screen.getByText(/Round 1/i)).toBeDefined();
    });

    it('should show a watching label for spectators', () => {
        render(<GameHeader {...defaultProps} isSpectator={true} />);
        expect(screen.getByText(/Watching/i)).toBeDefined();
    });

    it('should render nothing if room or gameState is missing', () => {
        const { container } = render(<GameHeader room={null} playerUid="u1" player={undefined} opponent={undefined} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows the time left when there is a timer', () => {
        render(<GameHeader {...defaultProps} room={{ status: 'playing', gameState: { roundCount: 2, timer: 12 } }} />);
        expect(screen.getByText('12s left')).toBeDefined();
    });

    it('waits for an opponent and hides round info for games without rounds', () => {
        render(<GameHeader {...defaultProps} opponent={undefined} room={{ status: 'playing', gameState: { board: [] } }} />);

        expect(screen.getByText('Waiting for opponent…')).toBeDefined();
        expect(screen.getByText('–')).toBeDefined();
        expect(screen.queryByText(/Round/)).toBeNull();
    });

    it('falls back to placeholders for missing names and scores', () => {
        render(<GameHeader {...defaultProps} player={{ role: 'spectator' }} opponent={{ name: 'Bravo', role: 'spectator' }} />);

        expect(screen.getByText(/Player 1/)).toBeDefined();
        expect(screen.getAllByText('0').length).toBe(2);
    });
});
