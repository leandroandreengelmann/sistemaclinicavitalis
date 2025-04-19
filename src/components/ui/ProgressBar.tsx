import React from 'react';

interface ProgressBarProps {
  progress: number; // Percentage (0-100)
  color?: string; // Nova prop opcional para a cor
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color }) => {
  const safeProgress = Math.min(100, Math.max(0, progress)); // Ensure progress is between 0 and 100

  // Determinar estilo e classe com base na cor
  const barStyle = color ? { width: `${safeProgress}%`, backgroundColor: color } : { width: `${safeProgress}%` };
  const barClassName = `h-4 rounded-full transition-all duration-300 ease-linear ${!color ? 'bg-blue-600' : ''}`;

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
      <div 
        className={barClassName}
        style={barStyle} 
      />
    </div>
  );
};

export default ProgressBar; 