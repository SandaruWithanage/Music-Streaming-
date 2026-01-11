// Backend DTO Types for Music Streamer API

// --- User & Auth ---
export interface User {
    id: string;
    email: string;
    displayName: string;
    role: 'USER' | 'ADMIN';
    preferences?: Record<string, unknown> | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    displayName: string;
}

// --- Catalog ---
export interface Artist {
    id: string;
    name: string;
}

export interface Album {
    id: string;
    title: string;
    coverUrl: string | null;
    artistId?: string;
    artist?: Artist;
}

export interface Track {
    id: string;
    title: string;
    durationSeconds: number;
    genre: string;
    tags: string[];
    isActive: boolean;
    createdAt: string;
    artistId: string;
    albumId: string | null;
    artist?: Artist;
    album?: Album;
}

// Backend returns { items, page: { skip, take, total, hasMore } }
export interface PaginatedResponse<T> {
    items: T[];
    page: {
        skip: number;
        take: number;
        total: number;
        hasMore: boolean;
    };
}

// --- Playback ---
export interface StreamUrlResponse {
    url: string;
    expiresAt: string;
}

export type PlaybackEventType = 'START' | 'PROGRESS' | 'PAUSE' | 'SEEK' | 'END';

export interface PlaybackEvent {
    trackId: string;
    type: PlaybackEventType;
    positionMs: number;
}

// --- Playlists ---
export interface Playlist {
    id: string;
    ownerId: string;
    name: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    items?: PlaylistItem[];
    owner?: { id: string; displayName: string };
}

export interface PlaylistItem {
    id: string;
    playlistId: string;
    trackId: string;
    position: number;
    addedAt: string;
    track?: Track;
}

export interface CreatePlaylistDto {
    name: string;
    isPublic?: boolean;
}

export interface AddPlaylistItemDto {
    trackId: string;
}

export interface ReorderPlaylistDto {
    orderedItemIds: string[];
}

export interface AddCollaboratorDto {
    userId: string;
    permission: 'VIEW' | 'EDIT';
}

// --- Sharing ---
export interface ShareResponse {
    url: string;
    expiresAt: string | null;
}

// Backend returns { token, accessLevel, expiresAt, playlist }
export interface PublicPlaylistView {
    token: string;
    accessLevel: 'VIEW' | 'EDIT';
    expiresAt: string | null;
    playlist: Playlist;
}

// --- Recommendations ---
// Same structure as Track[]
