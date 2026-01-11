// Player Store - Zustand (Queue-based Playback)

import { create } from 'zustand';
import type { Track } from '@/lib/types';

export interface PlayerState {
    // Current track and queue
    currentTrack: Track | null;
    queue: Track[];
    queueIndex: number;

    // Playback state
    isPlaying: boolean;
    positionMs: number;
    durationMs: number;
    volume: number;
    isMuted: boolean;

    // Stream URL (signed)
    streamUrl: string | null;
    streamExpiresAt: Date | null;

    // Actions
    setTrack: (track: Track, queue?: Track[], index?: number) => void;
    setQueue: (queue: Track[], startIndex?: number) => void;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    next: () => Track | null;
    previous: () => Track | null;
    seek: (positionMs: number) => void;
    setPosition: (positionMs: number) => void;
    setDuration: (durationMs: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    setStreamUrl: (url: string, expiresAt: Date) => void;
    clearStreamUrl: () => void;
    stop: () => void;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
    // Initial state
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    volume: 0.8,
    isMuted: false,
    streamUrl: null,
    streamExpiresAt: null,

    // Actions
    setTrack: (track, queue, index) => {
        set({
            currentTrack: track,
            queue: queue || [track],
            queueIndex: index ?? 0,
            positionMs: 0,
            durationMs: track.durationSeconds * 1000,
            isPlaying: false,
            streamUrl: null,
            streamExpiresAt: null,
        });
    },

    setQueue: (queue, startIndex = 0) => {
        const track = queue[startIndex];
        if (track) {
            set({
                queue,
                queueIndex: startIndex,
                currentTrack: track,
                positionMs: 0,
                durationMs: track.durationSeconds * 1000,
                isPlaying: false,
                streamUrl: null,
                streamExpiresAt: null,
            });
        }
    },

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    next: () => {
        const { queue, queueIndex } = get();
        const nextIndex = queueIndex + 1;
        if (nextIndex < queue.length) {
            const track = queue[nextIndex];
            set({
                queueIndex: nextIndex,
                currentTrack: track,
                positionMs: 0,
                durationMs: track.durationSeconds * 1000,
                isPlaying: false,
                streamUrl: null,
                streamExpiresAt: null,
            });
            return track;
        }
        return null;
    },

    previous: () => {
        const { queue, queueIndex, positionMs } = get();
        // If more than 3 seconds in, restart current track
        if (positionMs > 3000) {
            set({ positionMs: 0 });
            return get().currentTrack;
        }
        const prevIndex = queueIndex - 1;
        if (prevIndex >= 0) {
            const track = queue[prevIndex];
            set({
                queueIndex: prevIndex,
                currentTrack: track,
                positionMs: 0,
                durationMs: track.durationSeconds * 1000,
                isPlaying: false,
                streamUrl: null,
                streamExpiresAt: null,
            });
            return track;
        }
        // Restart current if at beginning
        set({ positionMs: 0 });
        return get().currentTrack;
    },

    seek: (positionMs) => set({ positionMs }),
    setPosition: (positionMs) => set({ positionMs }),
    setDuration: (durationMs) => set({ durationMs }),
    setVolume: (volume) => set({ volume, isMuted: false }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

    setStreamUrl: (url, expiresAt) => set({ streamUrl: url, streamExpiresAt: expiresAt }),
    clearStreamUrl: () => set({ streamUrl: null, streamExpiresAt: null }),

    stop: () => set({
        currentTrack: null,
        queue: [],
        queueIndex: -1,
        isPlaying: false,
        positionMs: 0,
        durationMs: 0,
        streamUrl: null,
        streamExpiresAt: null,
    }),
}));
