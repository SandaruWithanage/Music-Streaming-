// API Endpoints - Typed Backend Calls

import { apiFetch } from './api';
import type {
    AuthResponse,
    LoginCredentials,
    RegisterCredentials,
    Track,
    PaginatedResponse,
    StreamUrlResponse,
    PlaybackEvent,
    Playlist,
    CreatePlaylistDto,
    AddPlaylistItemDto,
    ReorderPlaylistDto,
    AddCollaboratorDto,
    ShareResponse,
    PublicPlaylistView,
    User,
} from './types';

// --- Auth ---
export const authApi = {
    register: (credentials: RegisterCredentials) =>
        apiFetch<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipAuth: true,
        }),

    login: (credentials: LoginCredentials) =>
        apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipAuth: true,
        }),

    logout: () =>
        apiFetch<{ success: boolean }>('/auth/logout', {
            method: 'POST',
        }),
};

// --- Users ---
export const usersApi = {
    getMe: () => apiFetch<User>('/users/me'),

    updatePreferences: (preferences: Record<string, unknown>) =>
        apiFetch<User>('/users/me/preferences', {
            method: 'PATCH',
            body: JSON.stringify({ preferences }),
        }),
};

// --- Catalog ---
export const catalogApi = {
    getTracks: (skip = 0, take = 20) =>
        apiFetch<PaginatedResponse<Track>>(`/tracks?skip=${skip}&take=${take}`),

    getTrack: (id: string) => apiFetch<Track>(`/tracks/${id}`),

    search: (params: { q?: string; genre?: string; artist?: string; skip?: number; take?: number }) => {
        const searchParams = new URLSearchParams();
        if (params.q) searchParams.append('q', params.q);
        if (params.genre) searchParams.append('genre', params.genre);
        if (params.artist) searchParams.append('artist', params.artist);
        if (params.skip !== undefined) searchParams.append('skip', String(params.skip));
        if (params.take !== undefined) searchParams.append('take', String(params.take));
        return apiFetch<PaginatedResponse<Track>>(`/search?${searchParams.toString()}`);
    },
};

// --- Playback ---
export const playbackApi = {
    getStreamUrl: (trackId: string) =>
        apiFetch<StreamUrlResponse>(`/tracks/${trackId}/stream`),

    sendEvent: (event: PlaybackEvent) =>
        apiFetch<{ ok: boolean }>('/playback/events', {
            method: 'POST',
            body: JSON.stringify(event),
        }),
};

// --- Playlists ---
export const playlistsApi = {
    create: (dto: CreatePlaylistDto) =>
        apiFetch<Playlist>('/playlists', {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    get: (id: string) => apiFetch<Playlist>(`/playlists/${id}`),

    update: (id: string, dto: CreatePlaylistDto) =>
        apiFetch<Playlist>(`/playlists/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }),

    delete: (id: string) =>
        apiFetch<void>(`/playlists/${id}`, { method: 'DELETE' }),

    addItem: (playlistId: string, dto: AddPlaylistItemDto) =>
        apiFetch<Playlist>(`/playlists/${playlistId}/items`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    reorder: (playlistId: string, dto: ReorderPlaylistDto) =>
        apiFetch<Playlist>(`/playlists/${playlistId}/reorder`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }),

    addCollaborator: (playlistId: string, dto: AddCollaboratorDto) =>
        apiFetch<void>(`/playlists/${playlistId}/collaborators`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    removeCollaborator: (playlistId: string, userId: string) =>
        apiFetch<void>(`/playlists/${playlistId}/collaborators/${userId}`, {
            method: 'DELETE',
        }),
};

// --- Sharing ---
export const sharingApi = {
    share: (playlistId: string) =>
        apiFetch<ShareResponse>(`/playlists/${playlistId}/share`, {
            method: 'POST',
        }),

    getPublic: (token: string) =>
        apiFetch<PublicPlaylistView>(`/share/${token}`, { skipAuth: true }),
};

// --- Recommendations ---
export const recommendationsApi = {
    getTrending: () => apiFetch<Track[]>('/recommendations/trending', { skipAuth: true }),

    getPersonal: () => apiFetch<Track[]>('/recommendations/personal'),
};
