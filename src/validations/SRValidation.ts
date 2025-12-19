import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';

export class SRValidation extends BaseValidation {
  validateQuality(quality: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('quality', quality)) {
      this.inRange('quality', quality, 0, 5);
    }

    return this.getResult();
  }

  validateResponseTime(responseTime: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('responseTime', responseTime)) {
      if (responseTime < 0) {
        this.result.addError('responseTime', 'Response time cannot be negative', 'INVALID_VALUE');
      }
    }

    return this.getResult();
  }

  validateReview(quality: number, responseTime: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('quality', quality)) {
      this.inRange('quality', quality, 0, 5);
    }

    if (this.isNumber('responseTime', responseTime)) {
      if (responseTime < 0) {
        this.result.addError('responseTime', 'Response time cannot be negative', 'INVALID_VALUE');
      }
    }

    return this.getResult();
  }

  validateLimit(limit: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('limit', limit)) {
      this.inRange('limit', limit, 1, 100);
    }

    return this.getResult();
  }
}

export const srValidation = new SRValidation();
