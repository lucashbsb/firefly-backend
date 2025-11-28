import { z } from "zod";

const createSkillTrackSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100)
}).strict();

const updateSkillTrackSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional()
}).strict();

export type CreateSkillTrackDto = z.infer<typeof createSkillTrackSchema>;
export type UpdateSkillTrackDto = z.infer<typeof updateSkillTrackSchema>;
export { createSkillTrackSchema, updateSkillTrackSchema };
