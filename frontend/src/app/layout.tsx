'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './styles/globals.css';
import Link from 'next/link';
import {
  HomeIcon,
  CalendarIcon,
  TrophyIcon,
  ClockIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { WithProviders } from '@/lib/providers';
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NBA Bet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="background-color" content="#ffffff" />

        {/* PWA color meta tags */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101828" />
        
        {/* iOS status bar style */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        {/* Open Graph / Twitter */}
        <meta property="og:title" content="NBA Bet" />
        <meta
          property="og:description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />
        <meta property="og:image" content="/icon.png" />
        <meta property="og:url" content="https://yourdomain.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-0`}
      >
        {/* App Header with Navigation */}
        <header className="sticky top-0 z-10 bg-gray-800 text-white shadow-md">
          {/* Logo Bar */}
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Title now links to home */}
            <Link 
              href="/" 
              className={`text-xl font-bold flex items-center ${
                isHomePage ? 'text-blue-400' : 'text-white hover:text-blue-200'
              } transition-colors`}
            >
              <HomeIcon className={`h-6 w-6 mr-2 ${
                isHomePage ? 'text-blue-400' : 'text-white'
              }`} />
              NBA Bet
            </Link>
            
            {/* User profile link */}
            {/* <Link
              href="/profile" 
              className="flex items-center hover:bg-gray-700 p-1 rounded-lg"
            >
              <UserIcon className="h-6 w-6" />
            </Link> */}
          </div>

          {/* Navigation Pills */}
          <div className="flex px-4 pb-2 overflow-x-auto">
            <Link
              href="/upcoming-bets"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
                pathname?.includes('/upcoming-bets')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-1" />
              <span>Bets</span>
            </Link>
            <Link
              href="/resolved-bets"
              className={`flex items-center px-4 py-2 ml-2 rounded-lg transition-colors flex-shrink-0 ${
                pathname?.includes('/resolved-bets')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ClockIcon className="h-5 w-5 mr-1" />
              <span>History</span>
            </Link>
            <Link
              href="/leaderboard"
              className={`flex items-center px-4 py-2 ml-2 rounded-lg transition-colors flex-shrink-0 ${
                pathname?.includes('/leaderboard')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TrophyIcon className="h-5 w-5 mr-1" />
              <span>Leaderboard</span>
            </Link>
            <Link
              href="/rules"
              className={`flex items-center px-4 py-2 ml-2 rounded-lg transition-colors flex-shrink-0 ${
                pathname?.includes('/rules')
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <BookOpenIcon className="h-5 w-5 mr-1" />
              <span>Rules</span>
            </Link>
          </div>
        </header>

        {/* Page Content - Add top padding for header and remove bottom margin/padding */}
        <main className="pt-4 pb-4 max-w-7xl ">{children}</main>
      </body>
    </html>
  );
}

export default WithProviders(RootLayout);