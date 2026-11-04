import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RPSArena } from './index';

describe('RPSArena', () => {
    const baseRoom = {
        players: [
            { playerUid: 'u1', name: 'Alpha', role: 'player' },
            { playerUid: 'u2', name: 'Bravo', role: 'player' },
        ]
    };

    const defaultProps: any = {
        room: baseRoom,
        gameState: { playerChoices: {}, readyPlayers: [] },
        playerUid: 'u1',
        opponent: { playerUid: 'u2', name: 'Bravo' },
        isPlayer: true,
        isRoundOver: false,
        handleRPSMove: vi.fn(),
        handleNextRound: vi.fn()
    };

    // ----- basic render -----
    it('should render the three move buttons for a player', () => {
        render(<RPSArena {...defaultProps} />);
        expect(screen.getByRole('button', { name: /Rock/ })).toBeDefined();
        expect(screen.getByRole('button', { name: /Paper/ })).toBeDefined();
        expect(screen.getByRole('button', { name: /Scissors/ })).toBeDefined();
        expect(screen.getByText('Pick your move')).toBeDefined();
    });

    // ----- move buttons -----
    it('should call handleRPSMove when choices are clicked', () => {
        const handleRPSMove = vi.fn();
        render(<RPSArena {...defaultProps} handleRPSMove={handleRPSMove} />);

        fireEvent.click(screen.getByRole('button', { name: /Rock/ }));
        expect(handleRPSMove).toHaveBeenCalledWith('Rock');

        fireEvent.click(screen.getByRole('button', { name: /Paper/ }));
        expect(handleRPSMove).toHaveBeenCalledWith('Paper');

        fireEvent.click(screen.getByRole('button', { name: /Scissors/ }));
        expect(handleRPSMove).toHaveBeenCalledWith('Scissors');
    });

    it('should disable move buttons and show locked in once the player has moved', () => {
        render(<RPSArena {...defaultProps} gameState={{ playerChoices: { u1: 'Rock' }, readyPlayers: [] }} />);
        expect(screen.getByRole('button', { name: /Rock/ })).toBeDisabled();
        expect(screen.getByText('Locked in')).toBeDefined();
    });

    // ----- myMove icon variants -----
    it('should show the chosen move in the player slot', () => {
        render(<RPSArena {...defaultProps} gameState={{ playerChoices: { u1: 'Paper' }, readyPlayers: [] }} />);
        // One in the move slot, one on the Paper button
        expect(screen.getAllByText('Paper').length).toBe(2);
    });

    // ----- spectator (isPlayer=false) -----
    it('should label the first slot with the player name when spectating', () => {
        render(<RPSArena {...defaultProps} isPlayer={false} />);
        expect(screen.getByText('Alpha')).toBeDefined();
    });

    it('should NOT show move buttons for spectator', () => {
        render(<RPSArena {...defaultProps} isPlayer={false} />);
        expect(screen.queryAllByRole('button').length).toBe(0);
    });

    // ----- no opponent -----
    it('should render without opponent (opponent=null)', () => {
        render(<RPSArena {...defaultProps} opponent={null} />);
        expect(screen.getByText(/Waiting for opponent/)).toBeDefined();
    });

    // ----- opponent move indicator -----
    it('should show Ready when opponent has moved, without revealing the move', () => {
        render(<RPSArena {...defaultProps} gameState={{ playerChoices: { u2: 'hidden' }, readyPlayers: [] }} />);
        expect(screen.getByText('Ready')).toBeDefined();
    });

    it('should show Choosing when opponent has not moved', () => {
        render(<RPSArena {...defaultProps} gameState={{ playerChoices: {}, readyPlayers: [] }} />);
        expect(screen.getByText('Choosing…')).toBeDefined();
    });

    // ----- round over -----
    it('should tell the player they won the round', () => {
        render(<RPSArena
            {...defaultProps}
            isRoundOver={true}
            gameState={{
                playerChoices: { u1: 'Rock', u2: 'Scissors' },
                lastResult: { winnerUid: 'u1', isDraw: false },
                readyPlayers: []
            }}
        />);
        expect(screen.getByText('You won this round')).toBeDefined();
    });

    it('should name the opponent when they win the round', () => {
        render(<RPSArena
            {...defaultProps}
            isRoundOver={true}
            gameState={{
                playerChoices: { u1: 'Scissors', u2: 'Rock' },
                lastResult: { winnerUid: 'u2', isDraw: false },
                readyPlayers: []
            }}
        />);
        expect(screen.getByText('Bravo won this round')).toBeDefined();
    });

    it('should show a draw', () => {
        render(<RPSArena
            {...defaultProps}
            isRoundOver={true}
            gameState={{
                playerChoices: { u1: 'Rock', u2: 'Rock' },
                lastResult: { isDraw: true },
                readyPlayers: []
            }}
        />);
        expect(screen.getByText("It's a draw")).toBeDefined();
    });

    it('should show a waiting message for spectators when the round is over', () => {
        render(<RPSArena
            {...defaultProps}
            isPlayer={false}
            isRoundOver={true}
            gameState={{
                playerChoices: {},
                lastResult: { winnerUid: 'u2' },
                readyPlayers: []
            }}
        />);
        expect(screen.getByText(/Waiting for the players to start the next round/)).toBeDefined();
    });

    it('should show Next round button and call handleNextRound', () => {
        const handleNextRound = vi.fn();
        render(<RPSArena
            {...defaultProps}
            isRoundOver={true}
            handleNextRound={handleNextRound}
            gameState={{
                playerChoices: {},
                lastResult: { winnerUid: 'u1' },
                readyPlayers: []
            }}
        />);
        fireEvent.click(screen.getByRole('button', { name: /Next round/i }));
        expect(handleNextRound).toHaveBeenCalled();
    });

    it('should show a disabled waiting button once the player is ready', () => {
        render(<RPSArena
            {...defaultProps}
            isRoundOver={true}
            gameState={{
                playerChoices: {},
                lastResult: { winnerUid: 'u2' },
                readyPlayers: ['u1']
            }}
        />);
        expect(screen.getByRole('button', { name: /Waiting for opponent/i })).toBeDisabled();
        expect(screen.getByText('1 of 2 ready')).toBeDefined();
    });

    it('should reveal the opponent move after the round is over', () => {
        render(<RPSArena
            {...defaultProps}
            isRoundOver={true}
            gameState={{
                playerChoices: { u1: 'Paper', u2: 'Rock' },
                lastResult: { winnerUid: 'u1' },
                readyPlayers: []
            }}
        />);
        expect(screen.getByText('Paper vs Rock')).toBeDefined();
        expect(screen.getAllByText('Rock').length).toBeGreaterThan(0);
    });

    it('should keep the opponent slot hidden while the round is in progress', () => {
        render(<RPSArena
            {...defaultProps}
            isPlayer={false}
            gameState={{ playerChoices: { u1: 'hidden', u2: 'hidden' }, readyPlayers: [] }}
        />);
        expect(screen.queryByText('Rock')).toBeNull();
        expect(screen.getAllByText('Ready').length).toBe(2);
    });
});
