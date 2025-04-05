import { useEffect, useState } from 'react';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
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
    <div className="space-y-4">
      {events.map((event: any) => (
        <div key={event.id} className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-lg font-bold">{event.team1}</h2>
          <p>{event.team2}</p>
          {/* <p className="text-sm text-gray-500">{event.date}</p> */}
        </div>
      ))}
    </div>
  );
}