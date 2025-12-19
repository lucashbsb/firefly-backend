import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';
import { CreateReportDTO } from '../dto';

export class ReportValidation extends BaseValidation {
  validateCreate(data: CreateReportDTO): ValidationResult {
    this.reset();
    
    if (this.required('day', data.day)) {
      if (this.isNumber('day', data.day)) {
        this.inRange('day', data.day, 1, 365);
      }
    }

    if (this.required('performance_score', data.performance_score)) {
      if (this.isNumber('performance_score', data.performance_score)) {
        this.inRange('performance_score', data.performance_score, 0, 100);
      }
    }

    return this.getResult();
  }

  validateDay(day: number): ValidationResult {
    this.reset();
    
    if (this.isNumber('day', day)) {
      this.inRange('day', day, 1, 365);
    }

    return this.getResult();
  }
}

export const reportValidation = new ReportValidation();
