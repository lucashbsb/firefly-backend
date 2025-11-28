import { DataSource } from "typeorm";
import dbConfig from "../../config/db.config.js";
import CefrLevel from "../../entity/CefrLevelEntity.js";
import Skill from "../../entity/SkillEntity.js";
import SkillCategory from "../../entity/SkillCategoryEntity.js";
import SkillTrack from "../../entity/SkillTrackEntity.js";
import Student from "../../entity/StudentEntity.js";
import User from "../../entity/UserEntity.js";
import Role from "../../entity/RoleEntity.js";
import Permission from "../../entity/PermissionEntity.js";
import RolePermission from "../../entity/RolePermissionEntity.js";
import UserRole from "../../entity/UserRoleEntity.js";
import logger from "../../util/Logger.js";

const entities = [CefrLevel, Skill, SkillCategory, SkillTrack, Student, User, Role, Permission, RolePermission, UserRole];

const dataSource = new DataSource({
  type: "postgres",
  url: dbConfig.url,
  synchronize: dbConfig.synchronize,
  logging: dbConfig.logging,
  entities
});

export const initializeDataSource = async () => {
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
      logger.info("Database connection established successfully");
    } catch (error) {
      logger.error("Failed to initialize database connection", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  return dataSource;
};

export const AppDataSource = dataSource;
export default dataSource;
