'use client';

import { useState, lazy, Suspense } from 'react';
import { LayoutDashboardIcon, MessageCircleMoreIcon, InfoIcon } from 'lucide-react';
import type { Preloaded } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { api } from '@/convex/_generated/api';

import IconButton from '@/components/ui/icon-button';
import PageLoading from '@/components/ui/page-loading';
import Drawer from '@/components/ui/drawer';
import { Dialog } from '@/components/catalyst/dialog';
import ColumnHeader from '@/components/ui/column-header';

import OnboardingDialog from './dialogs/onboarding-dialog';

const UserFeedbackDrawer = lazy(() => import('@/components/layout/user-feedback-drawer'));

interface DashboardColumnHeaderProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function DashboardColumnHeader({ preloadedUser }: DashboardColumnHeaderProps) {
  const user = usePreloadedAuthQuery(preloadedUser);
  const name = user?.name ?? 'Anonymous';

  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const handleOnboardingDialogClose = () => setOnboardingDialogOpen(false);

  const [userFeedbackOpen, setUserFeedbackOpen] = useState(false);
  const userFeedbackTitleComponent = (
    <div className="flex items-center gap-2">
      <MessageCircleMoreIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Share Feedback</span>
    </div>
  );

  return (
    <>
      <ColumnHeader
        title={`Welcome back, ${name.split(' ')[0]}!`}
        icon={LayoutDashboardIcon}
        className="w-[calc(100%-18rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-4rem)]"
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton icon={InfoIcon} label="Onboarding" onClick={() => setOnboardingDialogOpen(true)} surfaceColor="emphasized" />
            <IconButton
              icon={MessageCircleMoreIcon}
              label="Share Feedback"
              onClick={() => setUserFeedbackOpen(true)}
              surfaceColor="emphasized"
            />
          </div>
        }
      />

      <Drawer open={userFeedbackOpen} setOpen={setUserFeedbackOpen} title={userFeedbackTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading User Feedback" />}>
          <UserFeedbackDrawer setOpen={setUserFeedbackOpen} />
        </Suspense>
      </Drawer>
      <Dialog size="xl" open={onboardingDialogOpen} onClose={handleOnboardingDialogClose}>
        <OnboardingDialog onClose={handleOnboardingDialogClose} />
      </Dialog>
    </>
  );
}
