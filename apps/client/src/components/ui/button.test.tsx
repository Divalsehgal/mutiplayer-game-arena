import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
    it('should render correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeDefined();
    });

    it('should handle click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalled();
    });

    it('should be disabled when the disabled prop is passed', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByText('Disabled') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
    });

    it('should render as a child component when asChild is true', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        );
        const link = screen.getByText('Link Button');
        expect(link.tagName.toLowerCase()).toBe('a');
        expect(link.getAttribute('href')).toBe('/test');
    });
});
