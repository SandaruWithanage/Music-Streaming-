// Library Page - Create and view playlists

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Library as LibraryIcon, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useCreatePlaylist } from '@/hooks/usePlaylist';
import { toast } from 'sonner';
import type { Playlist } from '@/lib/types';

// Recently Opened Playlists - Client-side storage
function useRecentlyOpenedPlaylists() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('recently-opened-playlists');
                if (stored) {
                    setPlaylists(JSON.parse(stored));
                }
            } catch {
                // Silently fail
            }
        }
    }, []);

    return playlists;
}

export default function LibraryPage() {
    const router = useRouter();
    const recentPlaylists = useRecentlyOpenedPlaylists();
    const createPlaylist = useCreatePlaylist();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;

        try {
            const playlist = await createPlaylist.mutateAsync({
                name: newPlaylistName.trim(),
            });
            toast.success('Playlist created!');
            setIsDialogOpen(false);
            setNewPlaylistName('');
            router.push(`/playlists/${playlist.id}`);
        } catch {
            toast.error('Failed to create playlist');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white">Your Library</h1>
                    <p className="mt-1 text-zinc-400">Organize your music</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Playlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-zinc-800 bg-zinc-900">
                        <DialogHeader>
                            <DialogTitle className="text-white">Create Playlist</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Give your new playlist a name
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="My awesome playlist"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                className="border-zinc-700 bg-zinc-800 text-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreatePlaylist();
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="text-zinc-400"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreatePlaylist}
                                disabled={createPlaylist.isPending || !newPlaylistName.trim()}
                                className="bg-violet-500 hover:bg-violet-600"
                            >
                                {createPlaylist.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Recently Opened Playlists */}
            {recentPlaylists.length > 0 ? (
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h2 className="mb-4 text-xl font-semibold text-white">
                        Recently Opened
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {recentPlaylists.map((playlist) => (
                            <motion.div
                                key={playlist.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => router.push(`/playlists/${playlist.id}`)}
                                className="cursor-pointer"
                            >
                                <Card className="border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/30">
                                    <CardContent className="p-4">
                                        <div className="mb-4 flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20">
                                            <Music className="h-12 w-12 text-violet-400" />
                                        </div>
                                        <p className="truncate font-medium text-white">
                                            {playlist.name}
                                        </p>
                                        <p className="text-sm text-zinc-400">Playlist</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                        <LibraryIcon className="h-12 w-12 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        Create your first playlist
                    </h2>
                    <p className="mt-2 max-w-md text-zinc-400">
                        It&apos;s easy! Just click the &quot;Create Playlist&quot; button above to get started.
                    </p>
                    <p className="mt-4 text-sm text-zinc-500">
                        Note: A list of all your playlists will appear here once the
                        backend provides a GET /playlists endpoint.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
