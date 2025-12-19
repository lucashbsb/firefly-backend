import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

export class FileService {
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  read<T>(subDir: string, filename: string): T | null {
    const filePath = path.join(DATA_DIR, subDir, filename);
    
    if (!fs.existsSync(filePath)) return null;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  write<T>(subDir: string, filename: string, data: T): void {
    const dir = path.join(DATA_DIR, subDir);
    this.ensureDir(dir);
    
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  exists(subDir: string, filename: string): boolean {
    const filePath = path.join(DATA_DIR, subDir, filename);
    return fs.existsSync(filePath);
  }

  list(subDir: string, extension = '.json'): string[] {
    const dir = path.join(DATA_DIR, subDir);
    
    if (!fs.existsSync(dir)) return [];
    
    return fs.readdirSync(dir).filter(f => f.endsWith(extension));
  }

  delete(subDir: string, filename: string): boolean {
    const filePath = path.join(DATA_DIR, subDir, filename);
    
    if (!fs.existsSync(filePath)) return false;
    
    fs.unlinkSync(filePath);
    return true;
  }
}

export const fileService = new FileService();
