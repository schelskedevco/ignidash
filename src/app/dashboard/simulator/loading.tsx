import MainArea from '@/components/layout/main-area';
import PageLoading from '@/components/ui/page-loading';

export default function SimulatorLoading() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <PageLoading ariaLabel="Loading dashboard" message="Loading" />
    </MainArea>
  );
}
