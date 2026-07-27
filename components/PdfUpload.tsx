'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

interface PdfUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfUpload({
  files,
  onChange,
  disabled = false,
}: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const newFiles = Array.from(incoming);

      for (const file of newFiles) {
        if (file.type !== 'application/pdf') {
          setError('Only PDF files are allowed');
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds the 3MB size limit`);
          return;
        }
      }

      const combined = [...files, ...newFiles];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} PDF files allowed`);
        return;
      }

      onChange(combined);
    },
    [files, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      validateAndAdd(e.dataTransfer.files);
    },
    [disabled, validateAndAdd],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <div className="flex h-full flex-col">
      <label className="mb-2 text-sm font-semibold text-slate-700">
        Resume PDFs
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all lg:min-h-[280px] ${
          isDragging
            ? 'border-accent-500 bg-accent-50'
            : 'border-slate-200 bg-white hover:border-accent-300 hover:bg-accent-50/30'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
          <svg
            className="h-6 w-6 text-accent-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-sm font-medium text-slate-700">
          Drag & drop PDF resumes here
        </p>
        <p className="mt-1 text-xs text-slate-400">or click to browse</p>
        <p className="mt-3 text-xs text-slate-400">
          Up to {MAX_FILES} files, 3MB each
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate text-slate-700">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                disabled={disabled}
                className="ml-2 shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
                aria-label={`Remove ${file.name}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
