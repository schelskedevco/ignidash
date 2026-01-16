'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import posthog from 'posthog-js';

import { DesktopSidebar } from '@/components/layout/sidebar/desktop-sidebar';
import MobileHeader from '@/components/layout/sidebar/mobile-header';
import MobileSidebar from '@/components/layout/sidebar/mobile-sidebar';
import { useSidebarCollapsed } from '@/lib/stores/simulator-store';
import UnauthenticatedWrapper from '@/components/layout/unauthenticated-wrapper';
import { usePostHogIdentify } from '@/hooks/use-posthog-identify';
import { Dialog } from '@/components/catalyst/dialog';

import OnboardingDialog from './components/dialogs/onboarding-dialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarCollapsed = useSidebarCollapsed();

  usePostHogIdentify();

  const onboardingDialogCompleted = useQuery(api.onboarding.get);
  useEffect(() => {
    if (onboardingDialogCompleted === undefined) return;

    if (!onboardingDialogCompleted) setOnboardingDialogOpen(true);
  }, [onboardingDialogCompleted]);

  const m = useMutation(api.onboarding.update);
  const handleOnboardingDialogClose = async () => {
    try {
      await m();
    } catch (error) {
      console.error('Error updating onboarding dialog: ', error);
    } finally {
      posthog.capture('onboarding_dialog_completed');
      setOnboardingDialogOpen(false);
    }
  };

  return (
    <>
      <div className="group/sidebar h-full" data-state={sidebarCollapsed ? 'collapsed' : 'expanded'}>
        <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <DesktopSidebar />
        <div className="flex h-full flex-col">
          <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />
          <UnauthenticatedWrapper>{children}</UnauthenticatedWrapper>
        </div>
      </div>
      <Dialog size="xl" open={onboardingDialogOpen} onClose={handleOnboardingDialogClose}>
        <OnboardingDialog onClose={handleOnboardingDialogClose} />
      </Dialog>
    </>
  );
}
