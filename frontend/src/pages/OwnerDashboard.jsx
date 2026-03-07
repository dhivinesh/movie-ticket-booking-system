import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Building2, Presentation, CalendarCheck, ScanLine, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const [shows, setShows] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [showsRes, salesRes] = await Promise.all([
          api.get('/owner/shows'),
          api.get('/owner/sales')
        ]);
        setShows(showsRes.data.data);
        setSales(salesRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateTheater = async () => {
    const name = window.prompt("Enter new Theater name:");
    if (!name) return;
    const location = window.prompt("Enter Theater location:");
    if (!location) return;

    try {
      await api.post('/owner/theaters', { name, location });
      toast.success(`${name} theater created successfully!`);
      // Optional: Refresh data here
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create theater.');
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
                        <div className="text-right">
                          <p className="text-sm font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {new Date(show.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
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
                      <p className="font-bold text-sm text-gray-900">{new Date(s.date).toLocaleDateString([], {month:'short', day:'numeric'})}</p>
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
                onClick={handleCreateTheater}
                className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition font-medium text-sm text-gray-700 hover:text-indigo-700"
              >
                <Building2 size={18} /> Manage Theaters (Create New)
              </button>
              <button className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition font-medium text-sm text-gray-700 hover:text-indigo-700">
                <CalendarCheck size={18} /> Schedule Shows
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
