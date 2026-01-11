// Authenticated App Layout - Contains Sidebar and PlayerBar

'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { PlayerBar } from '@/components/player/PlayerBar';
import { useAuthStore, useIsHydrated } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const isHydrated = useIsHydrated();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const token = useAuthStore((s) => s.token);

    // ✅ NEW: redirect flag from store
    const needsLoginRedirect = useAuthStore((s) => s.needsLoginRedirect);
    const clearLoginRedirect = useAuthStore((s) => s.clearLoginRedirect);

    console.log(
        '[AppLayout] Render',
        {
            isHydrated,
            isAuthenticated,
            hasToken: !!token,
            needsLoginRedirect,
        }
    );

    // ✅ NEW: handle forced logout redirects (401)
    useEffect(() => {
        if (!isHydrated) return;

        if (needsLoginRedirect) {
            console.log('[AppLayout] Redirect requested by store (401 logout)');
            clearLoginRedirect();
            router.replace('/login');
        }
    }, [isHydrated, needsLoginRedirect, clearLoginRedirect, router]);

    // Existing auth guard logic
    useEffect(() => {
        console.log(
            '[AppLayout] Auth check',
            {
                isHydrated,
                isAuthenticated,
                hasToken: !!token,
            }
        );

        if (isHydrated && !isAuthenticated && !token) {
            console.log('[AppLayout] ⚠️ Redirecting to login (not authenticated)');
            router.replace('/login');
        }
    }, [isHydrated, isAuthenticated, token, router]);

    // Show loading while hydrating
    if (!isHydrated) {
        console.log('[AppLayout] Showing loading spinner - waiting for hydration');
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-12 w-12 rounded-full border-2 border-violet-500 border-t-transparent"
                />
            </div>
        );
    }

    // If authenticated, render the app
    if (isAuthenticated || token) {
        console.log('[AppLayout] ✅ Rendering app - authenticated');
        return (
            <div className="min-h-screen bg-zinc-950">
                <Sidebar />
                <main className="ml-64 min-h-screen pb-28">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="p-8"
                    >
                        {children}
                    </motion.div>
                </main>
                <PlayerBar />
            </div>
        );
    }

    // Not authenticated - show loading while redirecting
    console.log('[AppLayout] Showing loading spinner - redirecting to login');
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-12 w-12 rounded-full border-2 border-violet-500 border-t-transparent"
            />
        </div>
    );
}
