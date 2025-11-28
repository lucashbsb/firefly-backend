import { z } from "zod";

const createCefrLevelSchema = z.object({
  code: z.enum(["a1", "a2", "b1", "b2", "c1"]),
  name: z.string().min(1).max(100)
}).strict();

const updateCefrLevelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional()
}).strict();

export type CreateCefrLevelDto = z.infer<typeof createCefrLevelSchema>;
export type UpdateCefrLevelDto = z.infer<typeof updateCefrLevelSchema>;
export { createCefrLevelSchema, updateCefrLevelSchema };
