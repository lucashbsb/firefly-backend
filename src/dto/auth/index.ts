export { RegisterDTO } from './RegisterDTO';
export { LoginDTO } from './LoginDTO';
export { RefreshTokenDTO } from './RefreshTokenDTO';
export { UserWithPermissionsDTO } from './UserWithPermissionsDTO';
export { CreateRoleDTO } from './CreateRoleDTO';
export { CreatePermissionDTO } from './CreatePermissionDTO';

export type PermissionCode =
  | 'users.list' | 'users.view' | 'users.create' | 'users.update' | 'users.delete'
  | 'roles.list' | 'roles.manage' | 'roles.assign'
  | 'permissions.list' | 'permissions.manage'
  | 'lessons.view' | 'lessons.start' | 'lessons.submit'
  | 'reports.view_own' | 'reports.view_all'
  | 'ai.settings' | 'ai.use'
  | 'admin.dashboard' | 'admin.settings';

export const PERMISSION = {
  USER_LIST: 'users.list' as PermissionCode,
  USER_VIEW: 'users.view' as PermissionCode,
  USER_CREATE: 'users.create' as PermissionCode,
  USER_UPDATE: 'users.update' as PermissionCode,
  USER_DELETE: 'users.delete' as PermissionCode,
  ROLE_LIST: 'roles.list' as PermissionCode,
  ROLE_MANAGE: 'roles.manage' as PermissionCode,
  ROLE_ASSIGN: 'roles.assign' as PermissionCode,
  PERMISSION_LIST: 'permissions.list' as PermissionCode,
  PERMISSION_MANAGE: 'permissions.manage' as PermissionCode,
  LESSON_VIEW: 'lessons.view' as PermissionCode,
  LESSON_START: 'lessons.start' as PermissionCode,
  LESSON_SUBMIT: 'lessons.submit' as PermissionCode,
  REPORT_VIEW_OWN: 'reports.view_own' as PermissionCode,
  REPORT_VIEW_ALL: 'reports.view_all' as PermissionCode,
  AI_SETTINGS: 'ai.settings' as PermissionCode,
  AI_USE: 'ai.use' as PermissionCode,
  ADMIN_DASHBOARD: 'admin.dashboard' as PermissionCode,
  ADMIN_SETTINGS: 'admin.settings' as PermissionCode,
} as const;
