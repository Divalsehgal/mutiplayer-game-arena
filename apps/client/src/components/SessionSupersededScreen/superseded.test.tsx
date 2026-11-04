import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionSupersededScreen } from './index';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockedNavigate };
});

describe('SessionSupersededScreen', () => {
    it('explains what happened and goes back to the games', () => {
        render(<MemoryRouter><SessionSupersededScreen /></MemoryRouter>);

        expect(screen.getByRole('heading', { name: "You're playing in another tab" })).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Back to games' }));
        expect(mockedNavigate).toHaveBeenCalledWith('/play');
    });
});
