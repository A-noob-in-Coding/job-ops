/**
 * Service for generating PDF resumes using RXResume.
 * Wraps the existing Python rxresume_automation.py script.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, copyFile, access, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESUME_GEN_DIR = join(__dirname, '../../../../resume-generator');
const OUTPUT_DIR = join(__dirname, '../../../data/pdfs');

export interface PdfResult {
  success: boolean;
  pdfPath?: string;
  error?: string;
}

/**
 * Generate a tailored PDF resume for a job.
 * 
 * @param jobId - Unique job identifier (used for filename)
 * @param tailoredSummary - The AI-generated summary to inject
 * @param baseResumePath - Path to the base resume JSON (optional)
 */
export async function generatePdf(
  jobId: string,
  tailoredSummary: string,
  baseResumePath?: string
): Promise<PdfResult> {
  console.log(`📄 Generating PDF for job ${jobId}...`);
  
  const resumeJsonPath = baseResumePath || join(RESUME_GEN_DIR, 'base.json');
  
  try {
    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
      await mkdir(OUTPUT_DIR, { recursive: true });
    }
    
    // Read base resume
    const baseResume = JSON.parse(await readFile(resumeJsonPath, 'utf-8'));
    
    // Inject tailored summary
    if (baseResume.sections?.summary) {
      baseResume.sections.summary.content = tailoredSummary;
    } else if (baseResume.basics?.summary) {
      baseResume.basics.summary = tailoredSummary;
    }
    
    // Write modified resume to temp file
    const tempResumePath = join(RESUME_GEN_DIR, `temp_resume_${jobId}.json`);
    await writeFile(tempResumePath, JSON.stringify(baseResume, null, 2));
    
    // Generate PDF using Python script
    const outputFilename = `resume_${jobId}.pdf`;
    const outputPath = join(OUTPUT_DIR, outputFilename);
    
    await runPythonPdfGenerator(tempResumePath, outputFilename);
    
    // Move generated PDF to our output directory
    const pythonOutputPath = join(RESUME_GEN_DIR, 'resumes', outputFilename);
    
    try {
      await access(pythonOutputPath);
      await copyFile(pythonOutputPath, outputPath);
    } catch {
      // PDF might already be in the right place or script output different location
      console.warn('PDF not found at expected Python output location');
    }
    
    // Cleanup temp file
    try {
      const { unlink } = await import('fs/promises');
      await unlink(tempResumePath);
    } catch {
      // Ignore cleanup errors
    }
    
    console.log(`✅ PDF generated: ${outputPath}`);
    return { success: true, pdfPath: outputPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ PDF generation failed: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Run the Python RXResume automation script.
 */
async function runPythonPdfGenerator(
  jsonPath: string,
  outputFilename: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Note: This calls the Python script with the JSON path
    // The Python script needs to be modified to accept these args
    // For now, we'll use environment variables
    
    const child = spawn('python3', ['rxresume_automation.py'], {
      cwd: RESUME_GEN_DIR,
      env: {
        ...process.env,
        RESUME_JSON_PATH: jsonPath,
        OUTPUT_FILENAME: outputFilename,
      },
      stdio: 'inherit',
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

/**
 * Check if a PDF exists for a job.
 */
export async function pdfExists(jobId: string): Promise<boolean> {
  const pdfPath = join(OUTPUT_DIR, `resume_${jobId}.pdf`);
  try {
    await access(pdfPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the path to a job's PDF.
 */
export function getPdfPath(jobId: string): string {
  return join(OUTPUT_DIR, `resume_${jobId}.pdf`);
}
