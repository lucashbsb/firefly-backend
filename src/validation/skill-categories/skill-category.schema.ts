import { z } from "zod";

const createSkillCategorySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100)
}).strict();

const updateSkillCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional()
}).strict();

export type CreateSkillCategoryDto = z.infer<typeof createSkillCategorySchema>;
export type UpdateSkillCategoryDto = z.infer<typeof updateSkillCategorySchema>;
export { createSkillCategorySchema, updateSkillCategorySchema };
