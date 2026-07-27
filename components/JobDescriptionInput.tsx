'use client';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MIN_CHARS = 50;

export default function JobDescriptionInput({
  value,
  onChange,
  disabled = false,
}: JobDescriptionInputProps) {
  const charCount = value.length;
  const isValid = charCount >= MIN_CHARS;

  return (
    <div className="flex h-full flex-col">
      <label
        htmlFor="job-description"
        className="mb-2 text-sm font-semibold text-slate-700"
      >
        Job Description
      </label>
      <textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste the full job description here (minimum 50 characters)..."
        className="min-h-[280px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-soft placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-[360px]"
      />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={isValid ? 'text-emerald-600' : 'text-slate-400'}>
          {isValid
            ? 'Ready to analyze'
            : `${MIN_CHARS - charCount} more characters needed`}
        </span>
        <span className="text-slate-400">{charCount} characters</span>
      </div>
    </div>
  );
}
