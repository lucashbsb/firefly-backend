import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';
import { RegisterDTO, LoginDTO, CreateRoleDTO, CreatePermissionDTO } from '../dto';

export class AuthValidation extends BaseValidation {
  validateRegister(data: RegisterDTO): ValidationResult {
    this.reset();
    
    if (this.required('email', data.email)) {
      this.isEmail('email', data.email);
      this.maxLength('email', data.email, 255);
    }

    if (this.required('password', data.password)) {
      this.minLength('password', data.password, 8, 'Password must be at least 8 characters');
      this.maxLength('password', data.password, 100);
    }

    if (data.name !== undefined && data.name !== '') {
      this.minLength('name', data.name, 2, 'Name must be at least 2 characters');
      this.maxLength('name', data.name, 100);
    }

    return this.getResult();
  }

  validateLogin(data: LoginDTO): ValidationResult {
    this.reset();
    
    if (this.required('email', data.email)) {
      this.isEmail('email', data.email);
    }

    this.required('password', data.password);

    return this.getResult();
  }

  validateCreateRole(data: CreateRoleDTO): ValidationResult {
    this.reset();
    
    if (this.required('name', data.name)) {
      this.minLength('name', data.name, 2);
      this.maxLength('name', data.name, 50);
      this.matches('name', data.name, /^[a-z_]+$/, 'Role name must be lowercase with underscores only');
    }

    if (data.description) {
      this.maxLength('description', data.description, 255);
    }

    return this.getResult();
  }

  validateCreatePermission(data: CreatePermissionDTO): ValidationResult {
    this.reset();
    
    if (this.required('code', data.code)) {
      this.minLength('code', data.code, 2);
      this.maxLength('code', data.code, 50);
      this.matches('code', data.code, /^[A-Z_]+$/, 'Permission code must be uppercase with underscores only');
    }

    if (data.description) {
      this.maxLength('description', data.description, 255);
    }

    return this.getResult();
  }
}

export const authValidation = new AuthValidation();
