import { RefObject } from 'react';

export interface DisclosureState {
  open: boolean;
  close: (focusableElement?: HTMLElement | RefObject<HTMLElement | null> | undefined) => void;
  key: string;
}
