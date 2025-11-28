import AppError from "../exception/AppError.js";
import { CreateCefrLevelDto, UpdateCefrLevelDto } from "../validation/cefr-levels/cefr-level.schema.js";
import cefrLevelRepository from "../repository/CefrLevelRepository.js";

class CefrLevelService {
  async createLevel(payload: CreateCefrLevelDto) {
    const existing = await cefrLevelRepository.findByCode(payload.code);
    if (existing) {
      throw new AppError("CEFR level already exists", 409);
    }
    const level = await cefrLevelRepository.create(payload);
    return cefrLevelRepository.save(level);
  }

  async updateLevel(id: number, payload: UpdateCefrLevelDto) {
    const level = await cefrLevelRepository.findById(id);
    if (!level) {
      throw new AppError("CEFR level not found", 404);
    }
    Object.assign(level, payload);
    return cefrLevelRepository.save(level);
  }

  async listLevels() {
    return cefrLevelRepository.listActive();
  }

  async getLevel(id: number) {
    const level = await cefrLevelRepository.findById(id);
    if (!level) {
      throw new AppError("CEFR level not found", 404);
    }
    return level;
  }
}

export default new CefrLevelService();
