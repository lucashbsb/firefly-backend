import { ValidationResult } from './ValidationResult';

export abstract class BaseValidation {
  protected result: ValidationResult;

  constructor() {
    this.result = new ValidationResult();
  }

  protected required(field: string, value: any, message?: string): boolean {
    if (value === undefined || value === null || value === '') {
      this.result.addError(field, message || `${field} is required`, 'REQUIRED');
      return false;
    }
    return true;
  }

  protected minLength(field: string, value: string, min: number, message?: string): boolean {
    if (!value || value.length < min) {
      this.result.addError(field, message || `${field} must be at least ${min} characters`, 'MIN_LENGTH');
      return false;
    }
    return true;
  }

  protected maxLength(field: string, value: string, max: number, message?: string): boolean {
    if (value && value.length > max) {
      this.result.addError(field, message || `${field} must be at most ${max} characters`, 'MAX_LENGTH');
      return false;
    }
    return true;
  }

  protected isEmail(field: string, value: string, message?: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.result.addError(field, message || 'Invalid email format', 'INVALID_EMAIL');
      return false;
    }
    return true;
  }

  protected isNumber(field: string, value: any, message?: string): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
      this.result.addError(field, message || `${field} must be a number`, 'INVALID_NUMBER');
      return false;
    }
    return true;
  }

  protected inRange(field: string, value: number, min: number, max: number, message?: string): boolean {
    if (value < min || value > max) {
      this.result.addError(field, message || `${field} must be between ${min} and ${max}`, 'OUT_OF_RANGE');
      return false;
    }
    return true;
  }

  protected isIn<T>(field: string, value: T, allowed: T[], message?: string): boolean {
    if (!allowed.includes(value)) {
      this.result.addError(field, message || `${field} must be one of: ${allowed.join(', ')}`, 'INVALID_VALUE');
      return false;
    }
    return true;
  }

  protected matches(field: string, value: string, pattern: RegExp, message?: string): boolean {
    if (!pattern.test(value)) {
      this.result.addError(field, message || `${field} format is invalid`, 'INVALID_FORMAT');
      return false;
    }
    return true;
  }

  getResult(): ValidationResult {
    return this.result;
  }

  reset(): void {
    this.result = new ValidationResult();
  }
}
