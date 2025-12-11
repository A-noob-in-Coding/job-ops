/**
 * Suitability score display component.
 */

import React from 'react';

interface ScoreIndicatorProps {
  score: number | null;
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ score }) => {
  if (score === null) {
    return (
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        Not scored
      </span>
    );
  }
  
  const getScoreClass = () => {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };
  
  return (
    <div className={`score ${getScoreClass()}`}>
      <div className="score-bar">
        <div 
          className="score-bar-fill" 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span>{score}</span>
    </div>
  );
};
