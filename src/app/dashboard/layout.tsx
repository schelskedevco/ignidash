'use client';

import { useState } from 'react';

import { DesktopSidebar } from '@/components/layout/sidebar/desktop-sidebar';
import MobileHeader from '@/components/layout/sidebar/mobile-header';
import MobileSidebar from '@/components/layout/sidebar/mobile-sidebar';
import { useSidebarCollapsed } from '@/lib/stores/simulator-store';
import UnauthenticatedWrapper from '@/components/layout/unauthenticated-wrapper';
import { usePostHogIdentify } from '@/hooks/use-posthog-identify';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const desktopSidebarCollapsed = useSidebarCollapsed();

  usePostHogIdentify();

  return (
    <div className="group/sidebar h-full" data-state={desktopSidebarCollapsed ? 'collapsed' : 'expanded'}>
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <DesktopSidebar />
      <div className="flex h-full flex-col">
        <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <UnauthenticatedWrapper>{children}</UnauthenticatedWrapper>
      </div>
    </div>
  );
}
