export interface CreateUserDTO {
  email: string;
  name: string;
  password?: string;
  native_language?: string;
  target_level?: string;
  current_level?: string;
}
