/**
 * Stats dashboard showing job counts by status.
 */

import React from 'react';
import type { JobStatus } from '../../shared/types';

interface StatsProps {
  stats: Record<JobStatus, number>;
}

const statConfig: Array<{
  key: JobStatus;
  label: string;
  emoji: string;
}> = [
  { key: 'discovered', label: 'Discovered', emoji: '🔍' },
  { key: 'processing', label: 'Processing', emoji: '⚙️' },
  { key: 'ready', label: 'Ready', emoji: '✨' },
  { key: 'applied', label: 'Applied', emoji: '✅' },
  { key: 'rejected', label: 'Rejected', emoji: '❌' },
  { key: 'expired', label: 'Expired', emoji: '⏰' },
];

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  
  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="card-header">
        <h2>Overview</h2>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {total} total jobs
        </span>
      </div>
      
      <div className="stats-grid">
        {statConfig.map(({ key, label, emoji }) => (
          <div key={key} className="stat-card">
            <div className="stat-value">{stats[key] || 0}</div>
            <div className="stat-label">
              <span style={{ marginRight: '4px' }}>{emoji}</span>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
