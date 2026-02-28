import { useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const TOAST_ID = 'sw-update-toast';

export function useSwUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL);
      }
    },
    onRegisterError(error) {
    },
  });

  const needRefreshRef = useRef(needRefresh);
  needRefreshRef.current = needRefresh;

  const showUpdateToast = useCallback(() => {
    toast('New version available', {
      id: TOAST_ID,
      description: 'Refresh to get the latest update.',
      duration: Infinity,
      dismissible: false,
      action: {
        label: 'Refresh',
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [updateServiceWorker]);

  // Show toast when needRefresh becomes true
  useEffect(() => {
    if (needRefresh) {
      showUpdateToast();
    }
  }, [needRefresh, showUpdateToast]);

  // Re-show toast when app comes back to foreground (e.g. user reopens PWA)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && needRefreshRef.current) {
        showUpdateToast();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [showUpdateToast]);
}
