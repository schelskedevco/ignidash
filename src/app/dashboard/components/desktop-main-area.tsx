import DashboardColumnHeader from './dashboard-column-header';
import DashboardContent from './dashboard-content';

export default function DesktopMainArea() {
  return (
    <div className="hidden lg:block">
      <DashboardColumnHeader />
      <div className="flex h-full flex-col pt-[4.3125rem]">
        <DashboardContent />
      </div>
    </div>
  );
}
