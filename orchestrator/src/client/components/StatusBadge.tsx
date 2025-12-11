/**
 * Status badge component.
 */

import React from 'react';
import type { JobStatus } from '../../shared/types';

interface StatusBadgeProps {
  status: JobStatus;
}

const statusLabels: Record<JobStatus, string> = {
  discovered: 'Discovered',
  processing: 'Processing',
  ready: 'Ready',
  applied: 'Applied',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'processing' && <span className="pulse">●</span>}
      {statusLabels[status]}
    </span>
  );
};
