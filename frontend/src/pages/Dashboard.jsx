import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { Ticket, Gift, CreditCard, ChevronRight, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [giftCode, setGiftCode] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/user/bookings');
      setBookings(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setRedeemMsg('');
    try {
      const { data } = await api.post('/giftcard/redeem', { code: giftCode });
      setRedeemMsg({ type: 'success', text: data.message });
      setGiftCode('');
      // In a real app we might want to refresh user context entirely, but a page reload works for now to sync balance
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setRedeemMsg({ type: 'error', text: err.response?.data?.message || 'Failed to redeem.' });
    }
  };

  const handleCancelBooking = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this booking? If paid via Gift Card, the balance will be refunded instantly.')) return;

    try {
      const { data } = await api.delete(`/book/${id}`);
      toast.success(data.message || 'Booking cancelled successfully.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Wallet & Profile */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <CreditCard className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
            <h3 className="text-indigo-200 font-medium mb-1">Gift Card Balance</h3>
            <p className="text-4xl font-black mb-6">₹{user?.gift_card_balance || 0}</p>
            
            <form onSubmit={handleRedeem} className="relative z-10">
              <label className="text-xs text-indigo-200 font-bold uppercase tracking-widest mb-2 block">Redeem New Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={giftCode} 
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                  placeholder="ENTER-CODE" 
                  required
                  className="w-full bg-indigo-800/50 border border-indigo-400/30 rounded-xl px-4 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white uppercase"
                />
                <button type="submit" className="bg-white text-indigo-900 px-4 py-2 font-bold rounded-xl hover:bg-indigo-50 transition">
                  Add
                </button>
              </div>
              {redeemMsg && (
                <p className={`mt-2 text-sm font-medium ${redeemMsg.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                  {redeemMsg.text}
                </p>
              )}
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bookings */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
            <div className="flex items-center gap-2 mb-6">
              <Ticket className="text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-10 animate-pulse">Loading previous bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Ticket className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>You have no movie bookings yet.</p>
                <Link to="/" className="text-indigo-600 font-semibold hover:underline mt-2 inline-block">Browse Movies</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <Link 
                    to={`/tickets/${booking.id}`} 
                    key={booking.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition group"
                  >
                    <img src={booking.poster_url} alt={booking.movie_title} className="w-16 h-24 object-cover rounded-lg shadow-sm" />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-700">{booking.movie_title}</h4>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(booking.start_time).toLocaleDateString()} • {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-sm text-gray-500">{booking.theater_name} — {booking.screen_name}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        Seats: <span className="text-indigo-600">{booking.seat_numbers}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 hidden sm:flex">
                      <ChevronRight className="text-gray-400 group-hover:text-indigo-600" />
                      {booking.status === 'confirmed' && new Date(booking.start_time) > new Date() && (
                        <button 
                          onClick={(e) => handleCancelBooking(e, booking.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition flex items-center gap-1"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
