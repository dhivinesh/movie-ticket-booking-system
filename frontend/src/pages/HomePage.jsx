import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Search, Clock, MapPin } from 'lucide-react';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    fetchMovies();
    fetchGenres();
  }, [search, genreFilter]);

  const fetchMovies = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (genreFilter) q.append('genre', genreFilter);
      
      const { data } = await api.get(`/movies?${q.toString()}`);
      setMovies(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const { data } = await api.get('/movies/genres');
      setGenres(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-indigo-900 rounded-3xl p-8 mb-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3')] bg-cover bg-center"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Book Your Next Cinematic Experience</h1>
          <p className="text-xl text-indigo-200 mb-8">Discover the latest movies, pick your favorite seats, and skip the line.</p>
          
          {/* Search Bar */}
          <div className="flex bg-white rounded-full p-2 shadow-lg max-w-xl">
            <div className="flex-grow flex items-center pl-4">
              <Search className="text-gray-400 mr-2" size={20} />
              <input
                type="text"
                placeholder="Search movies..."
                className="w-full text-gray-900 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="bg-indigo-50 text-indigo-900 border-l border-gray-200 pl-4 pr-8 py-2 rounded-r-full focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="">All Genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Now Showing</h2>
        {loading ? (
          <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="bg-gray-200 h-96 rounded-2xl"></div>)}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No movies found. Try adjusting your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {movies.map(movie => (
              <Link to={`/movies/${movie.id}`} key={movie.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                <div className="aspect-[2/3] relative overflow-hidden bg-gray-100">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-sm font-bold flex items-center gap-1">
                    ⭐ {movie.rating}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition">{movie.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 gap-4 mb-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">{movie.genre}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {movie.duration}m</span>
                  </div>
                  <div className="mt-auto">
                    <button className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white py-2.5 rounded-xl font-semibold transition-colors">
                      Book Tickets
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
