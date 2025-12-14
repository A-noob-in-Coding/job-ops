/**
 * Database schema using Drizzle ORM with SQLite.
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  
  // From crawler
  source: text('source', { enum: ['gradcracker'] }).notNull().default('gradcracker'),
  title: text('title').notNull(),
  employer: text('employer').notNull(),
  employerUrl: text('employer_url'),
  jobUrl: text('job_url').notNull().unique(),
  applicationLink: text('application_link'),
  disciplines: text('disciplines'),
  deadline: text('deadline'),
  salary: text('salary'),
  location: text('location'),
  degreeRequired: text('degree_required'),
  starting: text('starting'),
  jobDescription: text('job_description'),
  
  // Orchestrator enrichments
  status: text('status', { 
    enum: ['discovered', 'processing', 'ready', 'applied', 'rejected', 'expired'] 
  }).notNull().default('discovered'),
  suitabilityScore: real('suitability_score'),
  suitabilityReason: text('suitability_reason'),
  tailoredSummary: text('tailored_summary'),
  pdfPath: text('pdf_path'),
  notionPageId: text('notion_page_id'),
  
  // Timestamps
  discoveredAt: text('discovered_at').notNull().default(sql`(datetime('now'))`),
  processedAt: text('processed_at'),
  appliedAt: text('applied_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: text('id').primaryKey(),
  startedAt: text('started_at').notNull().default(sql`(datetime('now'))`),
  completedAt: text('completed_at'),
  status: text('status', {
    enum: ['running', 'completed', 'failed']
  }).notNull().default('running'),
  jobsDiscovered: integer('jobs_discovered').notNull().default(0),
  jobsProcessed: integer('jobs_processed').notNull().default(0),
  errorMessage: text('error_message'),
});

export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
export type PipelineRunRow = typeof pipelineRuns.$inferSelect;
export type NewPipelineRunRow = typeof pipelineRuns.$inferInsert;
