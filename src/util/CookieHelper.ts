import { Response, CookieOptions } from "express";
import securityConfig from "../config/security.config.js";

const getBaseCookieOptions = (): CookieOptions => ({
  httpOnly: securityConfig.cookies.httpOnly,
  secure: securityConfig.cookies.secure,
  sameSite: securityConfig.cookies.sameSite,
  path: securityConfig.cookies.path,
  domain: securityConfig.cookies.domain
});

export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie(securityConfig.cookies.accessTokenName, token, {
    ...getBaseCookieOptions(),
    maxAge: 15 * 60 * 1000
  });
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(securityConfig.cookies.refreshTokenName, token, {
    ...getBaseCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(securityConfig.cookies.accessTokenName, getBaseCookieOptions());
  res.clearCookie(securityConfig.cookies.refreshTokenName, getBaseCookieOptions());
};
