// Track List Component - Horizontal or Vertical list of tracks

'use client';

import { motion } from 'framer-motion';
import { TrackCard } from './TrackCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Track } from '@/lib/types';

interface TrackListProps {
    tracks: Track[];
    title?: string;
    isLoading?: boolean;
    horizontal?: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export function TrackList({ tracks, title, isLoading, horizontal }: TrackListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {title && (
                    <Skeleton className="h-8 w-48" />
                )}
                <div className={horizontal ? 'flex gap-4 overflow-x-auto pb-4' : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={horizontal ? 'w-[180px] shrink-0' : ''}>
                            <Skeleton className="aspect-square rounded-xl" />
                            <Skeleton className="mt-3 h-4 w-3/4" />
                            <Skeleton className="mt-2 h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!tracks.length) {
        return null;
    }

    return (
        <div className="space-y-4">
            {title && (
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-bold text-white"
                >
                    {title}
                </motion.h2>
            )}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className={
                    horizontal
                        ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide'
                        : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                }
            >
                {tracks.map((track, index) => (
                    <div key={track.id} className={horizontal ? 'w-[180px] shrink-0' : ''}>
                        <TrackCard track={track} tracks={tracks} index={index} />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
