import { Role } from '../../models/entities';

export interface UserWithPermissionsDTO {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: string[];
}
