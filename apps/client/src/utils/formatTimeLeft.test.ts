import { describe, it, expect } from 'vitest';
import { formatTimeLeft } from './formatTimeLeft';

describe('formatTimeLeft', () => {
    const ONE_MINUTE_MS = 60000;
    const ONE_MINUTE_FIVE_SECONDS_MS = 65000;
    const TWO_MINUTES_FIVE_SECONDS_MS = 125000;
    const ONE_POINT_FIVE_SECONDS_MS = 1500;
    const ZERO_POINT_NINE_SECONDS_MS = 900;
    const ONE_HOUR_MS = 3600000;

    it('should format milliseconds into MM:SS format', () => {
        expect(formatTimeLeft(ONE_MINUTE_MS)).toBe('1:00');
        expect(formatTimeLeft(ONE_MINUTE_FIVE_SECONDS_MS)).toBe('1:05');
        expect(formatTimeLeft(0)).toBe('0:00');
        expect(formatTimeLeft(TWO_MINUTES_FIVE_SECONDS_MS)).toBe('2:05');
    });

    it('should round up to the nearest second', () => {
        expect(formatTimeLeft(ONE_POINT_FIVE_SECONDS_MS)).toBe('0:02');
        expect(formatTimeLeft(ZERO_POINT_NINE_SECONDS_MS)).toBe('0:01');
    });

    it('should handle large values', () => {
        expect(formatTimeLeft(ONE_HOUR_MS)).toBe('60:00');
    });
});

