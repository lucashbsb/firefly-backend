import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import User from "./UserEntity.js";

@Entity({ name: "tb_skill_tracks" })
class SkillTrack {
  @PrimaryGeneratedColumn("increment", { type: "smallint" })
  id!: number;

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
}

export default SkillTrack;
