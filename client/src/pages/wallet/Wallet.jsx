import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../../services';
import { WalletCard } from '../../components/payment';
import { LoadingSpinner, EmptyState, Modal } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';

export default function Wallet() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');

  const { data: wallet, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: () => walletService.getBalance().then((r) => r.data.data) });
  const { data: txns } = useQuery({ queryKey: ['wallet-txns'], queryFn: () => walletService.getTransactions().then((r) => r.data.data) });

  const addMoney = useMutation({
    mutationFn: (amt) => walletService.addMoney(amt),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallet'] }); qc.invalidateQueries({ queryKey: ['wallet-txns'] }); setShowAdd(false); setAmount(''); },
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
      <WalletCard balance={wallet?.balance || 0} onAddMoney={() => setShowAdd(true)} />

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Transactions</h2>
        {!txns?.length ? (
          <EmptyState icon="💸" title="No transactions" description="Your wallet transactions will appear here." />
        ) : (
          <div className="space-y-2">
            {txns.map((t) => (
              <div key={t._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Money" size="sm">
        <div className="space-y-4">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min={1}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          <div className="flex gap-2">
            {[100, 500, 1000, 2000].map((a) => (
              <button key={a} onClick={() => setAmount(String(a))} className="px-3 py-1.5 text-xs rounded-full bg-gray-100 hover:bg-gray-200">
                {formatCurrency(a)}
              </button>
            ))}
          </div>
          <button onClick={() => addMoney.mutate(+amount)} disabled={!amount || addMoney.isPending}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50">
            {addMoney.isPending ? 'Processing…' : 'Add Money'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
