import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Clock, Star, Calendar } from 'lucide-react';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const { data } = await api.get(`/movies/${id}`);
        setMovie(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading movie details...</div>;
  if (!movie) return <div className="p-10 text-center text-red-500">Movie not found.</div>;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] pb-12">
      {/* Hero Backdrop */}
      <div className="relative h-96 bg-gray-900 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30 transform scale-105 blur-sm"
          style={{ backgroundImage: `url(${movie.poster_url})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-1/3 max-w-sm shrink-0">
            <img 
              src={movie.poster_url} 
              alt={movie.title} 
              className="w-full rounded-2xl shadow-2xl border-4 border-gray-800"
            />
          </div>

          {/* Details */}
          <div className="w-full md:w-2/3 text-white pt-4 md:pt-16">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{movie.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
              <span className="bg-indigo-600/80 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wider">
                {movie.genre}
              </span>
              <span className="flex items-center gap-1"><Clock size={18} /> {movie.duration} min</span>
              <span className="flex items-center gap-1 text-yellow-400"><Star size={18} fill="currentColor" /> {movie.rating}/10</span>
              <span className="px-2 py-0.5 border border-gray-500 rounded text-sm">{movie.language}</span>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2 text-gray-100">About the Movie</h3>
              <p className="text-gray-300 leading-relaxed text-lg">{movie.description}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl text-gray-900 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Ready to watch?</h4>
                  <p className="text-gray-500 text-sm">Select a theater and time to book your tickets.</p>
                </div>
              </div>
              
              <Link 
                to={`/movies/${movie.id}/showtimes`}
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-indigo-500/30"
              >
                Book Tickets Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
