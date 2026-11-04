import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SudokuScreen from './index';
import { todayKey } from '../../lib/sudoku';

describe('SudokuScreen', () => {
    beforeEach(() => localStorage.clear());

    it('fills a selected empty cell from the number pad and saves progress', () => {
        render(<SudokuScreen />);
        expect(screen.getByRole('heading', { level: 1, name: 'Daily Sudoku' })).toBeDefined();

        const cell = screen.getAllByRole('button', { name: /, empty$/ })[0];
        const position = cell.getAttribute('aria-label')!.replace(', empty', '');
        fireEvent.click(cell);
        fireEvent.click(screen.getByRole('button', { name: '5' }));

        expect(screen.getByRole('button', { name: `${position}, 5` }).textContent).toBe('5');
        const saved = JSON.parse(localStorage.getItem(`sudoku:${todayKey()}`)!);
        expect(saved.grid.filter((n: number) => n === 5).length).toBeGreaterThan(0);
        expect(saved.solved).toBe(false);
    });
});
