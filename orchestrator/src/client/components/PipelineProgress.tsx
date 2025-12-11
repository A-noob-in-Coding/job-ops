/**
 * Live pipeline progress display component.
 */

import React, { useEffect, useState } from 'react';

interface PipelineProgress {
  step: 'idle' | 'crawling' | 'importing' | 'scoring' | 'processing' | 'completed' | 'failed';
  message: string;
  detail?: string;
  jobsDiscovered: number;
  jobsScored: number;
  jobsProcessed: number;
  totalToProcess: number;
  currentJob?: {
    id: string;
    title: string;
    employer: string;
  };
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface PipelineProgressProps {
  isRunning: boolean;
}

const stepLabels: Record<PipelineProgress['step'], string> = {
  idle: 'Ready',
  crawling: 'Crawling Jobs',
  importing: 'Importing',
  scoring: 'Scoring Jobs',
  processing: 'Generating Resumes',
  completed: 'Complete',
  failed: 'Failed',
};

const stepColors: Record<PipelineProgress['step'], string> = {
  idle: 'var(--color-muted)',
  crawling: 'var(--color-info)',
  importing: 'var(--color-info)',
  scoring: 'var(--color-warning)',
  processing: 'var(--color-primary-500)',
  completed: 'var(--color-success)',
  failed: 'var(--color-error)',
};

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ isRunning }) => {
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      setProgress(null);
      return;
    }

    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/pipeline/progress');
    
    eventSource.onopen = () => {
      setIsConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data);
      } catch {
        // Ignore parse errors
      }
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
    };
    
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [isRunning]);

  if (!isRunning && !progress) {
    return null;
  }

  const step = progress?.step || 'idle';
  const isActive = progress && step !== 'idle' && step !== 'completed' && step !== 'failed';

  // Calculate overall progress percentage
  let percentage = 0;
  if (progress) {
    switch (step) {
      case 'crawling':
        percentage = 10;
        break;
      case 'importing':
        percentage = 20;
        break;
      case 'scoring':
        if (progress.jobsScored > 0) {
          percentage = 20 + (progress.jobsScored / Math.max(progress.jobsDiscovered, 1)) * 30;
        } else {
          percentage = 25;
        }
        break;
      case 'processing':
        if (progress.totalToProcess > 0) {
          percentage = 50 + (progress.jobsProcessed / progress.totalToProcess) * 50;
        } else {
          percentage = 55;
        }
        break;
      case 'completed':
        percentage = 100;
        break;
      case 'failed':
        percentage = 100;
        break;
    }
  }

  return (
    <div className="pipeline-progress" style={{
      background: 'var(--glass-background)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      marginBottom: 'var(--space-6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {isActive && (
            <div className="spinner" style={{ width: '16px', height: '16px' }} />
          )}
          <span style={{ 
            color: stepColors[step], 
            fontWeight: '600',
            fontSize: 'var(--font-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {stepLabels[step]}
          </span>
        </div>
        <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-xs)' }}>
          {Math.round(percentage)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div style={{
        height: '6px',
        background: 'var(--color-surface-elevated)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: step === 'failed' 
            ? 'var(--color-error)' 
            : 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400))',
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      
      {/* Message */}
      {progress && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <p style={{ color: 'var(--color-text)', margin: 0 }}>
            {progress.message}
          </p>
          {progress.detail && (
            <p style={{ 
              color: 'var(--color-muted)', 
              fontSize: 'var(--font-sm)',
              margin: 'var(--space-1) 0 0 0',
            }}>
              {progress.detail}
            </p>
          )}
        </div>
      )}
      
      {/* Stats */}
      {progress && (step === 'scoring' || step === 'processing' || step === 'completed') && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-6)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--glass-border)',
          fontSize: 'var(--font-sm)',
        }}>
          <div>
            <span style={{ color: 'var(--color-muted)' }}>Discovered: </span>
            <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>
              {progress.jobsDiscovered}
            </span>
          </div>
          {progress.jobsScored > 0 && (
            <div>
              <span style={{ color: 'var(--color-muted)' }}>Scored: </span>
              <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>
                {progress.jobsScored}
              </span>
            </div>
          )}
          {progress.totalToProcess > 0 && (
            <div>
              <span style={{ color: 'var(--color-muted)' }}>Processed: </span>
              <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>
                {progress.jobsProcessed}/{progress.totalToProcess}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Error state */}
      {step === 'failed' && progress?.error && (
        <div style={{
          marginTop: 'var(--space-3)',
          padding: 'var(--space-3)',
          background: 'rgba(var(--color-error-rgb), 0.1)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-error)',
          fontSize: 'var(--font-sm)',
        }}>
          {progress.error}
        </div>
      )}
    </div>
  );
};
