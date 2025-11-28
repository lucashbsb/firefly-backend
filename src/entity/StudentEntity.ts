import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import CefrLevel from "./CefrLevelEntity.js";
import User from "./UserEntity.js";

@Entity({ name: "tb_students" })
class Student {
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

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "display_name", nullable: true })
  displayName?: string;

  @ManyToOne(() => CefrLevel, { nullable: true })
  @JoinColumn({ name: "initial_level_id" })
  initialLevel?: CefrLevel;

  @ManyToOne(() => CefrLevel, { nullable: true })
  @JoinColumn({ name: "current_level_id" })
  currentLevel?: CefrLevel;

  @Column({ default: "pt-BR" })
  locale!: string;

  @Column({ default: "America/Sao_Paulo" })
  timezone!: string;

  @Column({ name: "learning_goal", nullable: true })
  learningGoal?: string;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;
}

export default Student;
