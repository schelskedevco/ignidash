"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./components/desktop-sidebar";
import { MobileHeader } from "./components/mobile-header";
import { MobileSidebar } from "./components/mobile-sidebar";
import {
  getNavigation,
  getCurrentPageTitle,
  getCurrentPageIcon,
} from "./navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const navigation = getNavigation(pathname);
  const currentPageTitle = getCurrentPageTitle(pathname);
  const currentPageIcon = getCurrentPageIcon(pathname);

  return (
    <div>
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
      />

      <DesktopSidebar navigation={navigation} />

      <MobileHeader
        onMenuClick={() => setSidebarOpen(true)}
        currentPageTitle={currentPageTitle}
        currentPageIcon={currentPageIcon}
      />

      {children}
    </div>
  );
}
