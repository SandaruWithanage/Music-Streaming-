// Playlist Detail Page

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    MoreHorizontal,
    Trash2,
    Pencil,
    ChevronUp,
    ChevronDown,
    Plus,
    Music,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlaylist, useUpdatePlaylist, useDeletePlaylist, useReorderPlaylist, useAddToPlaylist } from '@/hooks/usePlaylist';
import { useSearch } from '@/hooks/useSearch';
import { usePlayerStore } from '@/stores/player.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Track, PlaylistItem } from '@/lib/types';

function TrackRow({
    item,
    index,
    playlistItems,
    onMoveUp,
    onMoveDown,
}: {
    item: PlaylistItem;
    index: number;
    playlistItems: PlaylistItem[];
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const { currentTrack, isPlaying, setTrack, play, pause } = usePlayerStore();
    const track = item.track!;
    const isCurrentTrack = currentTrack?.id === track.id;
    const isThisPlaying = isCurrentTrack && isPlaying;

    const allTracks = playlistItems.map((i) => i.track!);

    const handlePlay = () => {
        if (isCurrentTrack) {
            if (isPlaying) pause();
            else play();
        } else {
            setTrack(track, allTracks, index);
            play();
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
                'group flex items-center gap-4 rounded-lg p-3 transition-colors',
                'hover:bg-white/5',
                isCurrentTrack && 'bg-violet-500/10'
            )}
        >
            {/* Play/Index */}
            <div className="relative flex h-8 w-8 items-center justify-center">
                <span
                    className={cn(
                        'text-sm text-zinc-400 transition-opacity',
                        'group-hover:opacity-0',
                        isThisPlaying && 'text-violet-400'
                    )}
                >
                    {isThisPlaying ? (
                        <div className="flex items-center gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [3, 10, 3] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                    className="w-0.5 rounded-full bg-violet-400"
                                />
                            ))}
                        </div>
                    ) : (
                        index + 1
                    )}
                </span>
                <button
                    onClick={handlePlay}
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                >
                    {isThisPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                    ) : (
                        <Play className="h-4 w-4 text-white" />
                    )}
                </button>
            </div>

            {/* Track Info */}
            <div className="min-w-0 flex-1">
                <p className={cn('truncate font-medium', isCurrentTrack ? 'text-violet-400' : 'text-white')}>
                    {track.title}
                </p>
                <p className="truncate text-sm text-zinc-400">
                    {track.artist?.name || 'Unknown Artist'}
                </p>
            </div>

            {/* Duration */}
            <span className="text-sm text-zinc-400">
                {Math.floor(track.durationSeconds / 60)}:
                {(track.durationSeconds % 60).toString().padStart(2, '0')}
            </span>

            {/* Reorder Controls */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white"
                    onClick={onMoveUp}
                    disabled={index === 0}
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white"
                    onClick={onMoveDown}
                    disabled={index === playlistItems.length - 1}
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    );
}

