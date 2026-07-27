'use client';

import { useCallback, useState } from 'react';
import AnalyzeButton from '@/components/AnalyzeButton';
import EmptyState from '@/components/EmptyState';
import JobDescriptionInput from '@/components/JobDescriptionInput';
import PdfUpload from '@/components/PdfUpload';
import ResultsTable from '@/components/ResultsTable';
import type { AnalyzeResponse, CandidateResult } from '@/lib/types';

const MIN_JD_LENGTH = 50;

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(results: CandidateResult[]): string {
  const headers = [
    'Candidate Name',
    'File Name',
    'Match Score',
    'Matched Skills',
    'Missing Skills',
    'Summary',
    'Error',
  ];

  const rows = results.map((result) => {
    if (result.success && result.data) {
      return [
        result.data.candidateName,
        result.fileName,
        String(result.data.matchScore),
        result.data.matchedSkills.join('; '),
        result.data.missingMustHaveSkills.join('; '),
        result.data.summary,
        '',
      ];
    }

    return [
      '',
      result.fileName,
      '',
      '',
      '',
      '',
      result.error ?? 'Unknown error',
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\n');
}

export default function HomePage() {
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze =
    jobDescription.length >= MIN_JD_LENGTH && files.length > 0 && !loading;

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as
        | AnalyzeResponse
        | { error: string };

      if (!response.ok) {
        setError('error' in data ? data.error : 'Analysis failed');
        return;
      }

      if ('results' in data) {
        setResults(data.results);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [canAnalyze, jobDescription, files]);

  const handleExportCsv = useCallback(() => {
    const csv = buildCsv(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `screeniq-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ScreenIQ</h1>
              <p className="text-xs text-slate-500">
                AI-powered resume screening
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-soft">
            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              disabled={loading}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-soft">
            <PdfUpload files={files} onChange={setFiles} disabled={loading} />
          </section>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <AnalyzeButton
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            loading={loading}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <section className="mt-10">
          {results.length > 0 ? (
            <ResultsTable results={results} onExportCsv={handleExportCsv} />
          ) : (
            !loading && <EmptyState />
          )}
        </section>
      </div>
    </main>
  );
}
