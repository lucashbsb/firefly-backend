import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';
import { CreateUserDTO, UpdateUserDTO } from '../dto';

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export class UserValidation extends BaseValidation {
  validateCreate(data: CreateUserDTO): ValidationResult {
    this.reset();
    
    if (this.required('email', data.email)) {
      this.isEmail('email', data.email);
      this.maxLength('email', data.email, 255);
    }

    if (data.name !== undefined && data.name !== '') {
      this.minLength('name', data.name, 2);
      this.maxLength('name', data.name, 100);
    }

    return this.getResult();
  }

  validateUpdate(data: UpdateUserDTO): ValidationResult {
    this.reset();
    
    if (data.name !== undefined && data.name !== '') {
      this.minLength('name', data.name, 2);
      this.maxLength('name', data.name, 100);
    }

    if (data.current_level !== undefined) {
      this.isIn('current_level', data.current_level, VALID_LEVELS);
    }

    if (data.target_level !== undefined) {
      this.isIn('target_level', data.target_level, VALID_LEVELS);
    }

    return this.getResult();
  }

  validatePasswordChange(currentPassword: string, newPassword: string): ValidationResult {
    this.reset();
    
    this.required('currentPassword', currentPassword);
    
    if (this.required('newPassword', newPassword)) {
      this.minLength('newPassword', newPassword, 8);
      this.maxLength('newPassword', newPassword, 100);
    }

    return this.getResult();
  }
}

export const userValidation = new UserValidation();
