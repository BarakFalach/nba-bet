'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './styles/globals.css';
import Link from 'next/link';
import { HomeIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
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
  
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NBA Bet</title>
        <meta
          name="description"
          content="Track your NBA bets with ease and stay updated on upcoming games."
        />

        {/* Open Graph and Twitter Meta Tags omitted for brevity */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-0`}
      >
        {/* App Header with Navigation */}
        <header className="sticky top-0 z-10 bg-gray-800 text-white shadow-md">
          {/* Logo Bar */}
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">NBA Bet</h1>
            <UserIcon className="h-6 w-6" />
          </div>
          
          {/* Navigation Pills */}
          <div className="flex px-4 pb-2">
            <Link 
              href="/" 
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                pathname === '/' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <HomeIcon className="h-5 w-5 mr-1" />
              <span>Home</span>
            </Link>
            <Link 
              href="/upcoming-bets" 
              className={`flex items-center px-4 py-2 ml-2 rounded-lg transition-colors ${
                pathname?.includes('/upcoming-bets') 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-1" />
              <span>Bets</span>
            </Link>
          </div>
        </header>

        {/* Page Content - Add top padding for header and remove bottom margin/padding */}
        <main className="px-4 pt-4 pb-4 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

export default WithProviders(RootLayout);