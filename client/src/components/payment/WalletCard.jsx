import { formatCurrency } from '../../utils';

export default function WalletCard({ balance = 0, onAddMoney }) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
      <p className="text-sm opacity-80">Wallet Balance</p>
      <p className="text-3xl font-bold mt-1">{formatCurrency(balance)}</p>
      <button
        onClick={onAddMoney}
        className="mt-4 px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
      >
        + Add Money
      </button>
    </div>
  );
}
