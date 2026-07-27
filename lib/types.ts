export interface AnalysisResult {
  candidateName: string;
  matchScore: number;
  matchedSkills: string[];
  missingMustHaveSkills: string[];
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
