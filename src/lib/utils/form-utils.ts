import type { FieldErrors } from 'react-hook-form';

export const getErrorMessages = (errors: FieldErrors): string[] => {
  const messages: string[] = [];

  const extractErrors = (obj: FieldErrors) => {
    if (!obj) return;

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (value && typeof value === 'object') {
        if ('message' in value && typeof value.message === 'string') {
          messages.push(value.message);
        } else {
          extractErrors(value as FieldErrors);
        }
      }
    }
  };

  extractErrors(errors);
  return messages;
};
