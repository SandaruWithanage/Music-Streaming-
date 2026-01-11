// Auth Guard Hook - Redirects to login if not authenticated

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsHydrated } from '@/stores/auth.store';

export function useAuthGuard() {
    const router = useRouter();
    const token = useAuthStore((s) => s.token);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useIsHydrated(); // Use the correct helper hook

    useEffect(() => {
        // Wait for hydration before making any decisions
        if (!isHydrated) return;

        // If not authenticated after hydration, redirect to login
        if (!isAuthenticated && !token) {
            router.replace('/login');
        }
    }, [isHydrated, isAuthenticated, token, router]);

    return {
        isAuthenticated,
        isLoading: !isHydrated
    };
}
