// Login Page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/endpoints';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authApi.login({ email, password });
            console.log('[Login] Success, setting auth...');

            // Set auth state - this updates the in-memory Zustand store
            setAuth(response.accessToken, response.user);
            console.log('[Login] Auth set, navigating to home...');

            toast.success('Welcome back!');

            // Use router.replace to navigate (replace history to prevent back to login)
            console.log('[Login] Calling router.replace("/")');
            router.replace('/');
            console.log('[Login] router.replace called');
        } catch (error) {
            console.error('[Login] Error:', error);
            if (error instanceof ApiError) {
                toast.error(error.message);
            } else {
                toast.error('Something went wrong');
            }
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500"
                    >
                        <svg
                            className="h-8 w-8 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </motion.div>
                    <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Sign in to your Melodify account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border-zinc-700 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Sign In
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-zinc-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="text-violet-400 underline-offset-4 hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
