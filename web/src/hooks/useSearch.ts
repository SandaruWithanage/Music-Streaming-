// Search Hook - React Query with Debounce

import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/lib/endpoints';

interface SearchParams {
    q?: string;
    genre?: string;
    artist?: string;
    skip?: number;
    take?: number;
}

export function useSearch(params: SearchParams) {
    const { q, genre, artist, skip = 0, take = 20 } = params;

    return useQuery({
        queryKey: ['search', q, genre, artist, skip, take],
        queryFn: () => catalogApi.search({ q, genre, artist, skip, take }),
        enabled: !!(q || genre || artist), // Only search if at least one param is provided
    });
}
