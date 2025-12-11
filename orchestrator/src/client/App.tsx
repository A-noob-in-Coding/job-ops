/**
 * Main App component.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Job, JobStatus } from '../shared/types';
import { Header, Stats, JobList, ToastContainer, Toast } from './components';
import * as api from './api';

export const App: React.FC = () => {
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Record<JobStatus, number>>({
    discovered: 0,
    processing: 0,
    ready: 0,
    applied: 0,
    rejected: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Toast helpers
  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getJobs();
      setJobs(data.jobs);
      setStats(data.byStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load jobs';
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);
  
  // Check pipeline status
  const checkPipelineStatus = useCallback(async () => {
    try {
      const status = await api.getPipelineStatus();
      setIsPipelineRunning(status.isRunning);
    } catch {
      // Ignore errors
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    loadJobs();
    checkPipelineStatus();
    
    // Poll for updates
    const interval = setInterval(() => {
      loadJobs();
      checkPipelineStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadJobs, checkPipelineStatus]);
  
  // Run pipeline
  const handleRunPipeline = async () => {
    try {
      setIsPipelineRunning(true);
      await api.runPipeline();
      addToast('Pipeline started! This may take a few minutes.', 'info');
      
      // Poll more frequently while running
      const pollInterval = setInterval(async () => {
        const status = await api.getPipelineStatus();
        if (!status.isRunning) {
          clearInterval(pollInterval);
          setIsPipelineRunning(false);
          loadJobs();
          addToast('Pipeline completed!', 'success');
        }
      }, 5000);
    } catch (error) {
      setIsPipelineRunning(false);
      const message = error instanceof Error ? error.message : 'Failed to start pipeline';
      addToast(message, 'error');
    }
  };
  
  // Process single job
  const handleProcess = async (jobId: string) => {
    try {
      setProcessingJobId(jobId);
      await api.processJob(jobId);
      addToast('Resume generated successfully!', 'success');
      loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process job';
      addToast(message, 'error');
    } finally {
      setProcessingJobId(null);
    }
  };
  
  // Mark as applied
  const handleApply = async (jobId: string) => {
    try {
      await api.markAsApplied(jobId);
      addToast('Marked as applied! ✅', 'success');
      loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark as applied';
      addToast(message, 'error');
    }
  };
  
  // Reject job
  const handleReject = async (jobId: string) => {
    try {
      await api.rejectJob(jobId);
      addToast('Job skipped', 'info');
      loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject job';
      addToast(message, 'error');
    }
  };
  
  return (
    <>
      <Header
        onRunPipeline={handleRunPipeline}
        onRefresh={loadJobs}
        isPipelineRunning={isPipelineRunning}
        isLoading={isLoading}
      />
      
      <main className="container" style={{ paddingBottom: 'var(--space-12)' }}>
        <Stats stats={stats} />
        
        <JobList
          jobs={jobs}
          onApply={handleApply}
          onReject={handleReject}
          onProcess={handleProcess}
          processingJobId={processingJobId}
        />
      </main>
      
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};
