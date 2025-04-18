import React from 'react';

interface ProgressBarProps {
  progress: number; // Percentage (0-100)
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const safeProgress = Math.min(100, Math.max(0, progress)); // Ensure progress is between 0 and 100

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-linear"
        style={{ width: `${safeProgress}%` }} 
      />
    </div>
  );
};

export default ProgressBar; 