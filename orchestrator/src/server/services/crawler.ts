/**
 * Service for running the job crawler (job-extractor).
 * Wraps the existing Crawlee-based crawler.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import type { CreateJobInput } from '../../shared/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CRAWLER_DIR = join(__dirname, '../../../../job-extractor');
const STORAGE_DIR = join(CRAWLER_DIR, 'storage/datasets/default');

export interface CrawlerResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

/**
 * Run the job-extractor crawler and return discovered jobs.
 */
export async function runCrawler(): Promise<CrawlerResult> {
  console.log('🕷️ Starting job crawler...');
  
  try {
    // Clear previous results
    await clearStorageDataset();
    
    // Run the crawler
    await new Promise<void>((resolve, reject) => {
      const child = spawn('npm', ['run', 'start'], {
        cwd: CRAWLER_DIR,
        shell: true,
        stdio: 'inherit',
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Crawler exited with code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
    
    // Read crawled jobs from storage
    const jobs = await readCrawledJobs();
    
    console.log(`✅ Crawler completed. Found ${jobs.length} jobs.`);
    
    return { success: true, jobs };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Crawler failed:', message);
    return { success: false, jobs: [], error: message };
  }
}

/**
 * Read crawled jobs from the Crawlee storage dataset.
 */
async function readCrawledJobs(): Promise<CreateJobInput[]> {
  try {
    const files = await readdir(STORAGE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const jobs: CreateJobInput[] = [];
    
    for (const file of jsonFiles) {
      const content = await readFile(join(STORAGE_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      
      // Map crawler output to our job input format
      jobs.push({
        title: data.title || 'Unknown Title',
        employer: data.employer || 'Unknown Employer',
        employerUrl: data.employerUrl,
        jobUrl: data.url || data.jobUrl,
        applicationLink: data.applicationLink,
        disciplines: data.disciplines,
        deadline: data.deadline,
        salary: data.salary,
        location: data.location,
        degreeRequired: data.degreeRequired,
        starting: data.starting,
        jobDescription: data.jobDescription,
      });
    }
    
    return jobs;
  } catch (error) {
    console.error('Failed to read crawled jobs:', error);
    return [];
  }
}

/**
 * Clear previous crawl results.
 */
async function clearStorageDataset(): Promise<void> {
  const { rm } = await import('fs/promises');
  try {
    await rm(STORAGE_DIR, { recursive: true, force: true });
  } catch {
    // Ignore if directory doesn't exist
  }
}
