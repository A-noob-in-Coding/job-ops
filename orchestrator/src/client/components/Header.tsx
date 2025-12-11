/**
 * Header component with logo and pipeline trigger.
 */

import React from 'react';
import { RocketIcon, PlayIcon, RefreshIcon } from './Icons';

interface HeaderProps {
  onRunPipeline: () => void;
  onRefresh: () => void;
  isPipelineRunning: boolean;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRunPipeline,
  onRefresh,
  isPipelineRunning,
  isLoading,
}) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <RocketIcon size={20} />
            </div>
            <span className="logo-text">Job Ops</span>
          </div>
          
          <div className="flex gap-3">
            <button
              className="btn btn-ghost"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshIcon size={16} />
              Refresh
            </button>
            
            <button
              className="btn btn-primary"
              onClick={onRunPipeline}
              disabled={isPipelineRunning}
            >
              {isPipelineRunning ? (
                <>
                  <div className="spinner" />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon size={16} />
                  Run Pipeline
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
