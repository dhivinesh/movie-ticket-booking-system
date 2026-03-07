import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Users, Film, Gift, BarChart4, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/admin/analytics');
      setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGiftCard = async () => {
    const code = window.prompt("Enter a unique code for the new gift card (e.g. SUMMER50):");
    if (!code) return;
    const valueStr = window.prompt("Enter the monetary value (e.g. 500):");
    if (!valueStr) return;
    
    try {
      await api.post('/admin/giftcards', { code: code.toUpperCase(), value: Number(valueStr) });
      toast.success(`Gift card ${code.toUpperCase()} created for ₹${valueStr}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create gift card.');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart4 className="text-indigo-600 h-8 w-8" />
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Control Panel</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Bookings" value={stats?.total_bookings || 0} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Total Revenue" value={`₹${stats?.total_revenue || 0}`} icon={BarChart4} color="bg-indigo-600" />
        <StatCard title="Registered Customers" value={stats?.total_customers || 0} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Movies" value={stats?.total_movies || 0} icon={Film} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simple Monthly Chart Representation */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Overview (Last 12 Months)</h2>
          {stats?.monthly?.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No revenue data available yet.</p>
          ) : (
            <div className="space-y-4">
              {stats?.monthly?.map((m) => {
                const maxRev = Math.max(...stats.monthly.map(x => Number(x.revenue)));
                const pct = Math.max(5, (Number(m.revenue) / maxRev) * 100);
                
                return (
                  <div key={m.month} className="flex items-center gap-4">
                    <span className="w-16 text-sm text-gray-600 font-medium">{m.month}</span>
                    <div className="flex-grow bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="w-20 text-right text-sm font-bold text-gray-900">₹{m.revenue}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition group">
              <Film className="text-indigo-500" />
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-indigo-700">Add New Movie</p>
                <p className="text-xs text-gray-500">Update catalog</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition group">
              <Users className="text-indigo-500" />
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-indigo-700">Manage Users</p>
                <p className="text-xs text-gray-500">Deactivate accounts</p>
              </div>
            </button>
            <button 
              onClick={handleGenerateGiftCard}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition group"
            >
              <Gift className="text-indigo-500" />
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-indigo-700">Generate Gift Card</p>
                <p className="text-xs text-gray-500">Create promo codes</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition group">
              <BarChart4 className="text-indigo-500" />
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-indigo-700">Transactions</p>
                <p className="text-xs text-gray-500">View all bookings</p>
              </div>
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 mt-6">(Management forms omitted for brevity in this MVP layout)</p>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
    </div>
    <div className={`p-4 rounded-2xl text-white ${color}`}>
      <Icon size={28} />
    </div>
  </div>
);
