import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { API_BASE, API_URL } from '../../../lib/api';
import { compressImageFile, MAX_UPLOAD_BYTES } from '../../../lib/imageCompression';

export interface FileUploaderProps {
  onUploadSuccess: (url: string) => void;
  category?: string;
  label?: string;
  helperText?: string;
  initialUrl?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  category = 'receipts',
  label = 'Unggah Bukti Transfer',
  helperText = 'Format JPG, PNG, atau WEBP. Maksimal 2MB (dikompres otomatis).',
  initialUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Ukuran gambar maksimal 2 MB.');
      e.target.value = '';
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const compressedFile = await compressImageFile(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('category', category);

      const apiUrl = `${API_BASE}/upload`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengunggah file.');
      }

      const fullUrl =
        data.url.startsWith('http') || data.url.startsWith('data:')
          ? data.url
          : `${API_URL}${data.url}`;
      setPreview(fullUrl);
      onUploadSuccess(fullUrl);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat unggah.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <span className="text-[0.65rem] font-medium tracking-[0.1em] uppercase text-muted">
          {label}
        </span>
      )}

      {preview ? (
        <div className="relative border border-line bg-surface/30 p-2 flex items-center gap-4">
          <img
            src={preview}
            alt="Preview"
            className="w-20 h-20 object-cover border border-line bg-bg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>File Terunggah</span>
            </div>
            <p className="text-[0.7rem] text-muted truncate mt-0.5">{preview}</p>
          </div>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="p-1.5 text-muted hover:text-ink transition-colors"
            title="Ganti file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="border-2 border-dashed border-line hover:border-ink/50 bg-surface/20 hover:bg-surface/40 p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 text-center">
          <UploadCloud className="w-7 h-7 text-muted mb-2" />
          <span className="text-xs text-ink font-medium">
            {isUploading ? 'Sedang mengunggah...' : 'Pilih file atau seret ke sini'}
          </span>
          <span className="text-[0.68rem] text-muted mt-1">{helperText}</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
      )}

      {error && (
        <div className="flex items-center gap-1 text-[0.7rem] text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
