import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2, History, ShieldCheck, Send, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Interface for transactions
interface Transaction {
  _id: string;
  id?: string;
  date: string;
  createdAt?: string;
  amount: number;
  type: string;
  status: string;
}

type ActiveTab = 'deposit' | 'withdraw' | 'transfer';

const PaymentDashboard: React.FC = () => {
  const [balance, setBalance] = useState(250000);
  const [activeTab, setActiveTab] = useState<ActiveTab>('deposit');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Transfer state
  const [transferAmount, setTransferAmount] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/payments/history');
      if (response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(Number(depositAmount))) return;

    setIsProcessingDeposit(true);
    try {
      await api.post('/payments/deposit', { amount: Number(depositAmount) });
      setBalance(prev => prev + Number(depositAmount));
      setShowDepositSuccess(true);
      setDepositAmount('');
      toast.success('Deposit processed successfully!');
      await fetchTransactions();
      setTimeout(() => setShowDepositSuccess(false), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;

    setIsProcessingWithdraw(true);
    try {
      await api.post('/payments/withdraw', {
        amount: Number(withdrawAmount),
        destination: withdrawDestination
      });
      setBalance(prev => Math.max(0, prev - Number(withdrawAmount)));
      setWithdrawAmount('');
      setWithdrawDestination('');
      toast.success('Withdrawal request submitted!');
      await fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || !transferUserId) {
      toast.error('Please fill in amount and recipient');
      return;
    }

    setIsProcessingTransfer(true);
    try {
      await api.post('/payments/transfer', {
        amount: Number(transferAmount),
        destinationUserId: transferUserId
      });
      setBalance(prev => Math.max(0, prev - Number(transferAmount)));
      setTransferAmount('');
      setTransferUserId('');
      setTransferNote('');
      toast.success('Transfer completed successfully!');
      await fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  const tabClass = (t: ActiveTab) =>
    `flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
      activeTab === t
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center space-x-3">
          <Wallet className="w-10 h-10 text-blue-600" />
          <span>Financial Dashboard</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage your funds, deposits, and transaction history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Left Panel ─── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10">
              <p className="text-blue-200/80 font-medium tracking-wide uppercase text-sm mb-1">Available Balance</p>
              <h2 className="text-5xl font-bold tracking-tighter mb-8">
                ${balance.toLocaleString()}
              </h2>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`flex-1 backdrop-blur-md transition-colors py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold ${
                    activeTab === 'deposit' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex-1 backdrop-blur-md transition-colors py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold ${
                    activeTab === 'withdraw' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Forms Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl">
            {/* Tab Switch */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button className={tabClass('deposit')} onClick={() => setActiveTab('deposit')}>
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </button>
              <button className={tabClass('withdraw')} onClick={() => setActiveTab('withdraw')}>
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
              <button className={tabClass('transfer')} onClick={() => setActiveTab('transfer')}>
                <Send className="w-4 h-4" /> Transfer
              </button>
            </div>

            {/* ── Deposit Form ── */}
            {activeTab === 'deposit' && (
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <CreditCard className="inline w-4 h-4 mr-1" />Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="number"
                      required
                      min="1"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      placeholder="10,000"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Card Details (Mock)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Card Number — e.g. 4242 4242 4242 4242" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" placeholder="CVC" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isProcessingDeposit}
                  className="w-full mt-2 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
                >
                  {isProcessingDeposit ? (
                    <><Loader2 className="animate-spin w-5 h-5" /><span>Processing...</span></>
                  ) : showDepositSuccess ? (
                    <><CheckCircle2 className="w-5 h-5" /><span>Success!</span></>
                  ) : (
                    <><ShieldCheck className="w-5 h-5" /><span>Deposit Funds</span></>
                  )}
                </button>
              </form>
            )}

            {/* ── Withdraw Form ── */}
            {activeTab === 'withdraw' && (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="number"
                      required
                      min="1"
                      max={balance}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      placeholder="5,000"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Bank / Destination (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Chase Bank ****1234"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    value={withdrawDestination}
                    onChange={e => setWithdrawDestination(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isProcessingWithdraw}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
                >
                  {isProcessingWithdraw ? (
                    <><Loader2 className="animate-spin w-5 h-5" /><span>Processing...</span></>
                  ) : (
                    <><ArrowUpRight className="w-5 h-5" /><span>Withdraw Funds</span></>
                  )}
                </button>
              </form>
            )}

            {/* ── Transfer Form ── */}
            {activeTab === 'transfer' && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="number"
                      required
                      min="1"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      placeholder="25,000"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Recipient User ID
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Paste recipient's user ID here"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    value={transferUserId}
                    onChange={e => setTransferUserId(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Get the ID from the recipient's profile page</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Note (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Seed investment tranche 1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isProcessingTransfer}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-[0.98]"
                >
                  {isProcessingTransfer ? (
                    <><Loader2 className="animate-spin w-5 h-5" /><span>Transferring...</span></>
                  ) : (
                    <><Send className="w-5 h-5" /><span>Send Transfer</span></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Transaction History ─── */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden h-full">
            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-gray-500" />
                <span>Transaction History</span>
              </h3>
              <button
                onClick={fetchTransactions}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center text-gray-500 font-medium flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                Loading transactions...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
                      <th className="py-4 px-6 font-semibold text-sm text-gray-500 dark:text-gray-400">Date</th>
                      <th className="py-4 px-6 font-semibold text-sm text-gray-500 dark:text-gray-400">Type</th>
                      <th className="py-4 px-6 font-semibold text-sm text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="py-4 px-6 font-semibold text-sm text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions.length > 0 ? transactions.map((tx) => (
                      <tr key={tx._id || tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {new Date(tx.date || tx.createdAt || new Date()).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                          {tx.type || 'Transaction'}
                        </td>
                        <td className={`py-4 px-6 text-sm font-bold ${
                          tx.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}
                          {(tx.amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            tx.status === 'Completed' || tx.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : tx.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {tx.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-gray-500">
                          <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="font-medium">No transactions yet</p>
                          <p className="text-sm mt-1">Make a deposit to get started.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
