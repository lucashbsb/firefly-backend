export interface CreatePermissionDTO {
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}
