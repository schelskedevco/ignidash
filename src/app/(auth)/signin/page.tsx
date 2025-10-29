import { Suspense } from 'react';
import SignInForm from './sign-in-form';

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading sign in form"
          className="text-muted-foreground flex h-full items-center justify-center text-2xl sm:text-xl"
        >
          Loading<span className="loading-ellipsis" aria-hidden="true"></span>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
