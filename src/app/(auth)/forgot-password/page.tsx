import { Suspense } from 'react';

import PageLoading from '@/components/ui/page-loading';

import ForgotPasswordForm from './forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoading ariaLabel="Loading forgot password form" message="Loading" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
