import { Response } from "express";

export const getAuthCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
    };
};

export const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
    const cookieOptions = getAuthCookieOptions();

    res.cookie('access_token', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 1 * 3600000, // 1 hour
    });
    res.cookie('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 3600000, // 7 days
    });
};

export const clearAuthCookies = (res: Response) => {
    const cookieOptions = getAuthCookieOptions();
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
};
