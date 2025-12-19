import { ValidationError } from './ValidationError';

export class ValidationResult {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[] = []) {
    this.errors = errors;
  }

  get isValid(): boolean {
    return this.errors.length === 0;
  }

  addError(field: string, message: string, code?: string): void {
    this.errors.push(new ValidationError(field, message, code));
  }

  toResponse(): { field: string; message: string; code: string }[] {
    return this.errors.map(e => ({ field: e.field, message: e.message, code: e.code }));
  }
}
