/**
 * Individual job card component.
 */

import React from 'react';
import type { Job } from '../../shared/types';
import { StatusBadge } from './StatusBadge';
import { ScoreIndicator } from './ScoreIndicator';
import {
  MapPinIcon,
  CalendarIcon,
  DollarIcon,
  GraduationCapIcon,
  ExternalLinkIcon,
  DownloadIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshIcon,
} from './Icons';

interface JobCardProps {
  job: Job;
  onApply: (id: string) => void;
  onReject: (id: string) => void;
  onProcess: (id: string) => void;
  isProcessing: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onApply,
  onReject,
  onProcess,
  isProcessing,
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };
  
  const hasPdf = !!job.pdfPath;
  const canApply = job.status === 'ready';
  const canProcess = job.status === 'discovered';
  const canReject = ['discovered', 'ready'].includes(job.status);
  
  return (
    <article className="job-card">
      <div className="job-card-header">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <p className="job-employer">{job.employer}</p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreIndicator score={job.suitabilityScore} />
          <StatusBadge status={job.status} />
        </div>
      </div>
      
      <div className="job-meta">
        {job.location && (
          <span className="job-meta-item">
            <MapPinIcon />
            {job.location}
          </span>
        )}
        {job.deadline && (
          <span className="job-meta-item">
            <CalendarIcon />
            {job.deadline}
          </span>
        )}
        {job.salary && (
          <span className="job-meta-item">
            <DollarIcon />
            {job.salary}
          </span>
        )}
        {job.degreeRequired && (
          <span className="job-meta-item">
            <GraduationCapIcon />
            {job.degreeRequired}
          </span>
        )}
      </div>
      
      {job.suitabilityReason && (
        <p style={{ 
          marginTop: 'var(--space-3)', 
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic',
        }}>
          "{job.suitabilityReason}"
        </p>
      )}
      
      <div className="job-actions">
        {/* View job posting */}
        <a
          href={job.applicationLink || job.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          <ExternalLinkIcon size={16} />
          View Job
        </a>
        
        {/* Download PDF */}
        {hasPdf && (
          <a
            href={`/pdfs/resume_${job.id}.pdf`}
            download
            className="btn btn-ghost"
          >
            <DownloadIcon size={16} />
            Download PDF
          </a>
        )}
        
        {/* Process job */}
        {canProcess && (
          <button
            className="btn btn-ghost"
            onClick={() => onProcess(job.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="spinner" />
                Processing...
              </>
            ) : (
              <>
                <RefreshIcon size={16} />
                Generate Resume
              </>
            )}
          </button>
        )}
        
        {/* Reject */}
        {canReject && (
          <button
            className="btn btn-danger"
            onClick={() => onReject(job.id)}
          >
            <XCircleIcon size={16} />
            Skip
          </button>
        )}
        
        {/* Mark as applied */}
        {canApply && (
          <button
            className="btn btn-success"
            onClick={() => onApply(job.id)}
          >
            <CheckCircleIcon size={16} />
            Mark Applied
          </button>
        )}
      </div>
    </article>
  );
};
