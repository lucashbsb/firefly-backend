import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export class SkillValidation extends BaseValidation {
  validateCode(code: string): ValidationResult {
    this.reset();
    
    if (this.required('code', code)) {
      this.maxLength('code', code, 50);
    }

    return this.getResult();
  }

  validateLevel(level: string): ValidationResult {
    this.reset();
    this.isIn('level', level, VALID_LEVELS);
    return this.getResult();
  }

  validateProgress(correctCount: number, attempts: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('correctCount', correctCount)) {
      if (correctCount < 0) {
        this.result.addError('correctCount', 'Correct count cannot be negative', 'INVALID_VALUE');
      }
    }

    if (this.isNumber('attempts', attempts)) {
      if (attempts < 0) {
        this.result.addError('attempts', 'Attempts cannot be negative', 'INVALID_VALUE');
      }
    }

    if (correctCount > attempts) {
      this.result.addError('correctCount', 'Correct count cannot exceed attempts', 'INVALID_VALUE');
    }

    return this.getResult();
  }
}

export const skillValidation = new SkillValidation();