function AddTrackDialog({
    isOpen,
    onClose,
    playlistId,
}: {
    isOpen: boolean;
    onClose: () => void;
    playlistId: string;
}) {
    const [query, setQuery] = useState('');
    const { data, isLoading } = useSearch({ q: query, take: 10 });
    const addToPlaylist = useAddToPlaylist(playlistId);

    const handleAdd = async (track: Track) => {
        try {
            await addToPlaylist.mutateAsync({ trackId: track.id });
            toast.success(`Added "${track.title}" to playlist`);
        } catch {
            toast.error('Failed to add track');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[80vh] overflow-hidden border-zinc-800 bg-zinc-900">
                <DialogHeader>
                    <DialogTitle className="text-white">Add Tracks</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Search and add tracks to your playlist
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        placeholder="Search for tracks..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border-zinc-700 bg-zinc-800 text-white"
                    />
                    <div className="max-h-[300px] overflow-y-auto">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-14" />
                                ))}
                            </div>
                        ) : data?.items.length ? (
                            <div className="space-y-1">
                                {data.items.map((track) => (
                                    <div
                                        key={track.id}
                                        className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-white">
                                                {track.title}
                                            </p>
                                            <p className="truncate text-xs text-zinc-400">
                                                {track.artist?.name}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleAdd(track)}
                                            disabled={addToPlaylist.isPending}
                                            className="text-violet-400 hover:text-violet-300"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : query ? (
                            <p className="py-8 text-center text-zinc-400">No tracks found</p>
                        ) : (
                            <p className="py-8 text-center text-zinc-400">
                                Start typing to search
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function PlaylistPage() {
    const params = useParams();
    const router = useRouter();
    const playlistId = params.id as string;

    const { data: playlist, isLoading, error } = usePlaylist(playlistId);
    const updatePlaylist = useUpdatePlaylist(playlistId);
    const deletePlaylist = useDeletePlaylist();
    const reorderPlaylist = useReorderPlaylist(playlistId);
    const { setTrack, play } = usePlayerStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Save to recently opened
    useEffect(() => {
        if (playlist && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('recently-opened-playlists');
                const recent: typeof playlist[] = stored ? JSON.parse(stored) : [];
                const filtered = recent.filter((p) => p.id !== playlist.id);
                const updated = [playlist, ...filtered].slice(0, 5);
                localStorage.setItem('recently-opened-playlists', JSON.stringify(updated));
            } catch {
                // Silently fail
            }
        }
    }, [playlist]);

    const handleRename = async () => {
        if (!editedName.trim() || editedName === playlist?.name) {
            setIsEditing(false);
            return;
        }
        try {
            await updatePlaylist.mutateAsync({ name: editedName.trim() });
            toast.success('Playlist renamed');
            setIsEditing(false);
        } catch {
            toast.error('Failed to rename playlist');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this playlist?')) return;
        try {
            await deletePlaylist.mutateAsync(playlistId);
            toast.success('Playlist deleted');
            router.push('/library');
        } catch {
            toast.error('Failed to delete playlist');
        }
    };

    const handlePlayAll = () => {
        if (playlist?.items?.length) {
            const tracks = playlist.items.map((i) => i.track!);
            setTrack(tracks[0], tracks, 0);
            play();
        }
    };

    const handleReorder = useCallback(
        async (fromIndex: number, toIndex: number) => {
            if (!playlist?.items) return;
            const items = [...playlist.items];
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            const orderedItemIds = items.map((i) => i.id);
            try {
                await reorderPlaylist.mutateAsync({ orderedItemIds });
            } catch {
                toast.error('Failed to reorder');
            }
        },
        [playlist?.items, reorderPlaylist]
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-48 w-48 rounded-xl" />
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                </div>
                <Skeleton className="h-12 w-32" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-xl text-zinc-400">Playlist not found</p>
                <Button
                    variant="ghost"
                    className="mt-4 text-violet-400"
                    onClick={() => router.push('/library')}
                >
                    Back to Library
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-6"
            >
                <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl">
                    <Music className="h-20 w-20 text-white/50" />
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-400">Playlist</p>
                    {isEditing ? (
                        <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                            className="border-zinc-700 bg-transparent text-4xl font-bold text-white"
                            autoFocus
                        />
                    ) : (
                        <h1
                            className="cursor-pointer text-4xl font-bold text-white hover:underline"
                            onClick={() => {
                                setEditedName(playlist.name);
                                setIsEditing(true);
                            }}
                        >
                            {playlist.name}
                        </h1>
                    )}
                    <p className="text-zinc-400">
                        {playlist.items?.length || 0} tracks
                    </p>
                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayAll}
                    disabled={!playlist.items?.length}
                    className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full',
                        'bg-gradient-to-br from-violet-500 to-fuchsia-500',
                        'text-white shadow-lg shadow-violet-500/30',
                        'disabled:opacity-50'
                    )}
                >
                    <Play className="h-6 w-6 pl-1" />
                </motion.button>

                <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(true)}
                    className="border-zinc-700 text-white hover:border-violet-500"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tracks
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-zinc-400">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-zinc-800 bg-zinc-900">
                        <DropdownMenuItem
                            onClick={() => {
                                setEditedName(playlist.name);
                                setIsEditing(true);
                            }}
                            className="text-zinc-300"
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-red-400 focus:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Track List */}
            {playlist.items?.length ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
                    <AnimatePresence>
                        {playlist.items.map((item, index) => (
                            <TrackRow
                                key={item.id}
                                item={item}
                                index={index}
                                playlistItems={playlist.items!}
                                onMoveUp={() => handleReorder(index, index - 1)}
                                onMoveDown={() => handleReorder(index, index + 1)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 py-20">
                    <Music className="mb-4 h-12 w-12 text-zinc-600" />
                    <p className="text-zinc-400">No tracks in this playlist yet</p>
                    <Button
                        variant="ghost"
                        className="mt-2 text-violet-400"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        Add some tracks
                    </Button>
                </div>
            )}

            <AddTrackDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                playlistId={playlistId}
            />
        </div>
    );
}
