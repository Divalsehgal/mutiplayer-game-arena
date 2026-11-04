import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeScreen from './index';

describe('HomeScreen', () => {
    it('renders the heading and links to the games', () => {
        render(<MemoryRouter><HomeScreen /></MemoryRouter>);

        expect(screen.getByRole('heading', { level: 1, name: 'Quick games with friends' })).toBeDefined();
        expect(screen.getByRole('link', { name: 'Play with friends' }).getAttribute('href')).toBe('/play');
        expect(screen.getByRole('link', { name: "Today's Sudoku" }).getAttribute('href')).toBe('/sudoku');
    });
});
