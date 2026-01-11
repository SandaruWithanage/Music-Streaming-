// Track Stream Hook - Handles Signed URL Fetching

import { useMutation } from '@tanstack/react-query';
import { playbackApi } from '@/lib/endpoints';
import { usePlayerStore } from '@/stores/player.store';

export function useTrackStream() {
    const setStreamUrl = usePlayerStore((s) => s.setStreamUrl);

    return useMutation({
        mutationFn: (trackId: string) => playbackApi.getStreamUrl(trackId),
        onSuccess: (data) => {
            setStreamUrl(data.url, new Date(data.expiresAt));
        },
    });
}
