import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/english_teacher',
    ssl: process.env.DATABASE_SSL === 'true',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet'
    },
    grok: {
      apiKey: process.env.GROK_API_KEY || '',
      defaultModel: process.env.GROK_DEFAULT_MODEL || 'grok-2'
    }
  }
} as const;

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';
