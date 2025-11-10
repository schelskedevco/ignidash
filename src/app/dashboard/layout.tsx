'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useConvexAuth } from 'convex/react';

import { DesktopSidebar } from '@/components/layout/sidebar/desktop-sidebar';
import MobileHeader from '@/components/layout/sidebar/mobile-header';
import MobileSidebar from '@/components/layout/sidebar/mobile-sidebar';
import { getNavigation, getSecondaryNavigation, getCurrentPageTitle, getCurrentPageIcon } from '@/lib/navigation';
import { useSidebarCollapsed } from '@/lib/stores/simulator-store';
import PageLoading from '@/components/ui/page-loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const sidebarCollapsed = useSidebarCollapsed();

  const navigation = getNavigation(pathname);
  const secondaryNavigation = getSecondaryNavigation();
  const currentPageTitle = getCurrentPageTitle(pathname);
  const currentPageIcon = getCurrentPageIcon(pathname);

  return (
    <div className="group/sidebar h-full" data-state={sidebarCollapsed ? 'collapsed' : 'expanded'}>
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        secondaryNavigation={secondaryNavigation}
      />
      <DesktopSidebar navigation={navigation} secondaryNavigation={secondaryNavigation} />
      <div className="flex h-full flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} currentPageTitle={currentPageTitle} currentPageIcon={currentPageIcon} />
        {!isAuthenticated && !isLoading ? <PageLoading message="Redirecting to sign-in" /> : children}
      </div>
    </div>
  );
}
