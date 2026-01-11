'use client';

import { useEffect } from 'react';
import { setGetToken, setOnUnauthorized } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function AuthInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[AuthInit] Initializing API auth handlers');

    setGetToken(() => useAuthStore.getState().token);

    setOnUnauthorized(() => {
      console.log('[AuthInit] Unauthorized → logout + redirect');
      useAuthStore.getState().logout();
      useAuthStore.setState({ needsLoginRedirect: true });
    });
  }, []);

  return <>{children}</>;
}
