import { Repository } from "typeorm";
import { initializeDataSource } from "../infrastructure/db/DataSource.js";

interface RefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
}

class RefreshTokenRepository {
  private tokens: Map<string, RefreshTokenData> = new Map();

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.revokeAllByUserId(userId);
    this.tokens.set(token, { token, userId, expiresAt });
  }

  async findByToken(token: string): Promise<RefreshTokenData | null> {
    const data = this.tokens.get(token);
    if (!data) return null;
    if (data.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }
    return data;
  }

  async revoke(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    for (const [token, data] of this.tokens.entries()) {
      if (data.userId === userId) {
        this.tokens.delete(token);
      }
    }
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [token, data] of this.tokens.entries()) {
      if (data.expiresAt < now) {
        this.tokens.delete(token);
      }
    }
  }
}

export default new RefreshTokenRepository();
