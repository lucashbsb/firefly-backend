export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
}
