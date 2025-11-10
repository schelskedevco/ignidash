'use client';

import MainArea from '@/components/layout/main-area';

import DesktopMainArea from './desktop-main-area';
import MobileMainArea from './mobile-main-area';

export default function DashboardPage() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <MobileMainArea />
      <DesktopMainArea />
    </MainArea>
  );
}
