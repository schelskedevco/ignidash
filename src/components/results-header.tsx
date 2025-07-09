"use client";

import {
  PresentationChartLineIcon,
  LinkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/icon-button";
import { useState, useCallback } from "react";

export function ResultsHeader() {
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleLinkClick = useCallback(() => {
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2500);
  }, []);

  let icon;
  let label;

  if (isLinkCopied) {
    icon = CheckIcon;
    label = "Link copied";
  } else {
    icon = LinkIcon;
    label = "Link sharing";
  }

  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-gray-900 lg:text-xl dark:text-gray-100">
        <PresentationChartLineIcon className="h-5 w-5" />
        Results
      </h3>
      <IconButton icon={icon} label={label} onClick={handleLinkClick} />
    </div>
  );
}
