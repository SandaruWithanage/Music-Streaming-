// Auth Store - Zustand with Persist

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types';
import { setOnUnauthorized, setGetToken } from '@/lib/api';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            _hasHydrated: false,

            setAuth: (token: string, user: User) => {
                console.log('[AuthStore] setAuth called with token');
                set({ token, user, isAuthenticated: true });
            },

            logout: () => {
                console.log('[AuthStore] logout called');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('recently-played');
                    localStorage.removeItem('recently-opened-playlists');
                }
                set({ token: null, user: null, isAuthenticated: false });
            },

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            // Skip hydration issues with SSR
            skipHydration: true,
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Manual hydration on client side only
if (typeof window !== 'undefined') {
    // Mark as hydrated after rehydration
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
        console.log('[AuthStore] Hydration finished');
        useAuthStore.setState({ _hasHydrated: true });
    });

    // Hydrate the store from localStorage on client
    useAuthStore.persist.rehydrate();

    // Set up global handlers for API module
    setOnUnauthorized(() => {
        console.log('[AuthStore] Unauthorized - logging out');
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    });

    setGetToken(() => useAuthStore.getState().token);
}

// Helper hook to check if store is ready
export const useIsHydrated = () => useAuthStore((s) => s._hasHydrated);
