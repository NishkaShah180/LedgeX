import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { 
  Plus, Search, Edit2, Trash2, X, CheckCircle2, 
  AlertCircle, ArrowUpRight, ArrowDownRight, Wallet 
} from 'lucide-react';
import { getCategoryBadgeClass } from '../utils/colors';

const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Transport', 'Utilities', 'Healthcare', 'Others'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Bonus', 'Dividend', 'Interest', 'Rental Income', 'Cashback', 'Refund', 'Gift', 'Others'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('LATEST');

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    type: 'EXPENSE',
    transactionDate: new Date().toISOString().split('T')[0]
  });
  const [formError, setFormError] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenModal = (transaction = null) => {
    setFormError('');
    if (transaction) {
      setCurrentTransaction(transaction);
      setFormData({
        title: transaction.title,
        amount: transaction.amount.toString(),
        category: transaction.category,
        type: transaction.type,
        transactionDate: transaction.transactionDate
      });
      const predefined = transaction.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      if (!predefined.includes(transaction.category)) {
        setShowCustomCategory(true);
      } else {
        setShowCustomCategory(false);
      }
    } else {
      setCurrentTransaction(null);
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        type: 'EXPENSE',
        transactionDate: new Date().toISOString().split('T')[0]
      });
      setShowCustomCategory(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTransaction(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) return 'Amount must be greater than zero';
    if (!formData.category.trim()) return 'Category is required';
    if (!formData.transactionDate) return 'Transaction Date is required';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      };

      if (currentTransaction) {
        await api.put(`/transactions/${currentTransaction.id}`, payload);
        showToast('Transaction updated successfully', 'success');
      } else {
        await api.post('/transactions', payload);
        showToast('Transaction created successfully', 'success');
      }
      
      handleCloseModal();
      fetchTransactions();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save transaction', 'error');
    }
  };

  const handleOpenDelete = (transaction) => {
    setCurrentTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${currentTransaction.id}`);
      showToast('Transaction deleted successfully', 'success');
      setIsDeleteDialogOpen(false);
      setCurrentTransaction(null);
      fetchTransactions();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete transaction', 'error');
    }
  };

  // Computed state
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'ALL' || t.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.transactionDate);
        const dateB = new Date(b.transactionDate);
        return sortOrder === 'LATEST' ? dateB - dateA : dateA - dateB;
      });
  }, [transactions, searchQuery, filterType, sortOrder]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'INCOME') income += t.amount;
      if (t.type === 'EXPENSE') expense += t.amount;
    });
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense
    };
  }, [filteredTransactions]);

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border text-white transition-opacity duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-red-600 border-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-200">Transactions</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-200">Manage your income and expenses</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex justify-center items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-1" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full transition-colors duration-200">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Total Income</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-200">{formatINR(summary.totalIncome)}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full transition-colors duration-200">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Total Expense</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 transition-colors duration-200">{formatINR(summary.totalExpense)}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full transition-colors duration-200">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Net Balance</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${summary.netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {formatINR(summary.netBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Search, Filter, Sort */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 transition-colors duration-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200 text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-sm font-medium text-slate-700 dark:text-gray-200 transition-colors duration-200"
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-sm font-medium text-slate-700 dark:text-gray-200 transition-colors duration-200"
          >
            <option value="LATEST">Latest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors duration-200">
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-sm transition-colors duration-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-full transition-colors duration-200">
                        <Wallet className="w-12 h-12 text-slate-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors duration-200">No transactions found</h3>
                        <p className="text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-200">Get started by creating a new transaction to track your finances.</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Add Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] transition-colors duration-200">{transaction.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'INCOME' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      } transition-colors duration-200`}>
                        {transaction.type === 'INCOME' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-gray-400 transition-colors duration-200">
                      {new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold transition-colors duration-200 ${
                        transaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatINR(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(transaction)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(transaction)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-gray-800 transition-colors">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-gray-800 transition-colors">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">
                {currentTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center transition-colors">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: 'INCOME', category: 'Salary' });
                      setShowCustomCategory(false);
                    }}
                    className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                      formData.type === 'INCOME' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: 'EXPENSE', category: 'Food' });
                      setShowCustomCategory(false);
                    }}
                    className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                      formData.type === 'EXPENSE' 
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' 
                        : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Monthly Salary, Groceries"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Category</label>
                  {!showCustomCategory ? (
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'Others') {
                          setShowCustomCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                    >
                      {(formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Custom..."
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowCustomCategory(false);
                          setFormData({ ...formData, category: formData.type === 'INCOME' ? 'Salary' : 'Food' });
                        }}
                        className="px-3 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                        title="Back to predefined categories"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 sm:gap-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {currentTransaction ? 'Save Changes' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200 mx-4 border border-slate-100 dark:border-gray-800 transition-colors">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Delete Transaction?</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 transition-colors">
              Are you sure you want to delete <span className="font-medium text-slate-700 dark:text-gray-300">"{currentTransaction?.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3 sm:space-x-3 sm:gap-0">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex-1 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
