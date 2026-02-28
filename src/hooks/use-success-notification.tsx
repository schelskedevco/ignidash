/** Auto-dismissing success notification state. */
import { useState, useRef, useEffect, useCallback } from 'react';

type NotificationState = {
  show: boolean;
  title: string;
  desc?: string;
};

const INITIAL_STATE: NotificationState = { show: false, title: '', desc: undefined };

export function useSuccessNotification() {
  const [notificationState, setNotificationState] = useState<NotificationState>(INITIAL_STATE);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  const showSuccessNotification = useCallback((title: string, desc?: string) => {
    setNotificationState({ show: true, title, desc });

    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);

    notificationTimeoutRef.current = setTimeout(() => {
      setNotificationState(INITIAL_STATE);
    }, 5000);
  }, []);

  const dismiss = useCallback(() => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotificationState(INITIAL_STATE);
  }, []);

  return { notificationState, showSuccessNotification, dismiss };
}
