import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { WithProviders } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My App",
  description: "A better app structure with pretty mobile views",
};

function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Top Bar */}
        <div className="w-full bg-gray-800 text-white py-4 px-6 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">NBA Bet</h1>
            {/* <nav className="flex space-x-4">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/upcoming-bets" className="hover:underline">
                Upcoming Bets
              </Link>
              <Link href="/profile" className="hover:underline">
                Profile
              </Link>
            </nav> */}
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