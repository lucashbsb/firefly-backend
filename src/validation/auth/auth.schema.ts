import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
}).strict();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().max(200).optional()
}).strict();

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
}).strict();

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export { loginSchema, registerSchema, refreshTokenSchema };
