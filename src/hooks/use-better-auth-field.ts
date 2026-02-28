/** Per-field loading/error state for Better-Auth settings operations. */
import { useState, useCallback } from 'react';

export type BetterAuthFieldState = {
  isLoading: boolean;
  errorMessage: string | null;
};

export function useBetterAuthField() {
  const [fieldState, setFieldState] = useState<BetterAuthFieldState>({
    isLoading: false,
    errorMessage: null,
  });

  const createCallbacks = useCallback(
    (onSuccessExtra?: () => void) => ({
      onError: (ctx: { error: { message: string } }) => setFieldState({ errorMessage: ctx.error.message, isLoading: false }),
      onRequest: () => setFieldState({ errorMessage: null, isLoading: true }),
      onSuccess: () => {
        setFieldState({ errorMessage: null, isLoading: false });
        onSuccessExtra?.();
      },
    }),
    []
  );

  return { fieldState, createCallbacks };
}
