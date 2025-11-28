import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import CefrLevel from "./CefrLevelEntity.js";
import SkillCategory from "./SkillCategoryEntity.js";
import SkillTrack from "./SkillTrackEntity.js";
import User from "./UserEntity.js";

@Entity({ name: "tb_skills" })
class Skill {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by" })
  createdBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by" })
  updatedBy?: User;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @ManyToOne(() => SkillCategory)
  @JoinColumn({ name: "category_id" })
  category!: SkillCategory;

  @ManyToOne(() => SkillTrack)
  @JoinColumn({ name: "track_id" })
  track!: SkillTrack;

  @ManyToOne(() => CefrLevel)
  @JoinColumn({ name: "level_min_id" })
  levelMin!: CefrLevel;

  @ManyToOne(() => CefrLevel)
  @JoinColumn({ name: "level_max_id" })
  levelMax!: CefrLevel;

  @Column({ name: "importance_weight", type: "smallint" })
  importanceWeight!: number;

  @Column({ name: "difficulty_weight", type: "smallint" })
  difficultyWeight!: number;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;
}

export default Skill;
