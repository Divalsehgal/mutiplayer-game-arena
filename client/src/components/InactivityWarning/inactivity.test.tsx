import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InactivityWarning } from './index';

describe('InactivityWarning', () => {
    it('should render when ttlWarning is not null', () => {
        render(<InactivityWarning ttlWarning={30} onExtend={vi.fn()} />);
        expect(screen.getByText(/close in 30s/i)).toBeDefined();
        expect(screen.getByText(/Still there\?/i)).toBeDefined();
    });

    it('should call onExtend when button is clicked', () => {
        const onExtend = vi.fn();
        render(<InactivityWarning ttlWarning={30} onExtend={onExtend} />);
        const button = screen.getByText(/I'm still here/i);
        fireEvent.click(button);
        expect(onExtend).toHaveBeenCalled();
    });

    it('should not render when ttlWarning is null', () => {
        render(<InactivityWarning ttlWarning={null} onExtend={vi.fn()} />);
        expect(screen.queryByText(/Still there\?/i)).toBeNull();
    });
});
