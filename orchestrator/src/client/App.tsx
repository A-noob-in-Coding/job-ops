/**
 * Main App component.
 */

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import type { Job, JobStatus } from "../shared/types";
import { Header, JobList, PipelineProgress, Stats } from "./components";
import * as api from "./api";

export const App: React.FC = () => {
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
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getJobs();
      setJobs(data.jobs);
      setStats(data.byStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load jobs";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPipelineStatus = useCallback(async () => {
    try {
      const status = await api.getPipelineStatus();
      setIsPipelineRunning(status.isRunning);
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    loadJobs();
    checkPipelineStatus();

    const interval = setInterval(() => {
      loadJobs();
      checkPipelineStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadJobs, checkPipelineStatus]);

  const handleRunPipeline = async () => {
    try {
      setIsPipelineRunning(true);
      await api.runPipeline();
      toast.message("Pipeline started", { description: "This may take a few minutes." });

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getPipelineStatus();
          if (!status.isRunning) {
            clearInterval(pollInterval);
            setIsPipelineRunning(false);
            await loadJobs();
            toast.success("Pipeline completed");
          }
        } catch {
          // Ignore errors
        }
      }, 5000);
    } catch (error) {
      setIsPipelineRunning(false);
      const message = error instanceof Error ? error.message : "Failed to start pipeline";
      toast.error(message);
    }
  };

  const handleProcess = async (jobId: string) => {
    try {
      setProcessingJobId(jobId);
      await api.processJob(jobId);
      toast.success("Resume generated successfully");
      await loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process job";
      toast.error(message);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      await api.markAsApplied(jobId);
      toast.success("Marked as applied");
      await loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark as applied";
      toast.error(message);
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      await api.rejectJob(jobId);
      toast.message("Job skipped");
      await loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject job";
      toast.error(message);
    }
  };

  const handleClearDatabase = async () => {
    try {
      const result = await api.clearDatabase();
      toast.success("Database cleared", { description: `Deleted ${result.jobsDeleted} jobs.` });
      await loadJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear database";
      toast.error(message);
    }
  };

  const handleProcessAll = async () => {
    try {
      setIsProcessingAll(true);
      const result = await api.processAllDiscovered();
      toast.message("Processing jobs", { description: `Processing ${result.count} jobs in background...` });

      const pollInterval = setInterval(async () => {
        try {
          const data = await api.getJobs();
          setJobs(data.jobs);
          setStats(data.byStatus);

          const stillDiscovered = data.byStatus.discovered + data.byStatus.processing;
          if (stillDiscovered === 0) {
            clearInterval(pollInterval);
            setIsProcessingAll(false);
            toast.success("All jobs processed");
          }
        } catch {
          // Ignore errors
        }
      }, 3000);
    } catch (error) {
      setIsProcessingAll(false);
      const message = error instanceof Error ? error.message : "Failed to process jobs";
      toast.error(message);
    }
  };

  return (
    <>
      <Header
        onRunPipeline={handleRunPipeline}
        onRefresh={loadJobs}
        onClearDatabase={handleClearDatabase}
        isPipelineRunning={isPipelineRunning}
        isLoading={isLoading}
      />

      <main className="container mx-auto max-w-7xl space-y-6 px-4 py-6 pb-12">
        <PipelineProgress isRunning={isPipelineRunning} />
        <Stats stats={stats} />
        <JobList
          jobs={jobs}
          onApply={handleApply}
          onReject={handleReject}
          onProcess={handleProcess}
          onProcessAll={handleProcessAll}
          processingJobId={processingJobId}
          isProcessingAll={isProcessingAll}
        />
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
};

