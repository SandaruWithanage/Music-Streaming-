// Search Page

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrackList } from '@/components/tracks/TrackList';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/hooks/useSearch';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const debouncedQuery = useDebounce(query, 300);

    // Update URL when debounced query changes
    useEffect(() => {
        if (debouncedQuery) {
            router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false });
        } else {
            router.replace('/search', { scroll: false });
        }
    }, [debouncedQuery, router]);

    const { data, isLoading, isFetching } = useSearch({
        q: debouncedQuery,
        take: 50,
    });

    const handleClear = useCallback(() => {
        setQuery('');
    }, []);

    return (
        <div className="space-y-8">
            {/* Search Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <h1 className="text-3xl font-bold text-white">Search</h1>
                <div className="relative max-w-2xl">
                    <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <Input
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-14 rounded-full border-zinc-700 bg-zinc-800/50 pl-12 pr-12 text-lg text-white placeholder:text-zinc-500"
                    />
                    {query && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Results or Empty State */}
            {!debouncedQuery ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                        <SearchIcon className="h-12 w-12 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Search for music</h2>
                    <p className="mt-2 text-zinc-400">
                        Find your favorite tracks, artists, and albums
                    </p>
                </motion.div>
            ) : isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {[...Array(10)].map((_, i) => (
                            <div key={i}>
                                <Skeleton className="aspect-square rounded-xl" />
                                <Skeleton className="mt-3 h-4 w-3/4" />
                                <Skeleton className="mt-2 h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : data?.items.length ? (
                <div className="relative">
                    {isFetching && (
                        <div className="absolute right-0 top-0">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="h-5 w-5 rounded-full border-2 border-violet-500 border-t-transparent"
                            />
                        </div>
                    )}
                    <TrackList
                        tracks={data.items}
                        title={`Results for "${debouncedQuery}"`}
                    />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <p className="text-xl text-zinc-400">
                        No results found for &quot;{debouncedQuery}&quot;
                    </p>
                    <p className="mt-2 text-zinc-500">
                        Try different keywords or check your spelling
                    </p>
                </motion.div>
            )}
        </div>
    );
}
