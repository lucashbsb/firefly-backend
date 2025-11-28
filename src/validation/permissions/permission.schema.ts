import { z } from "zod";

const createPermissionSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  domain: z.string().max(50).optional(),
  target: z.enum(["backend", "frontend", "both"]).optional()
}).strict();

const updatePermissionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  domain: z.string().max(50).optional(),
  target: z.enum(["backend", "frontend", "both"]).optional(),
  isActive: z.boolean().optional()
}).strict();

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionSchema>;
export { createPermissionSchema, updatePermissionSchema };
