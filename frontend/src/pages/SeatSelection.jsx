import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  
  const [seatsGrouped, setSeatsGrouped] = useState({});
  const [flatSeats, setFlatSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const { data } = await api.get(`/seats/${showId}`);
        setSeatsGrouped(data.data);
        setFlatSeats(data.flat);
      } catch (err) {
        setError('Failed to fetch seats.');
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
    
    // Auto-refresh every 10 seconds to show live availability
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [showId]);

  const toggleSeat = (seat) => {
    if (seat.status !== 'available') return;
    
    setSelectedSeats(prev => 
      prev.some(s => s.id === seat.id)
        ? prev.filter(s => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    // Pass selected seats via location state to Checkout
    navigate('/checkout', { state: { showId, selectedSeats } });
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading seating chart...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  const rows = Object.keys(seatsGrouped).sort();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-8 text-indigo-900 border-b pb-4">Select Your Seats</h2>
        
        {/* Screen curved representation */}
        <div className="mb-16">
          <div className="h-2 bg-gradient-to-r from-transparent via-indigo-300 to-transparent rounded-[50%] blur-[2px] opacity-70"></div>
          <div className="h-8 bg-gradient-to-t from-transparent to-indigo-50 border-t-2 border-indigo-200 mt-2 mx-auto rounded-t-[50%] flex items-center justify-center text-xs tracking-[0.5em] text-indigo-400 font-bold w-3/4">
            SCREEN
          </div>
        </div>

        {/* Seat Layout */}
        <div className="flex flex-col items-center gap-4 overflow-x-auto pb-4">
          {rows.map(row => (
            <div key={row} className="flex items-center gap-4">
              <span className="w-8 text-center text-sm font-bold text-gray-500">{row}</span>
              <div className="flex gap-2 sm:gap-3">
                {seatsGrouped[row].map(seat => {
                  const isSelected = selectedSeats.some(s => s.id === seat.id);
                  let seatClass = 'bg-gray-100 text-gray-400 cursor-not-allowed'; // Default to unavailable
                  
                  if (seat.status === 'available') {
                    if (isSelected) {
                      seatClass = 'bg-indigo-600 text-white shadow-md shadow-indigo-500/50 scale-110 !border-indigo-600';
                    } else {
                      // Tier based styling
                      if (seat.tier === 'VIP') seatClass = 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 hover:border-amber-600 cursor-pointer';
                      else if (seat.tier === 'Gold') seatClass = 'bg-slate-50 border-slate-400 text-slate-700 hover:bg-slate-100 hover:border-slate-600 cursor-pointer';
                      else seatClass = 'bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer';
                    }
                  } else if (seat.status === 'reserved') {
                    seatClass = 'bg-orange-200 text-orange-600 cursor-not-allowed';
                  }

                  return (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat)}
                      disabled={seat.status !== 'available'}
                      className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-semibold rounded-t-xl rounded-b sm:rounded-b-md border transition-all duration-200 flex items-center justify-center ${seatClass}`}
                      title={`${row}${seat.seat_num} - ${seat.status}`}
                    >
                      {seat.seat_num}
                    </button>
                  );
                })}
              </div>
              <span className="w-8 text-center text-sm font-bold text-gray-500">{row}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-t bg-amber-50 border border-amber-400"></div>
            <span className="text-xs text-gray-600 font-medium">VIP (1.5x)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-t bg-slate-50 border border-slate-400"></div>
            <span className="text-xs text-gray-600 font-medium">Gold (1.2x)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-t bg-white border border-gray-200"></div>
            <span className="text-xs text-gray-600 font-medium">Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-t bg-indigo-600 border border-indigo-600"></div>
            <span className="text-xs text-gray-600 font-medium">Selected</span>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                ({selectedSeats.length} Seats) • <span className="font-bold text-gray-900 text-lg">Total: ₹{
                  selectedSeats.reduce((sum, s) => sum + (parseFloat(s.base_price) * parseFloat(s.price_multiplier)), 0).toFixed(2)
                }</span>
              </p>
              <div className="flex flex-wrap gap-1 max-w-[250px] sm:max-w-xl">
                {selectedSeats.map(s => (
                  <span key={s.id} className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                    {s.row_label}{s.seat_num} 
                    <span className="opacity-60 font-normal">({s.tier}: ₹{(parseFloat(s.base_price) * parseFloat(s.price_multiplier)).toFixed(0)})</span>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleProceed}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
