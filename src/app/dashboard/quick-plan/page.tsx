import MainArea from '@/components/layout/main-area';
import SecondaryColumn from '@/components/layout/secondary-column';

import NumbersColumnSections from './components/inputs/numbers-column-sections';
import NumbersColumnHeader from './components/inputs/numbers-column-header';
import DesktopMainArea from './components/desktop-main-area';
import MobileMainArea from './components/mobile-main-area';

export default function QuickPlanPage() {
  return (
    <>
      <MainArea>
        <MobileMainArea />
        <DesktopMainArea />
      </MainArea>
      <SecondaryColumn>
        <NumbersColumnHeader />
        <div className="relative flex h-[calc(100%-4.3125rem)] flex-col">
          <NumbersColumnSections />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 animate-pulse"
            style={{
              background: 'radial-gradient(ellipse 200px 160px at center bottom, rgb(244 63 94 / 0.3) 0%, transparent 75%)',
              animationDuration: '3s',
            }}
          />
        </div>
      </SecondaryColumn>
    </>
  );
}
