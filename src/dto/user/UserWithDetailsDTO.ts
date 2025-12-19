import { User, UserSettings, UserStreak } from '../../models/entities';

export interface UserWithDetailsDTO extends User {
  settings?: UserSettings;
  streak?: UserStreak;
}
