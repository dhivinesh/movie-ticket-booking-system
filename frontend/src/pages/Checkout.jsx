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

  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Calculate total precisely from the state passed
    const total = selectedSeats.reduce((sum, s) => sum + (parseFloat(s.base_price) * parseFloat(s.price_multiplier)), 0);
    setTotalPrice(total);
  }, [selectedSeats]);

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
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold">Booking Summary</h3>
            <span className="text-indigo-600 font-bold text-lg">Total: ₹{totalPrice.toFixed(2)}</span>
          </div>
          
          <div className="space-y-3">
            {selectedSeats.map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold w-12 text-center border border-indigo-100">
                    {s.row_label}{s.seat_num}
                  </span>
                  <span className="text-gray-600 font-medium">{s.tier} Class</span>
                </div>
                <span className="font-bold text-gray-900">
                  ₹{s.base_price} x {s.price_multiplier} = ₹{(parseFloat(s.base_price) * parseFloat(s.price_multiplier)).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Final Bill</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">{selectedSeats.length} Tickets Total</span>
              <span className="text-2xl font-black text-gray-900">₹{totalPrice.toFixed(0)}</span>
            </div>
          </div>
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

            <label className={`cursor-pointer flex items-center p-4 border rounded-xl transition-colors ${
              user?.gift_card_balance < totalPrice ? 'opacity-50 cursor-not-allowed bg-gray-50' :
              paymentMethod === 'gift_card' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'hover:bg-gray-50'
            }`}>
              <input 
                type="radio" name="payment" value="gift_card" 
                disabled={user?.gift_card_balance < totalPrice}
                checked={paymentMethod === 'gift_card'} 
                onChange={() => setPaymentMethod('gift_card')} 
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-4 flex items-center justify-between flex-grow">
                <div>
                  <span className="block font-bold mt-1">Pay with Gift Card Wallet</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-sm ${user?.gift_card_balance >= totalPrice ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}`}>
                      Balance: ₹{user?.gift_card_balance || 0}
                    </span>
                    {user?.gift_card_balance < totalPrice && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">Insufficient</span>
                    )}
                  </div>
                </div>
                <Gift className={user?.gift_card_balance >= totalPrice ? 'text-indigo-500' : 'text-gray-400'} size={28} />
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
