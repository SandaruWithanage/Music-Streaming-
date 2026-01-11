// Playlist Hook - React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistsApi } from '@/lib/endpoints';
import type { CreatePlaylistDto, AddPlaylistItemDto, ReorderPlaylistDto } from '@/lib/types';

export function usePlaylist(id: string) {
    return useQuery({
        queryKey: ['playlist', id],
        queryFn: () => playlistsApi.get(id),
        enabled: !!id,
    });
}

export function useCreatePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreatePlaylistDto) => playlistsApi.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
        },
    });
}

export function useUpdatePlaylist(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreatePlaylistDto) => playlistsApi.update(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlist', id] });
        },
    });
}

export function useDeletePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => playlistsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
        },
    });
}

export function useAddToPlaylist(playlistId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: AddPlaylistItemDto) => playlistsApi.addItem(playlistId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
        },
    });
}

export function useReorderPlaylist(playlistId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: ReorderPlaylistDto) => playlistsApi.reorder(playlistId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
        },
    });
}
