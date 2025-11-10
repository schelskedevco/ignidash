import MainArea from '@/components/layout/main-area';

export default function SimulatorLoading() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <div
        role="status"
        aria-label="Loading dashboard"
        className="text-muted-foreground flex h-full items-center justify-center text-2xl sm:text-xl"
      >
        Loading<span className="loading-ellipsis" aria-hidden="true"></span>
      </div>
    </MainArea>
  );
}
