import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import UserRole from "../entity/UserRoleEntity.js";

class UserRoleRepository {
  private repository: Repository<UserRole> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(UserRole);
    }
    return this.repository;
  }

  async findByUserId(userId: string) {
    const repo = await this.getRepository();
    return repo.find({ where: { user: { id: userId }, isActive: true } });
  }

  async save(userRole: UserRole) {
    const repo = await this.getRepository();
    return repo.save(userRole);
  }

  async create(data: Partial<UserRole>) {
    const repo = await this.getRepository();
    return repo.create(data);
  }

  async deleteByUserAndRole(userId: string, roleId: string) {
    const repo = await this.getRepository();
    return repo.delete({ user: { id: userId }, role: { id: roleId } });
  }
}

export default new UserRoleRepository();
