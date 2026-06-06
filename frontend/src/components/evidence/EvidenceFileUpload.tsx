import React, { useCallback, useRef, useState } from 'react';
import { FileText, FileSpreadsheet, Image, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt', 'png', 'jpg', 'jpeg', 'zip'];
const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/x-zip-compressed',
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_FILES = 20;

type FileStatus = 'queued' | 'uploading' | 'success' | 'error';

interface FileEntry {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

interface EvidenceFileUploadProps {
  engagementId?: string;
  evidenceId?: string;
  onFilesChange?: (files: File[]) => void;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText size={16} className="text-slate-500" />;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={16} className="text-slate-500" />;
  if (['png', 'jpg', 'jpeg'].includes(ext)) return <Image size={16} className="text-slate-500" />;
  return <File size={16} className="text-slate-500" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
  if (file.type && !ALLOWED_MIMES.some(m => file.type === m || file.type.startsWith(m))) {
    // Some environments may have imprecise MIME types; extension check is primary
    if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
  }
  return true;
}

export const EvidenceFileUpload: React.FC<EvidenceFileUploadProps> = ({
  onFilesChange,
}) => {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [sizeErrors, setSizeErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setTypeError(null);
    setSizeErrors([]);
    const filesArr = Array.from(newFiles);

    const typeErrors: string[] = [];
    const sErrors: string[] = [];
    const valid: File[] = [];

    for (const f of filesArr) {
      if (!isAllowedFile(f)) {
        typeErrors.push(f.name);
        continue;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        sErrors.push(`'${f.name}' exceeds maximum size of 50 MB.`);
        continue;
      }
      valid.push(f);
    }

    if (typeErrors.length > 0) {
      setTypeError('File type not permitted. Allowed: PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG, JPEG, ZIP.');
    }
    if (sErrors.length > 0) {
      setSizeErrors(sErrors);
    }

    setFileEntries((prev) => {
      const totalCount = prev.length + valid.length;
      if (totalCount > MAX_FILES) {
        toast({ title: 'Maximum of 20 files per evidence item.', variant: 'destructive' });
        const allowed = valid.slice(0, MAX_FILES - prev.length);
        const newEntries = allowed.map((f) => ({ file: f, status: 'queued' as FileStatus, progress: 0 }));
        const updated = [...prev, ...newEntries];
        onFilesChange?.(updated.map((e) => e.file));
        return updated;
      }
      const newEntries = valid.map((f) => ({ file: f, status: 'queued' as FileStatus, progress: 0 }));
      const updated = [...prev, ...newEntries];
      onFilesChange?.(updated.map((e) => e.file));
      return updated;
    });
  }, [toast, onFilesChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleChooseFiles = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemove = (idx: number) => {
    setFileEntries((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      onFilesChange?.(updated.map((e) => e.file));
      return updated;
    });
  };

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-label="Evidence file upload area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="min-h-[120px] flex flex-col items-center justify-center rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? 'hsl(221 83% 53%)' : 'hsl(214 32% 91%)',
          background: dragOver ? 'hsl(221 83% 93%)' : 'white',
        }}
        onClick={handleChooseFiles}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mb-2"
          onClick={(e) => { e.stopPropagation(); handleChooseFiles(); }}
        >
          📎 Choose Files
        </Button>
        <p className="text-sm text-slate-500">or drag and drop files here</p>
        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG, JPEG, ZIP</p>
        <p className="text-xs text-slate-400">Max 50 MB per file · Max 20 files</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.zip"
        onChange={handleInputChange}
      />

      {typeError && (
        <p className="text-xs text-red-700 bg-red-50 rounded px-2 py-1">{typeError}</p>
      )}
      {sizeErrors.map((err, i) => (
        <p key={i} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1">{err}</p>
      ))}

      {fileEntries.length > 0 && (
        <ul className="space-y-1">
          {fileEntries.map((entry, idx) => (
            <li
              key={`${entry.file.name}-${idx}`}
              aria-label={`File ${idx + 1} of ${fileEntries.length}: ${entry.file.name}, ${formatBytes(entry.file.size)}`}
              className="flex items-center gap-2 rounded border border-slate-100 bg-slate-50 px-3 h-12"
            >
              {getFileIcon(entry.file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{entry.file.name}</p>
                <p className="text-[12px] text-slate-400">{formatBytes(entry.file.size)}</p>
                {entry.status === 'uploading' && (
                  <Progress value={entry.progress} className="h-1 mt-0.5" />
                )}
              </div>
              {entry.status === 'success' && <CheckCircle size={16} className="text-green-600 shrink-0" />}
              {entry.status === 'error' && <AlertCircle size={16} className="text-red-600 shrink-0" />}
              <button
                type="button"
                aria-label={`Remove ${entry.file.name}`}
                onClick={() => handleRemove(idx)}
                className="shrink-0 text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
