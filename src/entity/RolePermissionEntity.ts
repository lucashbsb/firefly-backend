import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Column } from "typeorm";
import Role from "./RoleEntity.js";
import Permission from "./PermissionEntity.js";
import User from "./UserEntity.js";

@Entity({ name: "tb_role_permissions" })
class RolePermission {
  @PrimaryGeneratedColumn("increment")
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

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @ManyToOne(() => Permission, { eager: true })
  @JoinColumn({ name: "permission_id" })
  permission!: Permission;
}

export default RolePermission;
