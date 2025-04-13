'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './styles/globals.css';
import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { WithProviders } from '@/lib/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NBA Bet</title>
        <meta
          name="description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="NBA Bet" />
        <meta
          property="og:description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />
        <meta property="og:image" content="/path-to-your-image.jpg" />
        <meta property="og:url" content="https://your-site-url.com" />
        <meta property="og:type" content="website" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NBA Bet" />
        <meta
          name="twitter:description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />
        <meta name="twitter:image" content="/path-to-your-image.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Top Bar */}
        <div className="w-full bg-gray-800 text-white py-4 px-6 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">NBA Bet</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="mt-4">{children}</main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 w-full bg-gray-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto flex justify-around py-3">
            <Link href="/" className="flex flex-col items-center">
              <HomeIcon className="h-6 w-6" />
              <span className="text-sm">Home</span>
            </Link>
            <Link href="/upcoming-bets" className="flex flex-col items-center">
              <CalendarIcon className="h-6 w-6" />
              <span className="text-sm">Bets</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  );
}

export default WithProviders(RootLayout);
