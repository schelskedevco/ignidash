/** Per-field loading/error/success state for account settings forms. */
import { useState } from 'react';

export type SettingsFieldState = {
  dataMessage: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function useAccountSettingsFieldState() {
  const [fieldState, setFieldState] = useState<SettingsFieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  const createCallbacks = (onSuccessExtra?: () => void) => ({
    onError: (ctx: { error: { message: string } }) =>
      setFieldState({ errorMessage: ctx.error.message, dataMessage: null, isLoading: false }),
    onRequest: () => setFieldState({ errorMessage: null, dataMessage: null, isLoading: true }),
    onSuccess: (ctx: { data: { message: string } }) => {
      setFieldState({ errorMessage: null, dataMessage: ctx.data.message, isLoading: false });
      onSuccessExtra?.();
    },
  });

  return { fieldState, createCallbacks };
}
