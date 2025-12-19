export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  created_at: string;
}
