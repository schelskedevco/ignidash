import { useState, useRef, useEffect } from 'react';

type NotificationState = {
  show: boolean;
  title: string;
  desc: string;
};

export function useSuccessNotification() {
  const [notificationState, setNotificationState] = useState<NotificationState>({ show: false, title: '', desc: '' });
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  const showSuccessNotification = (title: string, desc: string) => {
    setNotificationState({ show: true, title, desc });

    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);

    notificationTimeoutRef.current = setTimeout(() => {
      setNotificationState({ show: false, title: '', desc: '' });
    }, 3000);
  };

  const setShow = (show: boolean) => setNotificationState((prev) => ({ ...prev, show }));

  return { notificationState, showSuccessNotification, setShow };
}
