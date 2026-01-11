// Track Card Component - Displays a track with play button

'use client';

import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/player.store';
import type { Track } from '@/lib/types';

interface TrackCardProps {
    track: Track;
    tracks?: Track[]; // For queue context
    index?: number;
}

export function TrackCard({ track, tracks, index }: TrackCardProps) {
    const { currentTrack, isPlaying, setTrack, play, pause } = usePlayerStore();

    const isCurrentTrack = currentTrack?.id === track.id;
    const isThisPlaying = isCurrentTrack && isPlaying;

    const handleClick = () => {
        if (isCurrentTrack) {
            if (isPlaying) {
                pause();
            } else {
                play();
            }
        } else {
            setTrack(track, tracks, index);
            play();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'group relative cursor-pointer overflow-hidden rounded-2xl',
                'bg-gradient-to-br from-zinc-800/50 to-zinc-900/50',
                'p-4 backdrop-blur-sm',
                'border border-white/5',
                'transition-all duration-300',
                'hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10',
                isCurrentTrack && 'border-violet-500/50 ring-1 ring-violet-500/30'
            )}
            onClick={handleClick}
        >
            {/* Cover Image */}
            <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
                <div
                    className={cn(
                        'absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600',
                        'flex items-center justify-center'
                    )}
                >
                    <svg
                        className="h-12 w-12 text-white/50"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                </div>

                {/* Play Button Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isThisPlaying ? 1 : 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-full',
                            'bg-gradient-to-br from-violet-500 to-fuchsia-500',
                            'text-white shadow-xl shadow-black/30'
                        )}
                    >
                        {isThisPlaying ? (
                            <Pause className="h-6 w-6" />
                        ) : (
                            <Play className="h-6 w-6 pl-1" />
                        )}
                    </motion.button>
                </motion.div>

                {/* Playing Indicator */}
                {isThisPlaying && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    height: [4, 16, 4],
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                }}
                                className="w-1 rounded-full bg-violet-400"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Track Info */}
            <div className="space-y-1">
                <h3 className="truncate text-sm font-semibold text-white">
                    {track.title}
                </h3>
                <p className="truncate text-xs text-zinc-400">
                    {track.artist?.name || 'Unknown Artist'}
                </p>
            </div>

            {/* Gradient shine effect on hover */}
            <div
                className={cn(
                    'absolute inset-0 -z-10 opacity-0 transition-opacity duration-500',
                    'bg-gradient-to-tr from-violet-500/10 via-transparent to-fuchsia-500/10',
                    'group-hover:opacity-100'
                )}
            />
        </motion.div>
    );
}
