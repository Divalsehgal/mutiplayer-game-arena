import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './client';
import { useAuthStore } from '../store/auth';

// Mock fetch
global.fetch = vi.fn();

describe('apiFetch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call fetch with correct URL and headers', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        });

        const result = await apiFetch('/test');
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test'), expect.any(Object));
        expect(result.ok).toBe(true);
    });

    it('should set Content-Type to application/json when body is provided', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true })
        });

        await apiFetch('/test', { method: 'POST', body: JSON.stringify({ a: 1 }) });
        
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/test'),
            expect.objectContaining({
                headers: expect.any(Headers)
            })
        );
        
        // Retrieve the headers from the mock call
        const fetchArgs = (fetch as any).mock.calls[0];
        const headers: Headers = fetchArgs[1].headers;
        expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle 401 and attempt refresh', async () => {
        // First call returns 401
        (fetch as any)
            .mockResolvedValueOnce({
                status: 401,
                ok: false,
                json: async () => ({ success: false })
            })
            // Second call (refresh) returns success
            .mockResolvedValueOnce({
                status: 200,
                ok: true,
                json: async () => ({ success: true, data: { accessToken: 'new_token' } })
            })
            // Third call (retry) returns success
            .mockResolvedValueOnce({
                status: 200,
                ok: true,
                json: async () => ({ success: true })
            });

        const result = await apiFetch('/test');
        expect(result.ok).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(3); // /test (401) -> /refresh -> /test (retry)
    });

    it('should queue multiple 401 requests during refresh', async () => {
        // Mock 401 for both initial calls
        (fetch as any)
            .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) }) // Request 1
            .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) }) // Request 2
            // Refresh call
            .mockResolvedValueOnce({ 
                status: 200, 
                ok: true, 
                json: async () => ({ success: true, data: { accessToken: 'new_token' } }) 
            })
            // Retry for Request 1
            .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ id: 1 }) })
            // Retry for Request 2
            .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ id: 2 }) });

        const [res1, res2] = await Promise.all([
            apiFetch('/req1'),
            apiFetch('/req2')
        ]);

        // Req 2 subscribes and is called when Req 1 finishes refresh logic, 
        // so it might get the first mock value depending on timing.
        // We just care that both succeeded.
        expect(res1.data).toBeDefined();
        expect(res2.data).toBeDefined();
    });

    it('should handle refresh failure and logout without a hard redirect', async () => {
        // First call 401
        (fetch as any)
            .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) })
            // Refresh call fails
            .mockRejectedValueOnce(new Error('Refresh failed'))
            // logout()'s own apiFetch('/auth/logout') call
            .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({}) });

        // A hard redirect here would re-mount the app and re-trigger checkAuth(),
        // causing an infinite reload loop on the login page — this must not happen.
        await expect(apiFetch('/test')).rejects.toThrow('Session expired');
    });

    it.each(['/auth/google', '/auth/signin', '/auth/signup'])(
        'returns a 401 from %s as-is instead of treating it as an expired session',
        async (endpoint) => {
            (fetch as any).mockReset().mockResolvedValueOnce({
                status: 401,
                ok: false,
                json: async () => ({ success: false, message: 'Invalid Credentials' }),
            });

            const res = await apiFetch(endpoint, { method: 'POST', body: '{}' });

            expect(res).toEqual({ ok: false, status: 401, data: { success: false, message: 'Invalid Credentials' } });
            expect(fetch).toHaveBeenCalledTimes(1);
        }
    );

    it('sends the stored access token as a bearer header', async () => {
        useAuthStore.setState({ accessToken: 'abc' });
        (fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

        await apiFetch('/test');

        const headers: Headers = (fetch as any).mock.calls[0][1].headers;
        expect(headers.get('Authorization')).toBe('Bearer abc');
        useAuthStore.setState({ accessToken: null });
    });

    it('returns null data when the response body is not JSON', async () => {
        (fetch as any).mockResolvedValueOnce({ ok: true, status: 204, json: async () => { throw new Error('empty'); } });

        expect(await apiFetch('/test')).toEqual({ ok: true, status: 204, data: null });
    });

    it.each([
        ['rejects the refresh', { ok: false, status: 401, json: async () => ({ success: false }) }],
        ['sends a non-JSON refresh reply', { ok: true, status: 200, json: async () => { throw new Error('bad'); } }],
    ])('logs out when the server %s', async (_label, refreshResponse) => {
        const logout = vi.fn();
        useAuthStore.setState({ logout });
        (fetch as any)
            .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) })
            .mockResolvedValueOnce(refreshResponse);

        await expect(apiFetch('/test')).rejects.toThrow('Session expired');
        expect(logout).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
