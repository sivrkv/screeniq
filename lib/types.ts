export type Recommendation =
  | 'Strongly Recommend'
  | 'Recommend'
  | 'Consider'
  | 'Not Recommended';

export interface AnalysisResult {
  candidateName: string;
  matchScore: number;
  recommendation: Recommendation;
  matchedSkills: string[];
  missingMustHaveSkills: string[];
  experienceRequired: string;
  experienceFound: string;
  experienceMet: boolean;
  relevantExperience: string;
  education: string;
  strengths: string[];
  concerns: string[];
  summary: string;
}

export interface CandidateResult {
  fileName: string;
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface AnalyzeResponse {
  results: CandidateResult[];
}