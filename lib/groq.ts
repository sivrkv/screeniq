import OpenAI from 'openai';
import { stripMarkdownFences } from './json';
import { analysisResultSchema } from './validation';
import type { AnalysisResult } from './types';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  return new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
  });
}

const SYSTEM_PROMPT = `You are an expert HR recruiter. Analyze how well a candidate's resume matches a job description.

Return ONLY valid JSON with this exact structure:
{
  "candidateName": "string - extract from resume or use Unknown Candidate",
  "matchScore": number from 0 to 100,
  "matchedSkills": ["array of skills that match the job"],
  "missingMustHaveSkills": ["array of required skills missing from resume"],
  "summary": "brief 2-3 sentence summary of fit"
}`;

export async function analyzeResume(
  jobDescription: string,
  resumeText: string,
): Promise<AnalysisResult> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from analysis service');
  }

  const cleaned = stripMarkdownFences(content);
  const parsed: unknown = JSON.parse(cleaned);
  return analysisResultSchema.parse(parsed);
}
