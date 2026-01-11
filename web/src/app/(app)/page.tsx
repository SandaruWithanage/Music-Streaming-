// Home Page - Trending, Personal, and Browse Tracks

'use client';

import { motion } from 'framer-motion';
import { TrackList } from '@/components/tracks/TrackList';
import { useTracks } from '@/hooks/useTracks';
import { useTrending, usePersonalRecommendations } from '@/hooks/useRecommendations';
import { useEffect, useState } from 'react';
import type { Track } from '@/lib/types';

// Recently Played - Client-side only
function useRecentlyPlayed() {
    const [recentTracks, setRecentTracks] = useState<Track[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('recently-played');
                if (stored) {
                    setRecentTracks(JSON.parse(stored));
                }
            } catch {
                // Silently fail
            }
        }
    }, []);

    return recentTracks;
}

export default function HomePage() {
    const { data: tracksData, isLoading: tracksLoading } = useTracks(0, 20);
    const { data: trendingData, isLoading: trendingLoading } = useTrending();
    const { data: personalData, isLoading: personalLoading } = usePersonalRecommendations();
    const recentlyPlayed = useRecentlyPlayed();

    return (
        <div className="space-y-10">
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-8"
            >
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white">Good evening</h1>
                    <p className="mt-2 text-lg text-white/80">
                        Pick up where you left off
                    </p>
                </div>
                {/* Background decoration */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
            </motion.section>

            {/* Recently Played */}
            {recentlyPlayed.length > 0 && (
                <TrackList
                    tracks={recentlyPlayed.slice(0, 5)}
                    title="Recently Played"
                    horizontal
                />
            )}

            {/* Trending */}
            <TrackList
                tracks={trendingData || []}
                title="🔥 Trending Now"
                isLoading={trendingLoading}
                horizontal
            />

            {/* For You */}
            <TrackList
                tracks={personalData || []}
                title="Made For You"
                isLoading={personalLoading}
                horizontal
            />

            {/* Browse All */}
            <TrackList
                tracks={tracksData?.items || []}
                title="Browse Tracks"
                isLoading={tracksLoading}
            />
        </div>
    );
}
