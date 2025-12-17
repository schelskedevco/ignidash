import DashboardContent from './dashboard-content';

export default function MobileMainArea() {
  return (
    <div className="flex h-full flex-col pt-[4.0625rem] lg:hidden">
      <DashboardContent />
    </div>
  );
}
