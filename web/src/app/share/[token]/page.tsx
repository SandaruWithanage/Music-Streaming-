// Public Share Page - View shared playlist without authentication

'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Play, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { sharingApi } from '@/lib/endpoints';
import { Skeleton } from '@/components/ui/skeleton';

export default function SharePage() {
    const params = useParams();
    const token = params.token as string;

    const { data, isLoading, error } = useQuery({
        queryKey: ['share', token],
        queryFn: () => sharingApi.getPublic(token),
        enabled: !!token,
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
                <div className="w-full max-w-2xl space-y-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-40 w-40 rounded-xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20">
                    <Music className="h-12 w-12 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Link Expired or Invalid</h1>
                <p className="mt-2 text-zinc-400">
                    This share link may have expired or doesn&apos;t exist.
                </p>
            </div>
        );
    }

    const { playlist } = data;

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 p-8">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-end gap-6"
                >
                    <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl">
                        <Music className="h-16 w-16 text-white/50" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-zinc-400">Shared Playlist</p>
                        <h1 className="text-4xl font-bold text-white">{playlist.name}</h1>
                        <p className="text-zinc-400">
                            {playlist.items?.length || 0} tracks
                        </p>
                    </div>
                </motion.div>

                {/* Track List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50"
                >
                    {/* Header Row */}
                    <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
                        <span className="w-8 text-center">#</span>
                        <span className="flex-1">Title</span>
                        <Clock className="h-4 w-4" />
                    </div>

                    {/* Tracks */}
                    {playlist.items?.length ? (
                        playlist.items.map((item, index) => {
                            const track = item.track!;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5"
                                >
                                    <span className="w-8 text-center text-sm text-zinc-400">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-white">
                                            {track.title}
                                        </p>
                                        <p className="truncate text-sm text-zinc-400">
                                            {track.artist?.name || 'Unknown Artist'}
                                        </p>
                                    </div>
                                    <span className="text-sm text-zinc-400">
                                        {Math.floor(track.durationSeconds / 60)}:
                                        {(track.durationSeconds % 60).toString().padStart(2, '0')}
                                    </span>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center text-zinc-400">
                            This playlist is empty
                        </div>
                    )}
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-zinc-500">
                    <p>
                        Powered by{' '}
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text font-semibold text-transparent">
                            Melodify
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
