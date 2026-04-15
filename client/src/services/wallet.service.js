import api from '../lib/api';

export const walletService = {
  getBalance: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  addMoney: (amount) => api.post('/wallet/add', { amount }),
  withdraw: (amount) => api.post('/wallet/withdraw', { amount }),
};
