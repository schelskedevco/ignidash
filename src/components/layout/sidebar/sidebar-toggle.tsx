'use client';

import { ArrowLeftToLineIcon, ArrowRightToLineIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { useSidebarCollapsed, useUpdateSidebarCollapsed } from '@/lib/stores/quick-plan-store';

interface SidebarToggleProps {
  className?: string;
}

export default function SidebarToggle({ className }: SidebarToggleProps) {
  const sidebarCollapsed = useSidebarCollapsed();

  const updateSidebarCollapsed = useUpdateSidebarCollapsed();
  const handleToggle = () => updateSidebarCollapsed(!sidebarCollapsed);

  return (
    <IconButton
      icon={sidebarCollapsed ? ArrowRightToLineIcon : ArrowLeftToLineIcon}
      label="Toggle sidebar"
      onClick={handleToggle}
      surfaceColor="emphasized"
      className={cn('hidden lg:inline-block', className)}
      iconClassName={sidebarCollapsed ? 'size-6' : 'size-5'}
    />
  );
}
