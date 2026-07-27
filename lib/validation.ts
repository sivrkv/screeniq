import { z } from 'zod';

export const jobDescriptionSchema = z
  .string()
  .min(50, 'Job description must be at least 50 characters');

export const recommendationSchema = z.enum([
  'Strongly Recommend',
  'Recommend',
  'Consider',
  'Not Recommended',
]);

export const analysisResultSchema = z.object({
  candidateName: z.string(),
  matchScore: z.number().min(0).max(100),
  recommendation: recommendationSchema,
  matchedSkills: z.array(z.string()),
  missingMustHaveSkills: z.array(z.string()),
  experienceRequired: z.string(),
  experienceFound: z.string(),
  experienceMet: z.boolean(),
  relevantExperience: z.string(),
  education: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  summary: z.string(),
});

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 3 * 1024 * 1024;
export const PDF_MIME = 'application/pdf';