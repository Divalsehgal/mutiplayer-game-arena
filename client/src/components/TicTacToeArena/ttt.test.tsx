import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicTacToeArena } from './index';

describe('TicTacToeArena', () => {
    const defaultProps: any = {
        room: { 
            players: [
                { playerUid: 'u1', name: 'Alpha', role: 'player' }, 
                { playerUid: 'u2', name: 'Bravo', role: 'player' }
            ] 
        },
        gameState: { 
            board: Array(9).fill(null), 
            currentTurn: 'u1' 
        },
        playerUid: 'u1',
        isPlayer: true,
        handleTicTacToeMove: vi.fn(),
        handleNextRound: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render 9 grid cells', () => {
        render(<TicTacToeArena {...defaultProps} />);
        const cells = screen.getAllByRole('button', { name: /^Square \d/ });
        expect(cells.length).toBe(9);
    });

    it('should call handleTicTacToeMove when empty cell is clicked during player turn', () => {
        render(<TicTacToeArena {...defaultProps} />);
        const firstCell = screen.getByRole('button', { name: 'Square 1, empty' });
        fireEvent.click(firstCell!);
        expect(defaultProps.handleTicTacToeMove).toHaveBeenCalledWith(0);
    });

    it('should not call handleTicTacToeMove when cell is already occupied', () => {
        const props = { 
            ...defaultProps, 
            gameState: { ...defaultProps.gameState, board: ['X', null, null, null, null, null, null, null, null] } 
        };
        render(<TicTacToeArena {...props} />);
        const firstCell = screen.getByText('X').parentElement;
        if (firstCell) fireEvent.click(firstCell);
        expect(props.handleTicTacToeMove).not.toHaveBeenCalled();
    });

    it('should render X and O symbols', () => {
        const props = { 
            ...defaultProps, 
            gameState: { 
                board: ['X', 'O', null, null, null, null, null, null, null], 
                currentTurn: 'u1' 
            } 
        };
        render(<TicTacToeArena {...props} />);
        expect(screen.getByText('X')).toBeDefined();
        expect(screen.getByText('O')).toBeDefined();
    });

    it('should show winner overlay', () => {
        const props = { 
            ...defaultProps, 
            gameState: { 
                board: ['X', 'X', 'X', 'O', 'O', null, null, null, null], 
                winner: 'u1' 
            } 
        };
        render(<TicTacToeArena {...props} />);
        expect(screen.getByText(/You win!/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /Play again/i })).toBeDefined();
    });

    it('should log error if board is missing', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const props = { 
            ...defaultProps, 
            gameState: { currentTurn: 'u1', board: null } 
        };
        render(<TicTacToeArena {...props} />);
        expect(consoleSpy).toHaveBeenCalledWith("TicTacToe Error: Board is missing from gameState", props.gameState);
        consoleSpy.mockRestore();
    });

    it("shows whose turn it is when it isn't yours, and ignores clicks", () => {
        const handleTicTacToeMove = vi.fn();
        render(<TicTacToeArena {...defaultProps} handleTicTacToeMove={handleTicTacToeMove} gameState={{ board: Array(9).fill(null), currentTurn: 'u2' }} />);

        expect(screen.getByText("Bravo's turn")).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Square 1, empty' }));
        expect(handleTicTacToeMove).not.toHaveBeenCalled();
    });

    it('shows a waiting message before anyone has a turn', () => {
        render(<TicTacToeArena {...defaultProps} gameState={{ board: Array(9).fill(null), currentTurn: null }} />);
        expect(screen.getByText('Waiting…')).toBeDefined();
    });

    it('announces a draw and offers a rematch', () => {
        const handleNextRound = vi.fn();
        render(<TicTacToeArena {...defaultProps} handleNextRound={handleNextRound} gameState={{ board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'], isDraw: true, readyPlayers: [] }} />);

        expect(screen.getByText("It's a draw")).toBeDefined();
        expect(screen.getByText('0 of 2 ready')).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
        expect(handleNextRound).toHaveBeenCalled();
    });

    it('names the winner when it is someone else, such as the computer', () => {
        render(<TicTacToeArena {...defaultProps} gameState={{ board: Array(9).fill(null), winner: 'u2', readyPlayers: ['u1'] }} />);

        expect(screen.getByText('Bravo wins')).toBeDefined();
        expect(screen.getByRole('button', { name: /Waiting for opponent/ })).toBeDisabled();
    });

    it('shows spectators a waiting message instead of a rematch button', () => {
        render(<TicTacToeArena {...defaultProps} isPlayer={false} gameState={{ board: Array(9).fill(null), winner: 'u1' }} />);

        expect(screen.getByText('Alpha wins')).toBeDefined();
        expect(screen.getByText(/Waiting for the players/)).toBeDefined();
    });

    it('labels filled squares for screen readers', () => {
        render(<TicTacToeArena {...defaultProps} gameState={{ board: ['X', null, 'O', null, null, null, null, null, null], currentTurn: 'u1' }} />);

        expect(screen.getByRole('button', { name: 'Square 1, X' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Square 3, O' })).toBeDisabled();
    });
});
