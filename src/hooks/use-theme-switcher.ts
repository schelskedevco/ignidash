/** Light/dark theme toggle button state. */
import { useTheme } from 'next-themes';
import { SunMediumIcon, MoonIcon } from 'lucide-react';

import { useMounted } from '@/hooks/use-mounted';

export function useThemeSwitcher({ shortenLabel }: { shortenLabel: boolean } = { shortenLabel: false }) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return null;

  if (resolvedTheme === 'dark') {
    return { newTheme: 'light', label: shortenLabel ? 'Light mode' : 'Switch to light mode', icon: SunMediumIcon, setTheme };
  } else {
    return { newTheme: 'dark', label: shortenLabel ? 'Dark mode' : 'Switch to dark mode', icon: MoonIcon, setTheme };
  }
}
