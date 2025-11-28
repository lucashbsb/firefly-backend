import { z } from "zod";

const createStudentSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().max(200).optional(),
  initialLevelId: z.number().int().positive().optional(),
  currentLevelId: z.number().int().positive().optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  learningGoal: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional()
}).strict();

const updateStudentSchema = z.object({
  displayName: z.string().max(200).optional(),
  currentLevelId: z.number().int().positive().optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  learningGoal: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
}).strict();

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export { createStudentSchema, updateStudentSchema };
