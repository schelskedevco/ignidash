import { Suspense } from 'react';

import PageLoading from '@/components/ui/page-loading';

import ResetPasswordForm from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading ariaLabel="Loading reset password form" message="Loading" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
