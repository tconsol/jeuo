import { useState } from 'react';
import Modal from '../common/Modal';
import { formatCurrency } from '../../utils';

export default function PaymentModal({ isOpen, onClose, amount, booking, onPay }) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('razorpay');

  const handlePay = async () => {
    setLoading(true);
    try {
      await onPay({ method, booking, amount });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="sm">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Payment Method</label>
          {['razorpay', 'wallet'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`w-full p-3 rounded-lg border text-left text-sm ${method === m ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
            >
              {m === 'razorpay' ? '💳 Razorpay (Cards, UPI, NetBanking)' : '👛 Wallet Balance'}
            </button>
          ))}
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Processing…' : `Pay ${formatCurrency(amount)}`}
        </button>
      </div>
    </Modal>
  );
}
