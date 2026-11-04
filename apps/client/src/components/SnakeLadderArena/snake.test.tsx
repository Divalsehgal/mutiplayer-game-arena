import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnakeLadderArena } from './index';

describe('SnakeLadderArena', () => {
    const defaultProps: any = {
        room: { 
            players: [
                { playerUid: 'u1', name: 'Alpha', role: 'player' }, 
                { playerUid: 'u2', name: 'Bravo', role: 'player' }
            ] 
        },
        gameState: { 
            positions: { 'u1': 1, 'u2': 1 }, 
            currentTurn: 'u1', 
            logs: ['Game started'] 
        },
        playerUid: 'u1',
        isPlayer: true,
        handleSnakeLadderMove: vi.fn(),
        handleNextRound: vi.fn()
    };

    it('should render roll button for active player', () => {
        render(<SnakeLadderArena {...defaultProps} />);
        const rollButton = screen.getByRole('button', { name: /ROLL/i });
        expect(rollButton).toBeDefined();
        expect(rollButton).not.toBeDisabled();
    });

    it('should disable roll button if not player turn', () => {
        const props = { 
            ...defaultProps, 
            gameState: { ...defaultProps.gameState, currentTurn: 'u2' } 
        };
        render(<SnakeLadderArena {...props} />);
        expect(screen.getByText(/WAIT/i)).toBeDefined();
        expect(screen.getByText(/WAIT/i).closest('button')).toBeDisabled();
    });

    it('should call handleSnakeLadderMove when ROLL is clicked', () => {
        render(<SnakeLadderArena {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /ROLL/i }));
        expect(defaultProps.handleSnakeLadderMove).toHaveBeenCalled();
    });

    it('should show logs', () => {
        render(<SnakeLadderArena {...defaultProps} />);
        expect(screen.getByText(/Game started/i)).toBeDefined();
    });

    it('should render winner overlay when game ends', () => {
        const props = { 
            ...defaultProps, 
            gameState: { ...defaultProps.gameState, winner: 'u1' } 
        };
        render(<SnakeLadderArena {...props} />);
        expect(screen.getByText(/You win!/i)).toBeDefined();
        
        // Test handleNextRound
        const rematchButton = screen.getByRole('button', { name: /Play again/i });
        fireEvent.click(rematchButton);
        expect(defaultProps.handleNextRound).toHaveBeenCalled();
    });

    it('should show WAITING state when ready for next round', () => {
        const props = { 
            ...defaultProps, 
            gameState: { ...defaultProps.gameState, winner: 'u1', readyPlayers: ['u1'] } 
        };
        render(<SnakeLadderArena {...props} />);
        expect(screen.getByRole('button', { name: /WAITING/i })).toBeDisabled();
    });

    it('should render correctly for spectator', () => {
        const props = { 
            ...defaultProps, 
            isPlayer: false,
            gameState: { ...defaultProps.gameState, winner: 'u1' } 
        };
        render(<SnakeLadderArena {...props} />);
        expect(screen.getByText(/Waiting for the players/i)).toBeDefined();
    });

    it('should handle undefined logs and positions', () => {
        const props = { 
            ...defaultProps, 
            gameState: { currentTurn: 'u1' } 
        };
        render(<SnakeLadderArena {...props} />);
        expect(screen.getByRole('button', { name: /ROLL/i })).toBeDefined();
    });

    it('shows who is up next when watching', () => {
        render(<SnakeLadderArena {...defaultProps} isPlayer={false} gameState={{ ...defaultProps.gameState, currentTurn: 'u2' }} />);

        expect(screen.getByText("Bravo's turn")).toBeDefined();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('names the other player while waiting for their roll', () => {
        render(<SnakeLadderArena {...defaultProps} gameState={{ ...defaultProps.gameState, currentTurn: 'u2' }} />);
        expect(screen.getByRole('button', { name: 'Waiting for Bravo…' })).toBeDisabled();
    });

    it('shows the last roll and each player\'s square', () => {
        render(<SnakeLadderArena {...defaultProps} gameState={{ ...defaultProps.gameState, lastRoll: 5, positions: { u1: 14, u2: 6 } }} />);

        expect(screen.getByText('Last roll').nextElementSibling?.textContent).toBe('5');
        expect(screen.getByText('You · 14')).toBeDefined();
        expect(screen.getByText('Bravo · 6')).toBeDefined();
    });

    it('marks snakes and ladders on the board with where they lead', () => {
        render(<SnakeLadderArena {...defaultProps} />);

        expect(screen.getByTitle('Ladder: climb to 38')).toBeDefined();
        expect(screen.getByTitle('Snake: slide down to 6')).toBeDefined();
        expect(screen.getByText('Ladder')).toBeDefined();
        expect(screen.getByText('Snake')).toBeDefined();
    });

    it('names the winner when it is someone else, such as the computer', () => {
        render(<SnakeLadderArena {...defaultProps} gameState={{ ...defaultProps.gameState, winner: 'u2' }} />);
        expect(screen.getByText('Bravo wins')).toBeDefined();
    });

    it('hides the move log when there is nothing in it', () => {
        render(<SnakeLadderArena {...defaultProps} gameState={{ ...defaultProps.gameState, logs: [] }} />);
        expect(screen.queryByText(/Game started/)).toBeNull();
    });
});
