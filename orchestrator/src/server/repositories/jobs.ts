/**
 * Job repository - data access layer for jobs.
 */

import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db, schema } from '../db/index.js';
import type { Job, CreateJobInput, UpdateJobInput, JobStatus } from '../../shared/types.js';

const { jobs } = schema;

/**
 * Get all jobs, optionally filtered by status.
 */
export async function getAllJobs(statuses?: JobStatus[]): Promise<Job[]> {
  const query = statuses && statuses.length > 0
    ? db.select().from(jobs).where(inArray(jobs.status, statuses)).orderBy(desc(jobs.discoveredAt))
    : db.select().from(jobs).orderBy(desc(jobs.discoveredAt));
  
  const rows = await query;
  return rows.map(mapRowToJob);
}

/**
 * Get a single job by ID.
 */
export async function getJobById(id: string): Promise<Job | null> {
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id));
  return row ? mapRowToJob(row) : null;
}

/**
 * Get a job by its URL (for deduplication).
 */
export async function getJobByUrl(jobUrl: string): Promise<Job | null> {
  const [row] = await db.select().from(jobs).where(eq(jobs.jobUrl, jobUrl));
  return row ? mapRowToJob(row) : null;
}

/**
 * Create a new job (or return existing if URL matches).
 */
export async function createJob(input: CreateJobInput): Promise<Job> {
  // Check for existing job with same URL
  const existing = await getJobByUrl(input.jobUrl);
  if (existing) {
    return existing;
  }
  
  const id = randomUUID();
  const now = new Date().toISOString();
  
  await db.insert(jobs).values({
    id,
    title: input.title,
    employer: input.employer,
    employerUrl: input.employerUrl ?? null,
    jobUrl: input.jobUrl,
    applicationLink: input.applicationLink ?? null,
    disciplines: input.disciplines ?? null,
    deadline: input.deadline ?? null,
    salary: input.salary ?? null,
    location: input.location ?? null,
    degreeRequired: input.degreeRequired ?? null,
    starting: input.starting ?? null,
    jobDescription: input.jobDescription ?? null,
    status: 'discovered',
    discoveredAt: now,
    createdAt: now,
    updatedAt: now,
  });
  
  return (await getJobById(id))!;
}

/**
 * Update a job.
 */
export async function updateJob(id: string, input: UpdateJobInput): Promise<Job | null> {
  const now = new Date().toISOString();
  
  await db.update(jobs)
    .set({
      ...input,
      updatedAt: now,
      ...(input.status === 'processing' ? { processedAt: now } : {}),
      ...(input.status === 'applied' && !input.appliedAt ? { appliedAt: now } : {}),
    })
    .where(eq(jobs.id, id));
  
  return getJobById(id);
}

/**
 * Bulk create jobs from crawler results.
 */
export async function bulkCreateJobs(inputs: CreateJobInput[]): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  
  for (const input of inputs) {
    const existing = await getJobByUrl(input.jobUrl);
    if (existing) {
      skipped++;
      continue;
    }
    
    await createJob(input);
    created++;
  }
  
  return { created, skipped };
}

/**
 * Get job statistics by status.
 */
export async function getJobStats(): Promise<Record<JobStatus, number>> {
  const result = await db
    .select({
      status: jobs.status,
      count: sql<number>`count(*)`,
    })
    .from(jobs)
    .groupBy(jobs.status);
  
  const stats: Record<JobStatus, number> = {
    discovered: 0,
    processing: 0,
    ready: 0,
    applied: 0,
    rejected: 0,
    expired: 0,
  };
  
  for (const row of result) {
    stats[row.status as JobStatus] = row.count;
  }
  
  return stats;
}

/**
 * Get jobs ready for processing (discovered with description).
 */
export async function getJobsForProcessing(limit: number = 10): Promise<Job[]> {
  const rows = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.status, 'discovered'),
        sql`${jobs.jobDescription} IS NOT NULL`
      )
    )
    .orderBy(desc(jobs.discoveredAt))
    .limit(limit);
  
  return rows.map(mapRowToJob);
}

// Helper to map database row to Job type
function mapRowToJob(row: typeof jobs.$inferSelect): Job {
  return {
    id: row.id,
    title: row.title,
    employer: row.employer,
    employerUrl: row.employerUrl,
    jobUrl: row.jobUrl,
    applicationLink: row.applicationLink,
    disciplines: row.disciplines,
    deadline: row.deadline,
    salary: row.salary,
    location: row.location,
    degreeRequired: row.degreeRequired,
    starting: row.starting,
    jobDescription: row.jobDescription,
    status: row.status as JobStatus,
    suitabilityScore: row.suitabilityScore,
    suitabilityReason: row.suitabilityReason,
    tailoredSummary: row.tailoredSummary,
    pdfPath: row.pdfPath,
    notionPageId: row.notionPageId,
    discoveredAt: row.discoveredAt,
    processedAt: row.processedAt,
    appliedAt: row.appliedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
