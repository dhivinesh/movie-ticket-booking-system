import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Building2, Presentation, CalendarCheck, ScanLine, Users, TrendingUp, XCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const [shows, setShows] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTheaterModalOpen, setIsTheaterModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);

  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [currentScreens, setCurrentScreens] = useState([]);
  const [formData, setFormData] = useState({
    movie_id: '',
    theater_id: '',
    screen_id: '',
    start_time: '',
    price: '',
    total_seats: ''
  });

  const [theaterFormData, setTheaterFormData] = useState({
    name: '',
    location: '',
    screen_name: '',
    total_seats: ''
  });

  const [screenFormData, setScreenFormData] = useState({
    theater_id: '',
    screen_name: '',
    total_seats: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showsRes, salesRes] = await Promise.all([
        api.get('/owner/shows'),
        api.get('/owner/sales')
      ]);
      setShows(showsRes.data.data);
      setSales(salesRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTheatersAndMovies = async () => {
    try {
      const [theatersRes, moviesRes] = await Promise.all([
        api.get('/owner/theaters'),
        api.get('/movies')
      ]);
      setTheaters(theatersRes.data.data);
      setMovies(moviesRes.data.data);
    } catch (err) {
      toast.error('Failed to fetch theaters or movies.');
    }
  };

  useEffect(() => {
    fetchData();
    fetchTheatersAndMovies();
  }, []);

  const handleTheaterChange = async (theaterId) => {
    setFormData(prev => ({ ...prev, theater_id: theaterId, screen_id: '' }));
    setCurrentScreens([]); // Clear screens when theater changes
    if (!theaterId) {
      setCurrentScreens([]);
      return;
    }
    try {
      const { data } = await api.get(`/owner/screens/${theaterId}`);
      setCurrentScreens(data.data);
    } catch (err) {
      toast.error('Failed to fetch screens.');
    }
  };

  const handleScheduleShow = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shows', {
        movie_id: formData.movie_id,
        screen_id: formData.screen_id,
        start_time: formData.start_time,
        price: formData.price,
        total_seats: formData.total_seats
      });
      toast.success('Show scheduled successfully with tiered pricing!');
      setIsModalOpen(false);
      setFormData({ movie_id: '', theater_id: '', screen_id: '', start_time: '', price: '', total_seats: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show.');
    }
  };

  const handleCreateTheater = async (e) => {
    e.preventDefault();
    try {
      // 1. Create Theater
      const theaterRes = await api.post('/owner/theaters', {
        name: theaterFormData.name,
        location: theaterFormData.location
      });
      const theaterId = theaterRes.data.id;

      // 2. Create Initial Screen
      await api.post('/owner/screens', {
        theater_id: theaterId,
        screen_name: theaterFormData.screen_name,
        total_seats: parseInt(theaterFormData.total_seats)
      });

      toast.success(`${theaterFormData.name} created with initial screen!`);
      setIsTheaterModalOpen(false);
      setTheaterFormData({ name: '', location: '', screen_name: '', total_seats: '' });
      fetchTheatersAndMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create theater or screen.');
    }
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owner/screens', {
        theater_id: screenFormData.theater_id,
        screen_name: screenFormData.screen_name,
        total_seats: parseInt(screenFormData.total_seats)
      });
      toast.success(`Screen ${screenFormData.screen_name} added successfully!`);
      setIsScreenModalOpen(false);
      setScreenFormData({ theater_id: '', screen_name: '', total_seats: '' });
      fetchTheatersAndMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add screen.');
    }
  };

  const handleCancelShow = async (id, movieTitle) => {
    if (!window.confirm(`Are you sure you want to cancel the show for "${movieTitle}"? All bookings will be marked as refunded.`)) {
      return;
    }

    try {
      await api.delete(`/shows/${id}`);
      toast.success('Show cancelled and tickets refunded.');
      fetchData(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel show.');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading owner panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Building2 className="text-indigo-600" /> Theater Owner Portal
        </h1>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">
          <ScanLine size={20} /> Verify Ticket QR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: Shows Occupancy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Presentation className="text-indigo-500" /> Live Screen Occupancy
              </h2>
            </div>

            {shows.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No upcoming shows scheduled.</p>
            ) : (
              <div className="space-y-4">
                {shows.map(show => {
                  const pct = Math.round((show.booked_seats / show.total_seats) * 100) || 0;
                  return (
                    <div key={show.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{show.movie_title}</h3>
                          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                            {show.theater_name} — {show.screen_name}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <button
                            onClick={() => handleCancelShow(show.id, show.movie_title)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                            title="Cancel Show"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                          <span>{pct}% Booked</span>
                          <span>{show.available_seats} / {show.total_seats} seats left</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                          <div className="bg-green-500 h-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Admin controls & sales */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-green-500" /> Recent Daily Sales
            </h2>
            {sales.length === 0 ? (
              <p className="text-sm text-gray-500">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {sales.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-gray-500">{s.movie_title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{s.revenue}</p>
                      <p className="text-xs text-gray-500">{s.bookings} tickets</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Management</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsTheaterModalOpen(true)}
                className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition font-medium text-sm text-gray-700 hover:text-indigo-700"
              >
                <Building2 size={18} /> Manage Theaters (Create New)
              </button>
              <button
                onClick={() => {
                  if (theaters.length === 0) {
                    toast.error("Create a theater first!");
                    return;
                  }
                  setIsScreenModalOpen(true);
                }}
                className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition font-medium text-sm text-gray-700 hover:text-indigo-700"
              >
                <Presentation size={18} /> Add New Screen
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition font-medium text-sm text-gray-700 hover:text-indigo-700"
              >
                <CalendarCheck size={18} /> Schedule Shows
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Properties</h2>
            {theaters.length === 0 ? (
              <p className="text-sm text-gray-500">No properties added yet.</p>
            ) : (
              <div className="space-y-3">
                {theaters.map((t) => (
                  <div key={t.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{t.screen_count} {t.screen_count === 1 ? 'Screen' : 'Screens'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Schedule Show Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Schedule New Show</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleScheduleShow} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Movie</label>
                <select
                  required
                  value={formData.movie_id}
                  onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Choose a movie...</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Theater</label>
                  <select
                    required
                    value={formData.theater_id}
                    onChange={(e) => handleTheaterChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Theater</option>
                    {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Screen</label>
                  <select
                    required
                    disabled={!formData.theater_id}
                    value={formData.screen_id}
                    onChange={(e) => setFormData({ ...formData, screen_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                  >
                    <option value="">Select Screen</option>
                    {currentScreens.map(s => <option key={s.id} value={s.id}>{s.screen_name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Seating Capacity (Optional)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="Leave empty to use screen default"
                  value={formData.total_seats}
                  onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">*Overrides the default total seats of the selected screen (Max 1000).</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Base Price (₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 250"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">*VIP and Gold tiers will automatically apply multipliers (1.5x / 1.2x)</p>
              </div>

              <button
                type="submit"
                disabled={!formData.start_time || new Date(formData.start_time) < new Date()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Show
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Theater Modal */}
      {isTheaterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Theater</h2>
              <button onClick={() => setIsTheaterModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleCreateTheater} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Theater Name</label>
                  <input
                    required
                    placeholder="e.g. IMAX Mumbai"
                    value={theaterFormData.name}
                    onChange={(e) => setTheaterFormData({ ...theaterFormData, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                  <input
                    required
                    placeholder="e.g. Worli, Mumbai"
                    value={theaterFormData.location}
                    onChange={(e) => setTheaterFormData({ ...theaterFormData, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-bold text-gray-800 mb-3">Initial Screen Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Screen Name</label>
                    <input
                      required
                      placeholder="e.g. Screen 1"
                      value={theaterFormData.screen_name}
                      onChange={(e) => setTheaterFormData({ ...theaterFormData, screen_name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Total Seats</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="e.g. 50"
                      value={theaterFormData.total_seats}
                      onChange={(e) => setTheaterFormData({ ...theaterFormData, total_seats: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg mt-4"
              >
                Create Theater
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Screen Modal */}
      {isScreenModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add New Screen</h2>
              <button onClick={() => setIsScreenModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleAddScreen} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Theater</label>
                <select
                  required
                  value={screenFormData.theater_id}
                  onChange={(e) => setScreenFormData({ ...screenFormData, theater_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Theater</option>
                  {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Screen Name</label>
                  <input
                    required
                    placeholder="e.g. Screen 2"
                    value={screenFormData.screen_name}
                    onChange={(e) => setScreenFormData({ ...screenFormData, screen_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Total Seats</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="e.g. 50"
                    value={screenFormData.total_seats}
                    onChange={(e) => setScreenFormData({ ...screenFormData, total_seats: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg mt-4"
              >
                Add Screen
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
