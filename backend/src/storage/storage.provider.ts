export interface StorageProvider {
  save(file: Buffer, filename: string, mimeType: string): Promise<{ file_ref: string }>;
  get(file_ref: string): Promise<Buffer>;
  delete(file_ref: string): Promise<void>;
  getUrl(file_ref: string): string;
}
