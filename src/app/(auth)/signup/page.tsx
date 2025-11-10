import { Suspense } from 'react';

import PageLoading from '@/components/ui/page-loading';

import SignUpForm from './sign-up-form';

export default function SignUpPage() {
  return (
    <Suspense fallback={<PageLoading ariaLabel="Loading sign up form" message="Loading" />}>
      <SignUpForm />
    </Suspense>
  );
}
