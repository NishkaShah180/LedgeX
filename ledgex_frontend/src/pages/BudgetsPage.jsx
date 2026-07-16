import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Target, Wallet, TrendingDown } from 'lucide-react';
import { getCategoryBadgeClass } from '../utils/colors';
import PageHeader from '../components/PageHeader';

const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Transport', 'Utilities', 'Healthcare', 'Others'];

export default function BudgetsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [allBudgets, setAllBudgets] = useState([]);
  const [utilizations, setUtilizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    monthlyLimit: '',
    month: selectedMonth,
    year: selectedYear
  });
  const [formError, setFormError] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [budgetsRes, utilRes] = await Promise.all([
        api.get('/budgets'),
        api.get(`/budgets/utilization?month=${selectedMonth}&year=${selectedYear}`)
      ]);
      setAllBudgets(budgetsRes.data.data || []);
      setUtilizations(utilRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load budgets data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const handleOpenModal = (budget = null) => {
    setFormError('');
    if (budget) {
      setCurrentBudget(budget);
      setFormData({
        category: String(budget.category || ''),
        monthlyLimit: String(budget.monthlyLimit || ''),
        month: Number(budget.month),
        year: Number(budget.year)
      });
      if (!EXPENSE_CATEGORIES.includes(String(budget.category || ''))) {
        setShowCustomCategory(true);
      } else {
        setShowCustomCategory(false);
      }
    } else {
      setCurrentBudget(null);
      setFormData({
        category: 'Food',
        monthlyLimit: '',
        month: selectedMonth,
        year: selectedYear
      });
      setShowCustomCategory(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBudget(null);
  };

  const validateForm = () => {
    if (!formData.category.trim()) return 'Category is required';
    if (!formData.monthlyLimit || isNaN(formData.monthlyLimit) || Number(formData.monthlyLimit) <= 0) return 'Monthly limit must be greater than zero';
    if (!formData.month || formData.month < 1 || formData.month > 12) return 'Invalid month';
    if (!formData.year || formData.year < 2000 || formData.year > 2100) return 'Invalid year';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        category: String(formData.category).trim(),
        monthlyLimit: Number(formData.monthlyLimit),
        month: Number(formData.month),
        year: Number(formData.year)
      };

      if (currentBudget) {
        await api.put(`/budgets/${currentBudget.id}`, payload);
        toast.success('Budget updated successfully');
      } else {
        await api.post('/budgets', payload);
        toast.success('Budget created successfully');
      }
      
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (budget) => {
    setCurrentBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api.delete(`/budgets/${currentBudget.id}`);
      toast.success('Budget deleted successfully');
      setIsDeleteDialogOpen(false);
      setCurrentBudget(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    } finally {
      setIsSaving(false);
    }
  };

  const displayBudgets = useMemo(() => {
    const filtered = allBudgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
    
    return filtered.map(budget => {
      const categoryStr = String(budget.category || '');
      
      // Match utilization data for this specific month/year by category
      let util = utilizations.find(u => String(u.category || '') === categoryStr);
      
      const limit = Number(budget.monthlyLimit || 0);
      const spent = util ? Number(util.amountSpent || 0) : 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      const safePercentage = Math.min(percentage, 100);

      let status = 'ON_TRACK';
      if (percentage >= 90) status = 'OVER_BUDGET';
      else if (percentage >= 70) status = 'WARNING';

      return {
        ...budget,
        limit,
        spent,
        remaining,
        percentage,
        safePercentage,
        status,
        categoryStr
      };
    });
  }, [allBudgets, utilizations, selectedMonth, selectedYear]);

  const summary = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    displayBudgets.forEach(b => {
      totalBudget += b.limit;
      totalSpent += b.spent;
    });
    const remainingBudget = totalBudget - totalSpent;
    return { totalBudget, totalSpent, remainingBudget };
  }, [displayBudgets]);

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header & Filters */}
      <PageHeader
        title="Budgets"
        subtitle="Track and manage your spending limits"
        action={
          <>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 dark:text-gray-200 w-full sm:w-auto transition-colors duration-200"
              >
                {monthNames.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 dark:text-gray-200 w-24 transition-colors duration-200"
                min="2000"
                max="2100"
              />
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-1" />
              Add Budget
            </button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full transition-colors duration-200">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Total Budget</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{formatINR(summary.totalBudget)}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full transition-colors duration-200">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Total Spent</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{formatINR(summary.totalSpent)}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex items-center space-x-4 transition-colors duration-200">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full transition-colors duration-200">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Remaining Budget</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${summary.remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatINR(summary.remainingBudget)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-gray-400 transition-colors duration-200">Loading budgets...</p>
        </div>
      ) : displayBudgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 py-20 text-center transition-colors duration-200">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-full transition-colors duration-200">
              <Target className="w-12 h-12 text-slate-300 dark:text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors duration-200">No budgets for this period yet</h3>
              <p className="text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-200">Set up budgets to keep your spending on track for {monthNames[selectedMonth-1]} {selectedYear}.</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Budget
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBudgets.map((budget) => (
            <div key={budget.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getCategoryBadgeClass(budget.categoryStr)}`}>
                    {budget.categoryStr}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors duration-200">
                    {formatINR(budget.limit)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 transition-colors duration-200">{monthNames[budget.month-1]} {budget.year}</p>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleOpenModal(budget)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenDelete(budget)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-gray-400 font-medium transition-colors duration-200">Spent: {formatINR(budget.spent)}</span>
                  <span className={`font-semibold transition-colors duration-200 ${budget.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {budget.remaining >= 0 ? 'Left: ' : 'Over: '}{formatINR(Math.abs(budget.remaining))}
                  </span>
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden transition-colors duration-200">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      budget.status === 'OVER_BUDGET' ? 'bg-red-500' : 
                      budget.status === 'WARNING' ? 'bg-amber-500' : 
                      'bg-emerald-500'
                    }`} 
                    style={{ width: `${budget.safePercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">{budget.percentage.toFixed(0)}% Used</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 ${
                    budget.status === 'OVER_BUDGET' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50' : 
                    budget.status === 'WARNING' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50' : 
                    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                  }`}>
                    {budget.status === 'OVER_BUDGET' ? 'Over Budget' : budget.status === 'WARNING' ? 'Warning' : 'On Track'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-gray-800 transition-colors">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-gray-800 transition-colors">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">
                {currentBudget ? 'Edit Budget' : 'Add Budget'}
              </h2>
              <button 
                onClick={handleCloseModal}
                disabled={isSaving}
                className="p-2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
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
                    disabled={isSaving}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
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
                      disabled={isSaving}
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowCustomCategory(false);
                        setFormData({ ...formData, category: 'Food' });
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                      title="Back to predefined categories"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Monthly Limit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Month</label>
                  <select
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                    disabled={isSaving}
                  >
                    {monthNames.map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">Year</label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 sm:gap-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70 min-w-[120px]"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : currentBudget ? (
                    'Save Changes'
                  ) : (
                    'Create Budget'
                  )}
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Delete Budget?</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 transition-colors">
              Are you sure you want to delete the budget for <span className="font-medium text-slate-700 dark:text-gray-300">"{String(currentBudget?.category || '')}"</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3 sm:space-x-3 sm:gap-0">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isSaving}
                className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="w-full sm:flex-1 flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
