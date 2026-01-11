// Root Layout - Providers and Global Styles

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/providers/react-query';
import { AuthInit } from '@/providers/auth-init';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Melodify - Music Streaming',
  description: 'Discover and stream your favorite music',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 font-sans text-white antialiased`}
      >
        <QueryProvider>
          {/* ✅ Initialize auth → API wiring ONCE on client */}
          <AuthInit>
            {children}

            <Toaster
              position="top-right"
              theme="dark"
              toastOptions={{
                classNames: {
                  toast: 'bg-zinc-900 border-zinc-800',
                },
              }}
            />
          </AuthInit>
        </QueryProvider>
      </body>
    </html>
  );
}
