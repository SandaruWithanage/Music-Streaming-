// Sidebar Navigation Component

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, Library, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/library', icon: Library, label: 'Library' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black"
        >
            {/* Logo */}
            <div className="flex h-20 items-center px-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                        <svg
                            className="h-6 w-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-white">Melodify</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="mt-4 px-3">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'group relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'text-white'
                                            : 'text-zinc-400 hover:text-white'
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                    <item.icon
                                        className={cn(
                                            'relative z-10 h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                                            isActive && 'text-violet-400'
                                        )}
                                    />
                                    <span className="relative z-10">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom section - could add playlists or other items */}
            <div className="absolute bottom-8 left-0 right-0 px-6">
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-4">
                    <p className="text-sm text-zinc-400">
                        Discover new music tailored just for you.
                    </p>
                </div>
            </div>
        </motion.aside>
    );
}
