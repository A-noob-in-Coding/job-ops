/**
 * Service for generating tailored resume summaries.
 * Wraps the existing Python generate_summary.py script.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESUME_GEN_DIR = join(__dirname, '../../../../resume-generator');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface SummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * Generate a tailored resume summary for a job.
 * Uses the native implementation instead of calling Python.
 */
export async function generateSummary(
  jobDescription: string,
  profile: Record<string, unknown>
): Promise<SummaryResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ OPENROUTER_API_KEY not set, cannot generate summary');
    return { success: false, error: 'API key not configured' };
  }
  
  const model = process.env.MODEL || 'openai/gpt-4o-mini';
  
  const prompt = buildSummaryPrompt(profile, jobDescription);
  
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'JobOpsOrchestrator',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }
    
    const data = await response.json();
    const summary = data.choices[0]?.message?.content;
    
    if (!summary) {
      throw new Error('No content in response');
    }
    
    return { success: true, summary: summary.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function buildSummaryPrompt(profile: Record<string, unknown>, jd: string): string {
  return `
You are generating a tailored résumé summary for me.

Requirements:
- Use keywords found in the job description.
- Keep it concise but meaningful. Avoid fluff. Avoid long-winded text.
- Include just enough detail to feel real and grounded.
- Gently convey that I care about helping people and doing good work.
- Do NOT invent experience or skills I don't have.
- Maintain a warm, confident, human tone.
- Target THIS specific job directly, so use ATS keywords, while remaining natural.
- Use the profile to add context and details.

My profile (JSON fields merged):
${JSON.stringify(profile, null, 2)}

Job description:
${jd}

Write the résumé summary now.
`;
}

/**
 * Alternative: Call the Python script directly.
 * Useful if the Python script has additional functionality.
 */
export async function generateSummaryViaPython(
  jobDescription: string
): Promise<SummaryResult> {
  const tempFile = join(RESUME_GEN_DIR, `temp_jd_${randomUUID()}.txt`);
  
  try {
    // Write JD to temp file
    await writeFile(tempFile, jobDescription);
    
    // Call Python script
    const result = await new Promise<string>((resolve, reject) => {
      let output = '';
      let error = '';
      
      const child = spawn('python3', ['generate_summary.py', '--file', tempFile], {
        cwd: RESUME_GEN_DIR,
        env: { ...process.env },
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Process exited with code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
    
    return { success: true, summary: result.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  } finally {
    // Cleanup temp file
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}
