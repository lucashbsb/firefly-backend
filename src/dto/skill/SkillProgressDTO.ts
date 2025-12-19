export interface SkillProgressDTO {
  code: string;
  name: string;
  category: string;
  level: string;
  proficiency: number;
  times_practiced: number;
  last_practiced: string | null;
}
