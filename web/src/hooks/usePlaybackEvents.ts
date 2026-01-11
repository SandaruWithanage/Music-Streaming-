// Playback Events Hook - Non-blocking Event Reporting

import { useCallback, useRef, useEffect } from 'react';
import { playbackApi } from '@/lib/endpoints';
import { usePlayerStore } from '@/stores/player.store';
import type { PlaybackEventType } from '@/lib/types';

const PROGRESS_INTERVAL_MS = 10000; // 10 seconds

export function usePlaybackEvents() {
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const isPlaying = usePlayerStore((s) => s.isPlaying);

    const lastProgressRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Non-blocking event sender
    const sendEvent = useCallback(
        async (event: PlaybackEventType, position?: number) => {
            if (!currentTrack) return;

            try {
                await playbackApi.sendEvent({
                    trackId: currentTrack.id,
                    type: event,
                    positionMs: position ?? usePlayerStore.getState().positionMs,
                });
            } catch {
                // Non-blocking - silently fail
                console.warn('Failed to send playback event:', event);
            }
        },
        [currentTrack]
    );

    // Send START event
    const sendStart = useCallback(() => {
        sendEvent('START', 0);
    }, [sendEvent]);

    // Send PAUSE event
    const sendPause = useCallback(() => {
        sendEvent('PAUSE');
    }, [sendEvent]);

    // Send SEEK event
    const sendSeek = useCallback(
        (newPositionMs: number) => {
            sendEvent('SEEK', newPositionMs);
        },
        [sendEvent]
    );

    // Send END event
    const sendEnd = useCallback(() => {
        sendEvent('END');
    }, [sendEvent]);

    // Progress reporting interval
    useEffect(() => {
        if (isPlaying && currentTrack) {
            intervalRef.current = setInterval(() => {
                const currentPos = usePlayerStore.getState().positionMs;
                // Only send if position has changed significantly
                if (Math.abs(currentPos - lastProgressRef.current) > 1000) {
                    sendEvent('PROGRESS', currentPos);
                    lastProgressRef.current = currentPos;
                }
            }, PROGRESS_INTERVAL_MS);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, currentTrack, sendEvent]);

    return {
        sendStart,
        sendPause,
        sendSeek,
        sendEnd,
    };
}
