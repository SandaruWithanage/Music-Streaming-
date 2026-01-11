// Profile Page

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/endpoints';
import { toast } from 'sonner';

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore logout API errors
        }
        logout();
        toast.success('Logged out successfully');
        router.push('/login');
    };

    if (!user) {
        return null;
    }

    const joinDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'N/A';

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-6"
            >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                    <span className="text-4xl font-bold text-white">
                        {user.displayName.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
                    <p className="text-zinc-400">{user.role}</p>
                </div>
            </motion.div>

            {/* Profile Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-white">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                                <User className="h-5 w-5 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Display Name</p>
                                <p className="text-white">{user.displayName}</p>
                            </div>
                        </div>
                        <Separator className="bg-zinc-800" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                                <Mail className="h-5 w-5 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Email</p>
                                <p className="text-white">{user.email}</p>
                            </div>
                        </div>
                        <Separator className="bg-zinc-800" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                                <Calendar className="h-5 w-5 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Member Since</p>
                                <p className="text-white">{joinDate}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </motion.div>
        </div>
    );
}
