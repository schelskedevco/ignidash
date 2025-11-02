'use client';

import { PanelLeftIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { useSidebarCollapsed, useUpdateSidebarCollapsed } from '@/lib/stores/simulator-store';

interface SidebarToggleProps {
  className?: string;
}

export default function SidebarToggle({ className }: SidebarToggleProps) {
  const sidebarCollapsed = useSidebarCollapsed();

  const updateSidebarCollapsed = useUpdateSidebarCollapsed();
  const handleToggle = () => updateSidebarCollapsed(!sidebarCollapsed);

  return (
    <IconButton
      icon={PanelLeftIcon}
      label="Toggle Sidebar"
      onClick={handleToggle}
      surfaceColor="emphasized"
      className={cn('hidden lg:inline-block', className)}
      iconClassName={sidebarCollapsed ? 'size-6' : 'size-5'}
      tooltipSide={sidebarCollapsed ? 'right' : undefined}
    />
  );
}
