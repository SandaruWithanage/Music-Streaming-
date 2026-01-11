// Tracks Hook - React Query

import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/lib/endpoints';

export function useTracks(skip = 0, take = 20) {
    return useQuery({
        queryKey: ['tracks', skip, take],
        queryFn: () => catalogApi.getTracks(skip, take),
    });
}

export function useTrack(id: string) {
    return useQuery({
        queryKey: ['track', id],
        queryFn: () => catalogApi.getTrack(id),
        enabled: !!id,
    });
}
