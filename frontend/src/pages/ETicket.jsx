import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Download, Share2, MapPin, Calendar, Clock, Ticket } from 'lucide-react';

export default function ETicket() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/book/${bookingId}`);
        setBooking(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading e-ticket...</div>;
  if (!booking) return <div className="p-10 text-center text-red-500">Ticket not found or unauthorized.</div>;

  const dateObj = new Date(booking.start_time);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        
        {/* Left: Movie Info */}
        <div className="md:w-2/3 p-8 md:border-r border-dashed border-gray-300 relative">
          <div className="flex items-start justify-between mb-8">
            <div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Confirmed
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">{booking.movie_title}</h2>
              <p className="text-gray-500 font-medium">Booking ID: <span className="text-indigo-600">#{booking.id.toString().padStart(6, '0')}</span></p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Date & Time</p>
                <p className="text-lg font-bold text-gray-900">
                  {dateObj.toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Theater Location</p>
                <p className="text-lg font-bold text-gray-900">{booking.theater_name}</p>
                <p className="text-gray-500">{booking.location} — {booking.screen_name}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Seats</p>
                <p className="text-2xl font-black text-indigo-600 tracking-tight">{booking.seat_numbers}</p>
              </div>
            </div>
          </div>
          
          {/* Semi-circle cutouts for ticket effect */}
          <div className="hidden md:block absolute -right-4 top-0 bottom-0 my-auto h-8 w-8 bg-gray-50 rounded-full border-l border-gray-100"></div>
        </div>

        {/* Right: QR Code & Payment */}
        <div className="md:w-1/3 bg-gray-50 p-8 flex flex-col items-center justify-center relative">
          {/* Semi-circle cutout */}
          <div className="hidden md:block absolute -left-4 top-0 bottom-0 my-auto h-8 w-8 bg-gray-50 rounded-full border-r border-gray-100"></div>
          
          <img src={booking.qr_code} alt="QR Code" className="w-48 h-48 mb-6 p-2 bg-white rounded-2xl shadow-sm border border-gray-100" />
          
          <div className="text-center w-full">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Total Paid</p>
            <p className="text-3xl font-black text-gray-900">₹{booking.total_price}</p>
            <p className="text-xs text-gray-400 mt-2 uppercase">{booking.payment_method.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-sm transition">
          <Download size={20} /> Download PDF
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
