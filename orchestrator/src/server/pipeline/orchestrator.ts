/**
 * Main pipeline logic - orchestrates the daily job processing flow.
 * 
 * Flow:
 * 1. Run crawler to discover new jobs
 * 2. Score jobs for suitability
 * 3. Pick top N jobs
 * 4. Generate tailored summaries
 * 5. Generate PDF resumes
 * 6. Mark as "ready" for user review
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runCrawler } from '../services/crawler.js';
import { scoreAndRankJobs } from '../services/scorer.js';
import { generateSummary } from '../services/summary.js';
import { generatePdf } from '../services/pdf.js';
import * as jobsRepo from '../repositories/jobs.js';
import * as pipelineRepo from '../repositories/pipeline.js';
import type { Job, PipelineConfig } from '../../shared/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROFILE_PATH = join(__dirname, '../../../../resume-generator/base.json');

const DEFAULT_CONFIG: PipelineConfig = {
  topN: 10,
  minSuitabilityScore: 50,
  sources: ['gradcracker'],
  profilePath: DEFAULT_PROFILE_PATH,
  outputDir: join(__dirname, '../../../data/pdfs'),
};

// Track if pipeline is currently running
let isPipelineRunning = false;

/**
 * Run the full job discovery and processing pipeline.
 */
export async function runPipeline(config: Partial<PipelineConfig> = {}): Promise<{
  success: boolean;
  jobsDiscovered: number;
  jobsProcessed: number;
  error?: string;
}> {
  if (isPipelineRunning) {
    return {
      success: false,
      jobsDiscovered: 0,
      jobsProcessed: 0,
      error: 'Pipeline is already running',
    };
  }
  
  isPipelineRunning = true;
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create pipeline run record
  const pipelineRun = await pipelineRepo.createPipelineRun();
  
  console.log('🚀 Starting job pipeline...');
  console.log(`   Config: topN=${mergedConfig.topN}, minScore=${mergedConfig.minSuitabilityScore}`);
  
  try {
    // Step 1: Load profile
    console.log('\n📋 Loading profile...');
    const profile = await loadProfile(mergedConfig.profilePath);
    
    // Step 2: Run crawler
    console.log('\n🕷️ Running crawler...');
    const crawlerResult = await runCrawler();
    
    if (!crawlerResult.success) {
      throw new Error(`Crawler failed: ${crawlerResult.error}`);
    }
    
    // Step 3: Import discovered jobs
    console.log('\n💾 Importing jobs to database...');
    const { created, skipped } = await jobsRepo.bulkCreateJobs(crawlerResult.jobs);
    console.log(`   Created: ${created}, Skipped (duplicates): ${skipped}`);
    
    await pipelineRepo.updatePipelineRun(pipelineRun.id, {
      jobsDiscovered: created,
    });
    
    // Step 4: Get unprocessed jobs and score them
    console.log('\n🎯 Scoring jobs for suitability...');
    const unprocessedJobs = await jobsRepo.getJobsForProcessing(50); // Get more than topN for ranking
    const rankedJobs = await scoreAndRankJobs(unprocessedJobs, profile);
    
    // Update scores in database
    for (const job of rankedJobs) {
      await jobsRepo.updateJob(job.id, {
        suitabilityScore: job.suitabilityScore,
        suitabilityReason: job.suitabilityReason,
      });
    }
    
    // Step 5: Pick top N jobs above threshold
    const topJobs = rankedJobs
      .filter(j => j.suitabilityScore >= mergedConfig.minSuitabilityScore)
      .slice(0, mergedConfig.topN);
    
    console.log(`\n📊 Selected ${topJobs.length} top jobs for processing:`);
    for (const job of topJobs) {
      console.log(`   - ${job.title} @ ${job.employer} (score: ${job.suitabilityScore})`);
    }
    
    // Step 6: Process each top job
    let processed = 0;
    
    for (const job of topJobs) {
      console.log(`\n📝 Processing: ${job.title} @ ${job.employer}`);
      
      try {
        // Mark as processing
        await jobsRepo.updateJob(job.id, { status: 'processing' });
        
        // Generate tailored summary
        console.log('   Generating summary...');
        const summaryResult = await generateSummary(
          job.jobDescription || '',
          profile
        );
        
        if (!summaryResult.success) {
          console.warn(`   ⚠️ Summary generation failed: ${summaryResult.error}`);
          continue;
        }
        
        // Update job with summary
        await jobsRepo.updateJob(job.id, {
          tailoredSummary: summaryResult.summary,
        });
        
        // Generate PDF
        console.log('   Generating PDF...');
        const pdfResult = await generatePdf(
          job.id,
          summaryResult.summary!,
          mergedConfig.profilePath
        );
        
        if (!pdfResult.success) {
          console.warn(`   ⚠️ PDF generation failed: ${pdfResult.error}`);
          // Still mark as ready even if PDF failed - user can regenerate
        }
        
        // Mark as ready
        await jobsRepo.updateJob(job.id, {
          status: 'ready',
          pdfPath: pdfResult.pdfPath ?? null,
        });
        
        processed++;
        console.log(`   ✅ Ready for review!`);
        
      } catch (error) {
        console.error(`   ❌ Failed to process job: ${error}`);
        // Continue with next job
      }
    }
    
    // Update pipeline run as completed
    await pipelineRepo.updatePipelineRun(pipelineRun.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      jobsProcessed: processed,
    });
    
    console.log('\n🎉 Pipeline completed!');
    console.log(`   Jobs discovered: ${created}`);
    console.log(`   Jobs processed: ${processed}`);
    
    isPipelineRunning = false;
    
    return {
      success: true,
      jobsDiscovered: created,
      jobsProcessed: processed,
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    await pipelineRepo.updatePipelineRun(pipelineRun.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: message,
    });
    
    isPipelineRunning = false;
    
    console.error('\n❌ Pipeline failed:', message);
    
    return {
      success: false,
      jobsDiscovered: 0,
      jobsProcessed: 0,
      error: message,
    };
  }
}

/**
 * Process a single job (for manual processing).
 */
export async function processJob(jobId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`📝 Processing job ${jobId}...`);
  
  try {
    const job = await jobsRepo.getJobById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    const profile = await loadProfile(DEFAULT_PROFILE_PATH);
    
    // Mark as processing
    await jobsRepo.updateJob(job.id, { status: 'processing' });
    
    // Generate summary if not already done
    if (!job.tailoredSummary) {
      console.log('   Generating summary...');
      const summaryResult = await generateSummary(
        job.jobDescription || '',
        profile
      );
      
      if (summaryResult.success) {
        await jobsRepo.updateJob(job.id, {
          tailoredSummary: summaryResult.summary,
        });
        job.tailoredSummary = summaryResult.summary ?? null;
      }
    }
    
    // Generate PDF
    console.log('   Generating PDF...');
    const pdfResult = await generatePdf(
      job.id,
      job.tailoredSummary || '',
      DEFAULT_PROFILE_PATH
    );
    
    // Mark as ready
    await jobsRepo.updateJob(job.id, {
      status: 'ready',
      pdfPath: pdfResult.pdfPath ?? null,
    });
    
    console.log('   ✅ Done!');
    return { success: true };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Check if pipeline is currently running.
 */
export function getPipelineStatus(): { isRunning: boolean } {
  return { isRunning: isPipelineRunning };
}

/**
 * Load the user profile from JSON file.
 */
async function loadProfile(profilePath: string): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(profilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to load profile, using empty object');
    return {};
  }
}
