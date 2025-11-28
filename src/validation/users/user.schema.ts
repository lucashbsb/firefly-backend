import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(8),
  authProvider: z.string().optional(),
  authProviderId: z.string().optional(),
  role: z.enum(["student", "admin", "teacher"]).optional()
}).strict();

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["student", "admin", "teacher"]).optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional()
}).strict();

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export { createUserSchema, updateUserSchema };
