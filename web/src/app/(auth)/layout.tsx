// Auth Layout - Simple centered layout for login/register

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
