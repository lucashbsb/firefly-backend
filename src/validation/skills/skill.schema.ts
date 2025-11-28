import { z } from "zod";

const createSkillSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  categoryId: z.number().int().positive(),
  trackId: z.number().int().positive(),
  levelMinId: z.number().int().positive(),
  levelMaxId: z.number().int().positive(),
  importanceWeight: z.number().int().min(1).max(5),
  difficultyWeight: z.number().int().min(1).max(5),
  metadata: z.record(z.unknown()).optional()
}).strict();

const updateSkillSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  importanceWeight: z.number().int().min(1).max(5).optional(),
  difficultyWeight: z.number().int().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
}).strict();

export type CreateSkillDto = z.infer<typeof createSkillSchema>;
export type UpdateSkillDto = z.infer<typeof updateSkillSchema>;
export { createSkillSchema, updateSkillSchema };
