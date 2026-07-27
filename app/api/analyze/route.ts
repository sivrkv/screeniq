import { NextRequest, NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/groq';
import { extractTextFromPdf } from '@/lib/pdf';
import { checkRateLimit } from '@/lib/rateLimiter';
import type { CandidateResult } from '@/lib/types';
import {
  jobDescriptionSchema,
  MAX_FILES,
  MAX_FILE_SIZE,
  PDF_MIME,
} from '@/lib/validation';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: rateLimit.retryAfter
            ? { 'Retry-After': String(rateLimit.retryAfter) }
            : {},
        },
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const jobDescription = formData.get('jobDescription');

    if (typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 },
      );
    }

    const jdValidation = jobDescriptionSchema.safeParse(jobDescription);
    if (!jdValidation.success) {
      return NextResponse.json(
        { error: jdValidation.error.errors[0]?.message ?? 'Invalid job description' },
        { status: 400 },
      );
    }

    const files = formData
      .getAll('files')
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one PDF file is required' },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} PDF files allowed` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.type !== PDF_MIME) {
        return NextResponse.json(
          { error: 'Only PDF files are allowed' },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 3MB size limit` },
          { status: 400 },
        );
      }
    }

    const results: CandidateResult[] = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let resumeText: string;
        try {
          resumeText = await extractTextFromPdf(buffer);
        } catch {
          results.push({
            fileName: file.name,
            success: false,
            error: 'Failed to parse PDF',
          });
          continue;
        }

        if (!resumeText.trim()) {
          results.push({
            fileName: file.name,
            success: false,
            error: 'No text content found in PDF',
          });
          continue;
        }

        try {
          const data = await analyzeResume(jdValidation.data, resumeText);
          results.push({
            fileName: file.name,
            success: true,
            data,
          });
        } catch {
          results.push({
            fileName: file.name,
            success: false,
            error: 'Failed to analyze resume',
          });
        }
      } catch {
        results.push({
          fileName: file.name,
          success: false,
          error: 'Unexpected error processing file',
        });
      }
    }

    results.sort((a, b) => {
      if (a.success && b.success) {
        return (b.data?.matchScore ?? 0) - (a.data?.matchScore ?? 0);
      }
      if (a.success) return -1;
      if (b.success) return 1;
      return 0;
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
