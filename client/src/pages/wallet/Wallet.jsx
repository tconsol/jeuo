import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiArrowUpRight, FiArrowDownLeft, FiCreditCard, FiX, FiCheck } from 'react-icons/fi';
import api from '../../lib/api';

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

function txnIcon(type) {
  return type === 'credit'
    ? <FiArrowDownLeft size={16} className="text-emerald-600" />
    : <FiArrowUpRight size={16} className="text-red-500" />;
}

export default function Wallet() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet/balance').then((r) => r.data.data),
  });

  const { data: txnData } = useQuery({
    queryKey: ['wallet-txns'],
    queryFn: () => api.get('/wallet/transactions').then((r) => r.data.data),
  });

  const addMoney = useMutation({
    mutationFn: (amt) => api.post('/wallet/add', { amount: amt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['wallet-txns'] });
      setShowAdd(false);
      setAmount('');
    },
  });

  const balance = walletData?.balance ?? 0;
  const transactions = txnData?.transactions || txnData || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

      {/* Header */}
      <h1 className="text-2xl font-black text-gray-900 mb-5">Wallet</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 mb-5 shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium mb-1">Available Balance</p>
          {isLoading ? (
            <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse mb-4" />
          ) : (
            <p className="text-4xl font-black text-white mb-4">₹{balance.toLocaleString('en-IN')}</p>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition active:scale-95 shadow-lg">
            <FiPlus size={16} /> Add Money
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-base font-black text-gray-900 mb-3">Transactions</h2>

        {!transactions.length ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-3">
              <FiCreditCard size={24} className="text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your wallet history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t, i) => (
              <motion.div key={t._id || i}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.type === 'credit' ? 'bg-emerald-50' : 'bg-red-50'
                }`}>
                  {txnIcon(t.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {t.description || (t.type === 'credit' ? 'Money added' : 'Payment')}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${
                  t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount || 0).toLocaleString('en-IN')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-black text-base">Add Money</h3>
                <button onClick={() => setShowAdd(false)}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition">
                  <FiX size={16} className="text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      min={1}
                      className="w-full pl-9 pr-4 py-3.5 border border-gray-200 rounded-2xl text-xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((a) => (
                    <button key={a} onClick={() => setAmount(String(a))}
                      className={`py-2 rounded-xl text-sm font-bold transition ${
                        amount === String(a)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      ₹{a}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => addMoney.mutate(+amount)}
                  disabled={!amount || +amount < 1 || addMoney.isPending}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {addMoney.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCheck size={16} />
                  )}
                  {addMoney.isPending ? 'Processing…' : `Add ₹${amount || 0}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
