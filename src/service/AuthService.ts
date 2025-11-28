import bcrypt from "bcrypt";
import AppError from "../exception/AppError.js";
import userRepository from "../repository/UserRepository.js";
import jwtService from "../security/jwt/JwtService.js";
import { LoginDto, RegisterDto, RefreshTokenDto } from "../validation/auth/auth.schema.js";
import securityConfig from "../config/security.config.js";
import refreshTokenRepository from "../repository/RefreshTokenRepository.js";

class AuthService {
  async login(payload: LoginDto) {
    const user = await userRepository.findByEmail(payload.email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = jwtService.signAccessToken(tokenPayload);
    const refreshToken = jwtService.signRefreshToken(tokenPayload);

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.save(user.id, refreshToken, refreshExpiresAt);
    await userRepository.updateLastLogin(user.id);

    return { accessToken, refreshToken, user };
  }

  async register(payload: RegisterDto) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError("User already exists", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, securityConfig.bcrypt.rounds);
    const user = await userRepository.create({
      email: payload.email,
      passwordHash,
      authProvider: "local"
    });
    
    const saved = await userRepository.save(user);
    const tokenPayload = { userId: saved.id, email: saved.email };
    const accessToken = jwtService.signAccessToken(tokenPayload);
    const refreshToken = jwtService.signRefreshToken(tokenPayload);

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.save(saved.id, refreshToken, refreshExpiresAt);

    return { accessToken, refreshToken, user: saved };
  }

  async refreshToken(payload: RefreshTokenDto) {
    const decoded = jwtService.verifyRefreshToken(payload.refreshToken);
    
    const storedToken = await refreshTokenRepository.findByToken(payload.refreshToken);
    if (!storedToken || storedToken.userId !== decoded.userId) {
      throw new AppError("Invalid token", 401);
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError("Invalid token", 401);
    }

    await refreshTokenRepository.revoke(payload.refreshToken);

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = jwtService.signAccessToken(tokenPayload);
    const refreshToken = jwtService.signRefreshToken(tokenPayload);

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.save(user.id, refreshToken, refreshExpiresAt);

    return { accessToken, refreshToken };
  }
}

export default new AuthService();
