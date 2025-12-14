/**
 * Shared types for the job-ops orchestrator.
 */

export type JobStatus = 
  | 'discovered'      // Crawled but not processed
  | 'processing'      // Currently generating resume
  | 'ready'           // PDF generated, waiting for user to apply
  | 'applied'         // User marked as applied (added to Notion)
  | 'rejected'        // User rejected this job
  | 'expired';        // Deadline passed

export type JobSource =
  | 'gradcracker';

export interface Job {
  id: string;
  
  // From crawler
  source: JobSource;
  title: string;
  employer: string;
  employerUrl: string | null;
  jobUrl: string;           // Gradcracker listing URL
  applicationLink: string | null;  // Actual application URL
  disciplines: string | null;
  deadline: string | null;
  salary: string | null;
  location: string | null;
  degreeRequired: string | null;
  starting: string | null;
  jobDescription: string | null;
  
  // Orchestrator enrichments
  status: JobStatus;
  suitabilityScore: number | null;   // 0-100 AI-generated score
  suitabilityReason: string | null;  // AI explanation
  tailoredSummary: string | null;    // Generated resume summary
  pdfPath: string | null;            // Path to generated PDF
  notionPageId: string | null;       // Notion page ID if synced
  
  // Timestamps
  discoveredAt: string;
  processedAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  source: JobSource;
  title: string;
  employer: string;
  employerUrl?: string;
  jobUrl: string;
  applicationLink?: string;
  disciplines?: string;
  deadline?: string;
  salary?: string;
  location?: string;
  degreeRequired?: string;
  starting?: string;
  jobDescription?: string;
}

export interface UpdateJobInput {
  status?: JobStatus;
  suitabilityScore?: number;
  suitabilityReason?: string;
  tailoredSummary?: string;
  pdfPath?: string;
  notionPageId?: string;
  appliedAt?: string;
}

export interface PipelineConfig {
  topN: number;                      // Number of top jobs to process
  minSuitabilityScore: number;       // Minimum score to auto-process
  sources: string[];                 // Job sources to crawl
  profilePath: string;               // Path to profile JSON
  outputDir: string;                 // Directory for generated PDFs
}

export interface PipelineRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  jobsDiscovered: number;
  jobsProcessed: number;
  errorMessage: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JobsListResponse {
  jobs: Job[];
  total: number;
  byStatus: Record<JobStatus, number>;
}

export interface PipelineStatusResponse {
  isRunning: boolean;
  lastRun: PipelineRun | null;
  nextScheduledRun: string | null;
}
