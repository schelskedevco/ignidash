import { Suspense } from 'react';
import SignUpForm from './sign-up-form';

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading sign up form"
          className="text-muted-foreground flex h-full items-center justify-center text-2xl sm:text-xl"
        >
          Loading<span className="loading-ellipsis" aria-hidden="true"></span>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
