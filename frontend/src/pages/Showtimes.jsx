import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { MapPin, Clock } from 'lucide-react';

export default function Showtimes() {
  const { id } = useParams();
  const [shows, setShows] = useState([]);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Group shows by date, then by theater
  const [groupedShows, setGroupedShows] = useState({});
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [movieRes, showsRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/shows/${id}`)
        ]);
        
        setMovie(movieRes.data.data);
        const showsData = showsRes.data.data;
        setShows(showsData);

        // Grouping logic
        const grouped = {};
        showsData.forEach(show => {
          const dateStr = new Date(show.start_time).toLocaleDateString();
          if (!grouped[dateStr]) grouped[dateStr] = {};
          
          const tId = show.theater_id;
          if (!grouped[dateStr][tId]) {
            grouped[dateStr][tId] = {
              theater_name: show.theater_name,
              theater_location: show.theater_location,
              times: []
            };
          }
          grouped[dateStr][tId].times.push(show);
        });

        setGroupedShows(grouped);
        const dates = Object.keys(grouped);
        if (dates.length > 0) setSelectedDate(dates[0]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading showtimes...</div>;
  if (!movie) return <div className="p-10 text-center text-red-500">Movie not found.</div>;

  const dates = Object.keys(groupedShows);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <img src={movie.poster_url} alt={movie.title} className="w-20 h-28 object-cover rounded-lg shadow" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{movie.title}</h1>
          <p className="text-gray-500 mt-1">{movie.genre} • {movie.duration}m</p>
        </div>
      </div>

      {dates.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center shadow-sm">
          <p className="text-gray-500 text-lg">No upcoming shows available for this movie.</p>
        </div>
      ) : (
        <>
          {/* Date Selector */}
          <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
            {dates.map(date => {
              const isSelected = selectedDate === date;
              const dateObj = new Date(date);
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center min-w-[80px] p-3 rounded-2xl border transition-all ${
                    isSelected 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xs uppercase font-semibold">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-2xl font-bold">{dateObj.getDate()}</span>
                  <span className="text-xs">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                </button>
              );
            })}
          </div>

          {/* Theaters for Selected Date */}
          <div className="space-y-6">
            {Object.values(groupedShows[selectedDate] || {}).map((theater, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{theater.theater_name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1 gap-1">
                    <MapPin size={16} /> {theater.theater_location}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {theater.times.map(show => {
                    const time = new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isFilling = show.available_seats < show.total_seats * 0.3; // Less than 30% left
                    const isSoldOut = show.available_seats === 0;

                    return (
                      <Link
                        key={show.show_id}
                        to={isSoldOut ? '#' : `/shows/${show.show_id}/seats`}
                        className={`relative px-4 py-2 border rounded-xl flex flex-col items-center justify-center min-w-[100px] transition-colors ${
                          isSoldOut 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'border-green-500 text-green-700 hover:bg-green-50 hover:shadow-sm'
                        }`}
                        title={isSoldOut ? 'Sold Out' : `Select seats for ${time}`}
                      >
                        <span className="text-lg font-semibold">{time}</span>
                        <span className="text-xs font-medium">₹{show.price}</span>
                        {isFilling && !isSoldOut && (
                          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            Fast Filling
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
