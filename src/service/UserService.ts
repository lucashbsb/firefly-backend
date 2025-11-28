import AppError from "../exception/AppError.js";
import { CreateUserDto, UpdateUserDto } from "../validation/users/user.schema.js";
import userRepository from "../repository/UserRepository.js";

class UserService {
  async createUser(payload: CreateUserDto) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError("User already exists", 409);
    }
    const user = await userRepository.create(payload);
    return userRepository.save(user);
  }

  async updateUser(id: string, payload: UpdateUserDto) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    Object.assign(user, payload);
    return userRepository.save(user);
  }

  async listUsers() {
    return userRepository.listActive();
  }

  async getUser(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
}

export default new UserService();
