import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { StorageProvider } from './storage.provider';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists at module load
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class LocalStorageProvider implements StorageProvider {
  async save(file: Buffer, filename: string, _mimeType: string): Promise<{ file_ref: string }> {
    const ext = path.extname(filename).toLowerCase();
    const file_ref = `${uuidv4()}${ext}`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, file_ref), file);
    return { file_ref };
  }

  async get(file_ref: string): Promise<Buffer> {
    return fs.promises.readFile(path.join(UPLOADS_DIR, file_ref));
  }

  async delete(file_ref: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, file_ref);
    try {
      await fs.promises.unlink(filePath);
    } catch (err: unknown) {
      // Ignore ENOENT (file already gone)
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  getUrl(file_ref: string): string {
    return `/uploads/${file_ref}`;
  }
}

// Singleton instance for use throughout backend
export const storageProvider = new LocalStorageProvider();
