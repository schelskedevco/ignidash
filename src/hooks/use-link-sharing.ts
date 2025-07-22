import { useState, useCallback } from 'react';
import { LinkIcon, CheckIcon } from '@heroicons/react/20/solid';

export function useLinkSharing() {
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleLinkClick = useCallback(() => {
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2500);
  }, []);

  let icon;
  let label;

  if (isLinkCopied) {
    icon = CheckIcon;
    label = 'Link copied';
  } else {
    icon = LinkIcon;
    label = 'Link sharing';
  }

  return {
    icon,
    label,
    handleLinkClick,
  };
}
