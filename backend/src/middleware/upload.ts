import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
]);

// Use memory storage — buffer is passed to StorageProvider
const storage = multer.memoryStorage();

const multerInstance = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error('File type not permitted.'), {
          code: 'INVALID_FILE_TYPE',
        }) as unknown as null,
        false
      );
    }
  },
});

// Export the configured multer middleware for single file upload (field: 'file')
export const uploadMiddleware = multerInstance.single('file');

// Error-handling wrapper for multer errors — converts to JSON responses
export function handleUploadErrors(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(422).json({ error: 'File exceeds maximum size of 25 MB.' });
      return;
    }
    res.status(422).json({ error: err.message });
    return;
  }
  const typedErr = err as { code?: string; message?: string };
  if (typedErr?.code === 'INVALID_FILE_TYPE') {
    res.status(422).json({
      error: 'File type not permitted. Allowed: PDF, DOCX, DOC, XLSX, XLS, TXT, PNG, JPG.',
    });
    return;
  }
  next(err);
}
