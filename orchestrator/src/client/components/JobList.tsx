/**
 * Job list with filtering tabs.
 */

import React, { useState } from 'react';
import type { Job, JobStatus } from '../../shared/types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: Job[];
  onApply: (id: string) => void;
  onReject: (id: string) => void;
  onProcess: (id: string) => void;
  processingJobId: string | null;
}

type FilterTab = 'ready' | 'discovered' | 'applied' | 'all';

const tabs: Array<{ id: FilterTab; label: string; statuses: JobStatus[] }> = [
  { id: 'ready', label: '✨ Ready to Apply', statuses: ['ready'] },
  { id: 'discovered', label: '🔍 Discovered', statuses: ['discovered', 'processing'] },
  { id: 'applied', label: '✅ Applied', statuses: ['applied'] },
  { id: 'all', label: '📋 All Jobs', statuses: [] },
];

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onApply,
  onReject,
  onProcess,
  processingJobId,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ready');
  
  const filteredJobs = React.useMemo(() => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab || tab.statuses.length === 0) {
      return jobs;
    }
    return jobs.filter(job => tab.statuses.includes(job.status));
  }, [jobs, activeTab]);
  
  return (
    <div>
      <div className="tabs">
        {tabs.map(tab => {
          const count = tab.statuses.length === 0
            ? jobs.length
            : jobs.filter(j => tab.statuses.includes(j.status)).length;
          
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>
      
      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3 className="empty-state-title">No jobs found</h3>
          <p>
            {activeTab === 'ready' && 'Run the pipeline to discover and process new jobs.'}
            {activeTab === 'discovered' && 'All discovered jobs have been processed.'}
            {activeTab === 'applied' && "You haven't applied to any jobs yet."}
            {activeTab === 'all' && 'No jobs in the system yet. Run the pipeline to get started!'}
          </p>
        </div>
      ) : (
        <div className="job-list">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onApply={onApply}
              onReject={onReject}
              onProcess={onProcess}
              isProcessing={processingJobId === job.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
