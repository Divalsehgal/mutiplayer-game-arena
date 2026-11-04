import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageMeta } from './usePageMeta';

const content = (selector: string) => document.head.querySelector(selector)?.getAttribute('content');

describe('usePageMeta', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.title = 'Original';
    });

    it('sets title, robots, description and canonical tags, then removes the ones it created', () => {
        const { unmount } = renderHook(() =>
            usePageMeta({ title: 'Daily Sudoku', description: 'Play today', path: '/sudoku' }),
        );

        expect(document.title).toBe('Daily Sudoku · Game Arena');
        expect(content('meta[property="og:title"]')).toBe('Daily Sudoku · Game Arena');
        expect(content('meta[name="robots"]')).toBe('index, follow');
        expect(content('meta[name="description"]')).toBe('Play today');
        expect(content('meta[property="og:description"]')).toBe('Play today');
        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/sudoku$/);
        expect(content('meta[property="og:url"]')).toMatch(/\/sudoku$/);

        unmount();
        expect(document.title).toBe('Original');
        expect(document.head.querySelectorAll('meta, link').length).toBe(0);
    });

    it('keeps the bare app name and marks private pages noindex', () => {
        renderHook(() => usePageMeta({ title: 'Game Arena', noindex: true }));
        expect(document.title).toBe('Game Arena');
        expect(content('meta[name="robots"]')).toBe('noindex, nofollow');
        expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    });

    it('restores existing tags to their previous value, or to no value', () => {
        document.head.innerHTML =
            '<meta name="description" content="Site default"><meta name="robots">';
        const { unmount } = renderHook(() => usePageMeta({ title: 'Room', description: 'A room', noindex: true }));
        expect(content('meta[name="description"]')).toBe('A room');
        expect(content('meta[name="robots"]')).toBe('noindex, nofollow');

        unmount();
        expect(content('meta[name="description"]')).toBe('Site default');
        expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull();
        expect(document.head.querySelector('meta[name="robots"]')?.hasAttribute('content')).toBe(false);
    });
});
