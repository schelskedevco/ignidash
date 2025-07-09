"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconButton } from "@/components/icon-button";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return null;
  }

  let icon;
  let label;
  let newTheme;

  if (isDark) {
    icon = SunIcon;
    label = "Switch to light mode";
    newTheme = "light";
  } else {
    icon = MoonIcon;
    label = "Switch to dark mode";
    newTheme = "dark";
  }

  return (
    <IconButton
      icon={icon}
      label={label}
      onClick={() => setTheme(newTheme)}
      surfaceColor="emphasized"
    />
  );
}
