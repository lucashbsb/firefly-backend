import AppError from "../exception/AppError.js";
import { CreateRoleDto, UpdateRoleDto } from "../validation/roles/role.schema.js";
import roleRepository from "../repository/RoleRepository.js";

class RoleService {
  async createRole(payload: CreateRoleDto) {
    const existing = await roleRepository.findByCode(payload.code);
    if (existing) {
      throw new AppError("Role already exists", 409);
    }
    const role = await roleRepository.create(payload);
    return roleRepository.save(role);
  }

  async updateRole(id: string, payload: UpdateRoleDto) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    Object.assign(role, payload);
    return roleRepository.save(role);
  }

  async listRoles() {
    return roleRepository.listActive();
  }

  async getRole(id: string) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    return role;
  }
}

export default new RoleService();
