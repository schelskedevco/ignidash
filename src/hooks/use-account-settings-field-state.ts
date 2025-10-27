import { useState } from 'react';

import { useSuccessNotification } from './use-success-notification';

export type SettingsFieldState = {
  dataMessage: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function useAccountSettingsFieldState({ successNotification }: { successNotification: string }) {
  const [fieldState, setFieldState] = useState<SettingsFieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  const { showSuccessNotification } = useSuccessNotification();

  const createCallbacks = (onSuccessExtra?: () => void) => ({
    onError: (ctx: { error: { message: string } }) => {
      setFieldState({ errorMessage: ctx.error.message, dataMessage: null, isLoading: false });
    },
    onRequest: () => {
      setFieldState({ errorMessage: null, dataMessage: null, isLoading: true });
    },
    onSuccess: (ctx: { data: { message: string } }) => {
      setFieldState({ errorMessage: null, dataMessage: ctx.data.message, isLoading: false });
      showSuccessNotification(successNotification, ctx.data.message);
      onSuccessExtra?.();
    },
  });

  return { fieldState, createCallbacks };
}
