// Player Bar Component - Persistent Footer Player

'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Heart,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/stores/player.store';
import { useTrackStream } from '@/hooks/useTrackStream';
import { usePlaybackEvents } from '@/hooks/usePlaybackEvents';
import { cn } from '@/lib/utils';

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
    const audioRef = useRef<HTMLAudioElement>(null);

    const {
        currentTrack,
        isPlaying,
        positionMs,
        durationMs,
        volume,
        isMuted,
        streamUrl,
        streamExpiresAt,
        play,
        pause,
        next,
        previous,
        setPosition,
        setVolume,
        toggleMute,
    } = usePlayerStore();

    const { mutate: fetchStream } = useTrackStream();
    const { sendStart, sendPause, sendSeek, sendEnd } = usePlaybackEvents();

    // Fetch stream URL when track changes
    useEffect(() => {
        if (currentTrack && !streamUrl) {
            fetchStream(currentTrack.id);
        }
    }, [currentTrack, streamUrl, fetchStream]);

    // Play audio when stream URL is ready and isPlaying is true
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !streamUrl) return;

        if (audio.src !== streamUrl) {
            audio.src = streamUrl;
            audio.load();
        }

        if (isPlaying) {
            audio.play().catch(() => {
                // Handle autoplay restrictions
                pause();
            });
        } else {
            audio.pause();
        }
    }, [streamUrl, isPlaying, pause]);

    // Sync volume
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Time update handler
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setPosition(audio.currentTime * 1000);
        };

        const handleEnded = () => {
            sendEnd();
            const nextTrack = next();
            if (nextTrack) {
                // Will trigger stream fetch
            } else {
                pause();
            }
        };

        const handleError = () => {
            // Stream URL expired - refetch
            if (currentTrack && streamExpiresAt && new Date() > streamExpiresAt) {
                fetchStream(currentTrack.id);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [currentTrack, streamExpiresAt, fetchStream, next, pause, sendEnd, setPosition]);

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            pause();
            sendPause();
        } else {
            play();
            if (positionMs < 1000) {
                sendStart();
            }
        }
    }, [isPlaying, pause, play, positionMs, sendPause, sendStart]);

    const handleSeek = useCallback(
        (value: number[]) => {
            const newPosition = value[0];
            setPosition(newPosition);
            if (audioRef.current) {
                audioRef.current.currentTime = newPosition / 1000;
            }
            sendSeek(newPosition);
        },
        [setPosition, sendSeek]
    );

    const handlePrevious = useCallback(() => {
        const track = previous();
        if (track) {
            sendEnd();
        }
    }, [previous, sendEnd]);

    const handleNext = useCallback(() => {
        const track = next();
        if (track) {
            sendEnd();
        }
    }, [next, sendEnd]);

    return (
        <>
            <audio ref={audioRef} preload="metadata" />
            <AnimatePresence>
                {currentTrack && (
                    <motion.footer
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 z-50 h-24 border-t border-white/10 bg-gradient-to-r from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-xl"
                    >
                        <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4">
                            {/* Track Info */}
                            <div className="flex w-72 items-center gap-4">
                                <motion.div
                                    animate={{ rotate: isPlaying ? 360 : 0 }}
                                    transition={{
                                        duration: 3,
                                        repeat: isPlaying ? Infinity : 0,
                                        ease: 'linear',
                                    }}
                                    className="relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20"
                                >
                                    {currentTrack.album?.coverUrl ? (
                                        <Image
                                            src={currentTrack.album.coverUrl}
                                            alt={currentTrack.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <svg
                                                className="h-6 w-6 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                            </svg>
                                        </div>
                                    )}
                                </motion.div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                        {currentTrack.title}
                                    </p>
                                    <p className="truncate text-xs text-zinc-400">
                                        {currentTrack.artist?.name || 'Unknown Artist'}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-2 text-zinc-400 hover:text-pink-500"
                                >
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-1 flex-col items-center gap-2">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrevious}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        <SkipBack className="h-5 w-5" />
                                    </Button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handlePlayPause}
                                        className={cn(
                                            'flex h-12 w-12 items-center justify-center rounded-full',
                                            'bg-gradient-to-br from-violet-500 to-fuchsia-500',
                                            'text-white shadow-lg shadow-violet-500/30',
                                            'transition-shadow hover:shadow-xl hover:shadow-violet-500/40'
                                        )}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-5 w-5" />
                                        ) : (
                                            <Play className="h-5 w-5 pl-0.5" />
                                        )}
                                    </motion.button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNext}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        <SkipForward className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex w-full max-w-xl items-center gap-3">
                                    <span className="w-10 text-right text-xs text-zinc-400">
                                        {formatTime(positionMs)}
                                    </span>
                                    <Slider
                                        value={[positionMs]}
                                        max={durationMs || 1}
                                        step={1000}
                                        onValueChange={handleSeek}
                                        className="flex-1"
                                    />
                                    <span className="w-10 text-xs text-zinc-400">
                                        {formatTime(durationMs)}
                                    </span>
                                </div>
                            </div>

                            {/* Volume */}
                            <div className="flex w-48 items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleMute}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="h-5 w-5" />
                                    ) : (
                                        <Volume2 className="h-5 w-5" />
                                    )}
                                </Button>
                                <Slider
                                    value={[isMuted ? 0 : volume * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={(v) => setVolume(v[0] / 100)}
                                    className="w-24"
                                />
                            </div>
                        </div>
                    </motion.footer>
                )}
            </AnimatePresence>
        </>
    );
}
