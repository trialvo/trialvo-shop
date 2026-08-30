import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

/**
 * Cycles system → light → dark so device preference remains reachable.
 * The first paint always shows the system icon so SSR and hydration match;
 * the stored preference is applied after mount.
 */
const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycle = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const shown = mounted ? theme : 'system';
  const label =
    shown === 'system'
      ? 'Using device theme'
      : shown === 'dark'
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
      {shown === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : shown === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ThemeToggle;
