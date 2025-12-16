import MainArea from '@/components/layout/main-area';

import DesktopMainArea from './components/desktop-main-area';
import MobileMainArea from './components/mobile-main-area';

export default function InsightsPage() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <MobileMainArea />
      <DesktopMainArea />
    </MainArea>
  );
}
