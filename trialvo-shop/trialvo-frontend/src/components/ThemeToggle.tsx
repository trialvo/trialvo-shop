import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

/**
 * Cycles system → light → dark so device preference remains reachable.
 */
const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const label =
    theme === 'system'
      ? 'Using device theme'
      : theme === 'dark'
        ? 'Dark theme'
        : 'Light theme';

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative h-9 w-9"
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ThemeToggle;
