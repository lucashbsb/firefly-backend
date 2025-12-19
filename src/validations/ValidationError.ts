export class ValidationError extends Error {
  public readonly field: string;
  public readonly code: string;

  constructor(field: string, message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.field = field;
    this.code = code;
    this.name = 'ValidationError';
  }
}
