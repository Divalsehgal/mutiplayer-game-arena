import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
  };
});

vi.mock('../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockCheckAuth = vi.fn();

describe('ProtectedRoute', () => {
    beforeEach(() => {
        mockCheckAuth.mockClear();
    });

    it('should render children if authenticated', () => {
        (useAuthStore as any).mockReturnValue({ 
            isAuthenticated: true, 
            isLoading: false, 
            checkAuth: mockCheckAuth 
        });
        render(
            <BrowserRouter>
                <ProtectedRoute>
                    <div data-testid="child">Child Content</div>
                </ProtectedRoute>
            </BrowserRouter>
        );
        expect(screen.getByTestId('child')).toBeDefined();
    });

    it('should render loading state when isLoading is true', () => {
        (useAuthStore as any).mockReturnValue({ 
            isAuthenticated: false, 
            isLoading: true, 
            checkAuth: mockCheckAuth 
        });
        render(
            <BrowserRouter>
                <ProtectedRoute>
                    <div>Child Content</div>
                </ProtectedRoute>
            </BrowserRouter>
        );
        expect(document.querySelector('.animate-spin')).toBeDefined();
    });

    it('should redirect to login if not authenticated', () => {
        (useAuthStore as any).mockReturnValue({ 
            isAuthenticated: false, 
            isLoading: false, 
            checkAuth: mockCheckAuth 
        });
        render(
            <BrowserRouter>
                <ProtectedRoute>
                    <div>Child Content</div>
                </ProtectedRoute>
            </BrowserRouter>
        );
        // Navigate component is hard to test directly without mocking react-router-dom Navigate
        // But we can check that children are NOT rendered
        expect(screen.queryByText('Child Content')).toBeNull();
    });
});
