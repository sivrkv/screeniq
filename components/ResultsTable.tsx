'use client';

import type { CandidateResult } from '@/lib/types';

interface ResultsTableProps {
  results: CandidateResult[];
  onExportCsv: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  let colorClass = 'bg-red-100 text-red-700';
  if (score >= 70) colorClass = 'bg-emerald-100 text-emerald-700';
  else if (score >= 40) colorClass = 'bg-amber-100 text-amber-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {score}%
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  let barColor = 'bg-red-500';
  if (score >= 70) barColor = 'bg-emerald-500';
  else if (score >= 40) barColor = 'bg-amber-500';

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

function SkillTags({
  skills,
  variant,
}: {
  skills: string[];
  variant: 'matched' | 'missing';
}) {
  if (skills.length === 0) {
    return <span className="text-xs text-slate-400">None</span>;
  }

  const colorClass =
    variant === 'matched'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-red-50 text-red-700 border-red-100';

  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`rounded-md border px-2 py-0.5 text-xs ${colorClass}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export default function ResultsTable({
  results,
  onExportCsv,
}: ResultsTableProps) {
  const successfulResults = results.filter((r) => r.success);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Results ({results.length})
        </h2>
        {successfulResults.length > 0 && (
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-accent-300 hover:text-accent-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-600">
                Candidate
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">Score</th>
              <th className="px-4 py-3 font-semibold text-slate-600">
                Matched Skills
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">
                Missing Skills
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">
                Summary
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr
                key={result.fileName}
                className="border-b border-slate-50 transition hover:bg-slate-50/50"
              >
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-800">
                    {result.success
                      ? result.data?.candidateName
                      : result.fileName}
                  </div>
                  {result.success && (
                    <div className="mt-0.5 text-xs text-slate-400">
                      {result.fileName}
                    </div>
                  )}
                  {!result.success && result.error && (
                    <div className="mt-1 text-xs text-red-600">
                      {result.error}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  {result.success && result.data ? (
                    <div className="w-28 space-y-1.5">
                      <ScoreBadge score={result.data.matchScore} />
                      <ScoreBar score={result.data.matchScore} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {result.success && result.data ? (
                    <SkillTags
                      skills={result.data.matchedSkills}
                      variant="matched"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {result.success && result.data ? (
                    <SkillTags
                      skills={result.data.missingMustHaveSkills}
                      variant="missing"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="max-w-xs px-4 py-4 text-slate-600">
                  {result.success && result.data ? (
                    result.data.summary
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {results.map((result) => (
          <div
            key={result.fileName}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {result.success
                    ? result.data?.candidateName
                    : result.fileName}
                </h3>
                <p className="text-xs text-slate-400">{result.fileName}</p>
              </div>
              {result.success && result.data && (
                <ScoreBadge score={result.data.matchScore} />
              )}
            </div>

            {result.success && result.data && (
              <>
                <div className="mt-3">
                  <ScoreBar score={result.data.matchScore} />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Matched Skills
                    </p>
                    <SkillTags
                      skills={result.data.matchedSkills}
                      variant="matched"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Missing Skills
                    </p>
                    <SkillTags
                      skills={result.data.missingMustHaveSkills}
                      variant="missing"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Summary
                    </p>
                    <p className="text-sm text-slate-600">
                      {result.data.summary}
                    </p>
                  </div>
                </div>
              </>
            )}

            {!result.success && result.error && (
              <p className="mt-3 text-sm text-red-600">{result.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
