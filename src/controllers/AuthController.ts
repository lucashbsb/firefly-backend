import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/UserService';
import { authService } from '../services/AuthService';
import { config } from '../config';
import { authValidation } from '../validations';
import { RegisterDTO, LoginDTO } from '../dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

export class AuthController {
  private generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId, email, type: 'refresh' }, config.jwt.secret, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  private setTokenCookies(res: Response, tokens: { accessToken: string; refreshToken: string }): void {
    res.cookie('access_token', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
  }

  async register(req: Request, res: Response): Promise<void> {
    const data = req.body as RegisterDTO;
    const validation = authValidation.validateRegister(data);

    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.toResponse() });
      return;
    }

    const existingUser = await userService.findByEmail(data.email);
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const user = await userService.create({
      email: data.email,
      password: data.password,
      name: data.name || data.email.split('@')[0],
      native_language: data.native_language || 'pt-BR',
      target_level: data.target_level || 'B1'
    });

    if (!user) {
      res.status(500).json({ success: false, error: 'Failed to create user' });
      return;
    }

    await authService.assignDefaultRole(user.id);
    const tokens = this.generateTokens(user.id, user.email);
    this.setTokenCookies(res, tokens);

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, ...tokens }
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = req.body as LoginDTO;
    const validation = authValidation.validateLogin(data);

    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.toResponse() });
      return;
    }

    const user = await userService.validatePassword(data.email, data.password);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const userWithPermissions = await authService.getUserWithPermissions(user.id);
    const tokens = this.generateTokens(user.id, user.email);
    this.setTokenCookies(res, tokens);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userWithPermissions?.roles.map(r => r.name) || [],
          permissions: userWithPermissions?.permissions || []
        },
        ...tokens
      }
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret) as { userId: string; email: string; type?: string };

    if (decoded.type !== 'refresh') {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const user = await userService.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    const tokens = this.generateTokens(user.id, user.email);
    this.setTokenCookies(res, tokens);
    res.json({ success: true, data: tokens });
  }

  async me(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const user = await userService.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const userWithPermissions = await authService.getUserWithPermissions(userId);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        current_level: user.current_level,
        target_level: user.target_level,
        roles: userWithPermissions?.roles.map(r => r.name) || [],
        permissions: userWithPermissions?.permissions || []
      }
    });
  }

  async logout(_req: Request, res: Response): Promise<void> {
    this.clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();
