"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/catalyst/button";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

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

  return (
    <Button onClick={() => setTheme(isDark ? "light" : "dark")} outline>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
