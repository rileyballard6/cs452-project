export type ApplicationSource = 'linkedin' | 'indeed' | 'greenhouse' | 'manual';

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export type AiVerdict = 'strong fit' | 'moderate fit' | 'long shot';

export interface Application {
  id: string;
  userId: string;
  companyName: string | null;
  roleTitle: string | null;
  jobDescription: string | null;
  jobUrl: string | null;
  source: ApplicationSource | null;
  status: ApplicationStatus;
  dateApplied: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  notes: string | null;
  location: string | null;
  remote: boolean;
  archived: boolean;
  hasAnalysis: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiAnalysis {
  id: string;
  applicationId: string;
  fitScore: number | null;
  verdict: AiVerdict | null;
  missingKeywords: string[] | null;
  strengths: string[] | null;
  suggestions: string | null;
  coverLetter: string | null;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  applicationId: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus | null;
  changedAt: string;
}

export interface ApplicationFunnel {
  userId: string;
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  rejections: number;
  interviewRatePct: number | null;
  avgFitScore: number | null;
}
