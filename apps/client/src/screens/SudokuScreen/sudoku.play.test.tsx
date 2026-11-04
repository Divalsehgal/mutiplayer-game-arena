import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SudokuScreen from './index';
import { generatePuzzle, todayKey, PEERS } from '../../lib/sudoku';

const { puzzle, solution } = generatePuzzle(todayKey());
const storageKey = () => `sudoku:${todayKey()}`;
const firstEmpty = puzzle.findIndex((n) => n === 0);
const firstGiven = puzzle.findIndex((n) => n !== 0);

const cell = (i: number) =>
    screen.getByRole('button', { name: new RegExp(`^Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}, `) });
const key = (k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(window, { key: k, ...init });
const padButton = (name: string) => screen.queryByRole('button', { name });
const clock = () => screen.getByLabelText(/^Time /).textContent;

describe('SudokuScreen play', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('places and clears numbers from the keyboard, ignoring modifier shortcuts', () => {
        render(<SudokuScreen />);
        fireEvent.click(cell(firstEmpty));

        key('7');
        expect(cell(firstEmpty).textContent).toBe('7');
        key('3', { ctrlKey: true });
        key('4', { metaKey: true });
        key('5', { altKey: true });
        expect(cell(firstEmpty).textContent).toBe('7');

        key('Backspace');
        expect(cell(firstEmpty).textContent).toBe('');
        key('2');
        key('Delete');
        expect(cell(firstEmpty).textContent).toBe('');
        key('2');
        key('0');
        expect(cell(firstEmpty).textContent).toBe('');
        key('x');
        expect(cell(firstEmpty).textContent).toBe('');
    });

    it('moves the selection with arrow keys and stays inside the board', () => {
        render(<SudokuScreen />);
        key('ArrowRight');
        expect(cell(1).getAttribute('aria-pressed')).toBe('true');
        key('ArrowLeft');
        expect(cell(0).getAttribute('aria-pressed')).toBe('true');
        key('ArrowUp');
        key('ArrowLeft');
        expect(cell(0).getAttribute('aria-pressed')).toBe('true');
        key('ArrowDown');
        expect(cell(9).getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(cell(80));
        key('ArrowDown');
        key('ArrowRight');
        expect(cell(80).getAttribute('aria-pressed')).toBe('true');
    });

    it('locks the number pad and keyboard on given cells', () => {
        render(<SudokuScreen />);
        expect((padButton('5') as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(cell(firstGiven));
        expect((padButton('5') as HTMLButtonElement).disabled).toBe(true);
        expect((padButton('Erase') as HTMLButtonElement).disabled).toBe(true);
        key(String((puzzle[firstGiven] % 9) + 1));
        expect(cell(firstGiven).textContent).toBe(String(puzzle[firstGiven]));
    });

    it('erases with the pad, counts clashes, and starts over', () => {
        render(<SudokuScreen />);
        const [filled, clashes] = screen.getAllByRole('definition');
        expect(filled.textContent).toBe(`${puzzle.filter(Boolean).length} / 81`);
        expect(clashes.textContent).toBe('0');

        const clashing = PEERS[firstEmpty].map((p) => puzzle[p]).find(Boolean)!;
        fireEvent.click(cell(firstEmpty));
        fireEvent.click(padButton(String(clashing))!);
        expect(Number(screen.getAllByRole('definition')[1].textContent)).toBeGreaterThan(0);

        fireEvent.click(padButton('Erase')!);
        expect(cell(firstEmpty).textContent).toBe('');

        fireEvent.click(padButton(String(clashing))!);
        fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
        expect(cell(firstEmpty).textContent).toBe('');
        expect(clock()).toBe('0:00');
        expect((padButton('5') as HTMLButtonElement).disabled).toBe(true);
    });

    it('declares the puzzle solved when the last cell is filled correctly', () => {
        const grid = [...solution];
        grid[firstEmpty] = 0;
        localStorage.setItem(storageKey(), JSON.stringify({ grid, seconds: 65, solved: false }));
        render(<SudokuScreen />);
        expect(clock()).toBe('1:05');

        fireEvent.click(cell(firstEmpty));
        key(String((solution[firstEmpty] % 9) + 1));
        expect(screen.queryByRole('heading', { name: /^Solved in/ })).toBeNull();
        key(String(solution[firstEmpty]));

        expect(screen.getByRole('heading', { name: 'Solved in 1:05' })).toBeDefined();
        expect(padButton('Erase')).toBeNull();
        expect(JSON.parse(localStorage.getItem(storageKey())!).solved).toBe(true);

        key('Backspace');
        expect(cell(firstEmpty).textContent).toBe(String(solution[firstEmpty]));

        fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
        expect(screen.queryByRole('heading', { name: /^Solved in/ })).toBeNull();
        expect(padButton('Erase')).not.toBeNull();
    });

    it('counts time only while the page is visible and stops once solved', () => {
        vi.useFakeTimers();
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        const { unmount } = render(<SudokuScreen />);
        act(() => vi.advanceTimersByTime(2000));
        expect(clock()).toBe('0:02');

        visibility.mockReturnValue('hidden');
        act(() => vi.advanceTimersByTime(3000));
        expect(clock()).toBe('0:02');
        unmount();

        visibility.mockReturnValue('visible');
        localStorage.setItem(storageKey(), JSON.stringify({ grid: solution, seconds: 30, solved: true }));
        render(<SudokuScreen />);
        act(() => vi.advanceTimersByTime(5000));
        expect(clock()).toBe('0:30');
    });

    it('starts fresh when saved progress is unreadable and survives storage failures', () => {
        localStorage.setItem(storageKey(), '{not json');
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        render(<SudokuScreen />);

        expect(cell(firstEmpty).textContent).toBe('');
        fireEvent.click(cell(firstEmpty));
        key('4');
        expect(cell(firstEmpty).textContent).toBe('4');
    });
});
