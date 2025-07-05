"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./components/desktop-sidebar";
import { MobileHeader } from "./components/mobile-header";
import { MobileSidebar } from "./components/mobile-sidebar";
import { MainArea } from "./components/main-area";
import { SecondaryColumn } from "./components/secondary-column";
import { getNavigation, getCurrentPageTitle } from "./navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const navigation = getNavigation(pathname);
  const currentPageTitle = getCurrentPageTitle(pathname);

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
      />

      <MainArea>{children}</MainArea>
      <SecondaryColumn />
    </div>
  );
}
