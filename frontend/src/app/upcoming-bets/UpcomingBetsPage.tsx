'use client';

import Bet from '@/components/Bet'; // Adjust the import path as needed
import { withAuth } from '@/lib/withAuth';
import { useEffect, useState } from 'react';

function UpcomingBetsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("api/events");
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return <p>Loading events...</p>;
  }

  if (!events.length) {
    return <p>No events found.</p>;
  }

  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 bg-white dark:bg-black">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
        Upcoming Bets
      </h1>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-4">
      
      <div className="space-y-4">
      {events.map((event: any) => (
        <Bet
          key={event.id}
          team1={event.team1}
          team2={event.team2}
          startTime={event.startTime}/>
      ))}
    </div>

      </div>
    </div>
  );
}

export default withAuth(UpcomingBetsPage)