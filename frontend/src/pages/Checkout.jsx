import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, CreditCard, Gift, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mock_payment');
  const [showDetails, setShowDetails] = useState(null);

  // Fallback if accessed without selecting seats
  if (!state || !state.showId || !state.selectedSeats) {
    return <Navigate to="/" replace />;
  }

  const { showId, selectedSeats } = state;

  useEffect(() => {
    // Fetch show details specifically to calculate price reliably
    const fetchShowDetails = async () => {
      // In a real app we'd have a specific GET /shows/details endpoint,
      // here we know we just need price. Let's do a quick mock fetch if needed, 
      // but actually we don't return the show individual endpoint. We can rely on a fast GET request
      // We'll calculate it on the server, but for UI we need display price.
      // We will assume the frontend knows the price or fetch it. Since we didn't store price per seat in state previously...
      // wait, we can just fetch the seat list again or we could have passed it.
      // We'll fetch the booking API directly, which calculates the exact price.
      // But we want to show total in UI before paying. We can just use the user's gift card balance for UI purposes.
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const seatIds = selectedSeats.map(s => s.id);
      const { data } = await api.post('/book', {
        show_id: showId,
        seat_ids: seatIds,
        payment_method: paymentMethod
      });

      toast.success('Payment successful! Seats booked.');
      navigate(`/tickets/${data.booking.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Seats may have been taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white p-8 mb-6 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Checkout</h2>
        
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Selected Seats</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(s => (
              <span key={s.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold">
                {s.row_label}{s.seat_num}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Total of {selectedSeats.length} seats. The final price calculation happens securely on the server.
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Payment Method</h3>

          <div className="space-y-4">
            <label className={`cursor-pointer flex items-center p-4 border rounded-xl transition-colors ${paymentMethod === 'mock_payment' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'hover:bg-gray-50'}`}>
              <input 
                type="radio" name="payment" value="mock_payment" 
                checked={paymentMethod === 'mock_payment'} 
                onChange={() => setPaymentMethod('mock_payment')} 
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-4 flex items-center justify-between flex-grow">
                <div>
                  <span className="block font-bold mt-1">Standard Payment (Mock SDK)</span>
                  <span className="text-sm text-gray-500 block mt-0.5">Use credit/debit card or UPI (Simulated)</span>
                </div>
                <CreditCard className="text-gray-400" size={28} />
              </div>
            </label>

            <label className={`cursor-pointer flex items-center p-4 border rounded-xl transition-colors ${paymentMethod === 'gift_card' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'hover:bg-gray-50'}`}>
              <input 
                type="radio" name="payment" value="gift_card" 
                checked={paymentMethod === 'gift_card'} 
                onChange={() => setPaymentMethod('gift_card')} 
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-4 flex items-center justify-between flex-grow">
                <div>
                  <span className="block font-bold mt-1">Pay with Gift Card Wallet</span>
                  <span className={`text-sm block mt-0.5 ${user?.gift_card_balance > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    Available Balance: ₹{user?.gift_card_balance || 0}
                  </span>
                </div>
                <Gift className="text-gray-400" size={28} />
              </div>
            </label>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={24} /> Processing Securely...</>
          ) : (
            <>Secure Pay & Confirm <CheckCircle2 size={22} /></>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          <AlertCircle size={14} /> Transactions are atomic. Seats lock automatically.
        </p>
      </div>
    </div>
  );
}
