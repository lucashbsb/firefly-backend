import AppError from "../exception/AppError.js";
import { CreateSkillTrackDto, UpdateSkillTrackDto } from "../validation/skill-tracks/skill-track.schema.js";
import skillTrackRepository from "../repository/SkillTrackRepository.js";

class SkillTrackService {
  async createTrack(payload: CreateSkillTrackDto) {
    const existing = await skillTrackRepository.findByCode(payload.code);
    if (existing) {
      throw new AppError("Skill track already exists", 409);
    }
    const track = await skillTrackRepository.create(payload);
    return skillTrackRepository.save(track);
  }

  async updateTrack(id: number, payload: UpdateSkillTrackDto) {
    const track = await skillTrackRepository.findById(id);
    if (!track) {
      throw new AppError("Skill track not found", 404);
    }
    Object.assign(track, payload);
    return skillTrackRepository.save(track);
  }

  async listTracks() {
    return skillTrackRepository.listActive();
  }

  async getTrack(id: number) {
    const track = await skillTrackRepository.findById(id);
    if (!track) {
      throw new AppError("Skill track not found", 404);
    }
    return track;
  }
}

export default new SkillTrackService();
