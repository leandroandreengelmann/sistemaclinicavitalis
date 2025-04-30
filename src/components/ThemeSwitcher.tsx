'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Garante que o componente só seja renderizado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const renderIcon = () => {
    if (theme === 'light') {
      return <SunIcon className="w-5 h-5 text-yellow-500" />;
    }
    if (theme === 'dark') {
      return <MoonIcon className="w-5 h-5 text-blue-400" />;
    }
    return <ComputerDesktopIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
  };

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Mudar tema"
    >
      {renderIcon()}
    </button>
  );
}; 