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

    // Redirect control flag
    needsLoginRedirect: boolean;

    setAuth: (token: string, user: User) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
    clearLoginRedirect: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            _hasHydrated: false,
            needsLoginRedirect: false,

            setAuth: (token: string, user: User) => {
                console.log('[AuthStore] setAuth called with token');
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    needsLoginRedirect: false,
                });
            },

            logout: () => {
                console.log('[AuthStore] logout called');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('recently-played');
                    localStorage.removeItem('recently-opened-playlists');
                }
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            clearLoginRedirect: () => {
                set({ needsLoginRedirect: false });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),

            // ✅ IMPORTANT CHANGE
            skipHydration: false,

            // ✅ Persist controls hydration completely
            onRehydrateStorage: () => (state) => {
                console.log('[AuthStore] Rehydration finished');
                state?.setHasHydrated(true);
            },

            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// ✅ API integration belongs at module level (safe now)
setOnUnauthorized(() => {
    console.log('[AuthStore] Unauthorized - logging out');
    useAuthStore.getState().logout();
    useAuthStore.setState({ needsLoginRedirect: true });
});

setGetToken(() => useAuthStore.getState().token);

// Helper hook to check if store is ready
export const useIsHydrated = () =>
    useAuthStore((s) => s._hasHydrated);
