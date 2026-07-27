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

Carefully read the ENTIRE job description, not just a "Required Qualifications" section if one exists. Identify the experience requirement (e.g. "4+ years") wherever it appears in the text, including introductory paragraphs.

Return ONLY valid JSON with this exact structure:
{
  "candidateName": "string - extract from resume or use Unknown Candidate",
  "matchScore": number from 0 to 100,
  "recommendation": "one of: Strongly Recommend, Recommend, Consider, Not Recommended",
  "matchedSkills": ["array of skills that match the job"],
  "missingMustHaveSkills": ["array of required skills missing from resume, excluding experience duration"],
  "experienceRequired": "string - experience requirement from the JD, e.g. '4+ years'. Use 'Not specified' if none stated.",
  "experienceFound": "string - years of relevant experience found in the resume, e.g. '3 years'. Use 'Unclear from resume' if not determinable.",
  "experienceMet": boolean,
  "relevantExperience": "string - 1-2 sentence summary of the candidate's relevant work history",
  "education": "string - highest/most relevant qualification found, or 'Not specified' if none found",
  "strengths": ["array of 2-4 short bullet points on why this candidate fits well"],
  "concerns": ["array of 0-3 short bullet points on potential risks or gaps"],
  "summary": "brief 2-3 sentence recruiter-friendly overall summary"
}

If experienceRequired is "Not specified", set experienceMet to true.
Keep strengths and concerns as short phrases, not full sentences.`;

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