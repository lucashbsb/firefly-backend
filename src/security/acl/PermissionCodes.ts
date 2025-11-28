export const PermissionCodes = {
  USERS_CREATE: "users.create",
  USERS_VIEW: "users.view",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  
  STUDENTS_CREATE: "students.create",
  STUDENTS_VIEW: "students.view",
  STUDENTS_UPDATE: "students.update",
  STUDENTS_DELETE: "students.delete",
  
  SKILLS_CREATE: "skills.create",
  SKILLS_VIEW: "skills.view",
  SKILLS_UPDATE: "skills.update",
  SKILLS_DELETE: "skills.delete",
  
  SKILL_CATEGORIES_CREATE: "skill-categories.create",
  SKILL_CATEGORIES_VIEW: "skill-categories.view",
  SKILL_CATEGORIES_UPDATE: "skill-categories.update",
  SKILL_CATEGORIES_DELETE: "skill-categories.delete",
  
  SKILL_TRACKS_CREATE: "skill-tracks.create",
  SKILL_TRACKS_VIEW: "skill-tracks.view",
  SKILL_TRACKS_UPDATE: "skill-tracks.update",
  SKILL_TRACKS_DELETE: "skill-tracks.delete",
  
  CEFR_LEVELS_CREATE: "cefr-levels.create",
  CEFR_LEVELS_VIEW: "cefr-levels.view",
  CEFR_LEVELS_UPDATE: "cefr-levels.update",
  CEFR_LEVELS_DELETE: "cefr-levels.delete",
  
  ROLES_CREATE: "roles.create",
  ROLES_VIEW: "roles.view",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  
  PERMISSIONS_CREATE: "permissions.create",
  PERMISSIONS_VIEW: "permissions.view",
  PERMISSIONS_UPDATE: "permissions.update",
  PERMISSIONS_DELETE: "permissions.delete"
} as const;

export type PermissionCode = typeof PermissionCodes[keyof typeof PermissionCodes];

export default PermissionCodes;
