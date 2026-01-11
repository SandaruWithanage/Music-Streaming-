// Recommendations Hook - React Query

import { useQuery } from '@tanstack/react-query';
import { recommendationsApi } from '@/lib/endpoints';
import { useAuthStore } from '@/stores/auth.store';

export function useTrending() {
    return useQuery({
        queryKey: ['recommendations', 'trending'],
        queryFn: () => recommendationsApi.getTrending(),
    });
}

export function usePersonalRecommendations() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: ['recommendations', 'personal'],
        queryFn: () => recommendationsApi.getPersonal(),
        enabled: isAuthenticated,
    });
}
