import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export class LessonValidation extends BaseValidation {
  validateDay(day: unknown): ValidationResult {
    this.reset();
    
    if (this.required('day', day)) {
      const dayNum = typeof day === 'string' ? parseInt(day, 10) : day as number;
      if (this.isNumber('day', dayNum)) {
        this.inRange('day', dayNum, 1, 365);
      }
    }

    return this.getResult();
  }

  validateLevel(level: string): ValidationResult {
    this.reset();
    this.isIn('level', level, VALID_LEVELS);
    return this.getResult();
  }

  validateAnswer(day: unknown, answers: unknown): ValidationResult {
    this.reset();
    
    this.required('day', day);
    this.required('answers', answers);

    if (day) {
      const dayNum = typeof day === 'string' ? parseInt(day, 10) : day as number;
      if (this.isNumber('day', dayNum)) {
        this.inRange('day', dayNum, 1, 365);
      }
    }

    if (answers && !Array.isArray(answers)) {
      this.result.addError('answers', 'must be an array', 'INVALID_TYPE');
    }

    return this.getResult();
  }

  validateExerciseIndex(index: number, maxIndex: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('exerciseIndex', index)) {
      this.inRange('exerciseIndex', index, 0, maxIndex);
    }

    return this.getResult();
  }
}

export const lessonValidation = new LessonValidation();
