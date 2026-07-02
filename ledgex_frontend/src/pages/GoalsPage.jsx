import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import {
  Target, TrendingUp, Plus, Trash2, Edit2,
  CheckCircle2, XCircle, AlertCircle, Calendar,
  IndianRupee, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Current Goal for operations
  const [currentGoal, setCurrentGoal] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', targetAmount: '', targetDate: '', status: 'IN_PROGRESS' });
  const [contributeAmount, setContributeAmount] = useState('');

  // Filters / Sorting
  const [sortBy, setSortBy] = useState('date_asc');

  const fetchGoalsAndSummary = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        api.get('/savings-goals'),
        api.get('/savings-goals/summary')
      ]);
      setGoals(goalsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load savings goals');
      toast.error('Failed to load savings goals');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndSummary(true);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getDaysRemainingText = (targetDateStr, status) => {
    if (status === 'COMPLETED') return 'Achieved';
    if (status === 'CANCELLED') return 'Cancelled';

    const targetDate = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} days remaining`;
    if (diffDays === 0) return `Due today`;
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  const isOverdue = (targetDateStr, status) => {
    if (status === 'COMPLETED' || status === 'CANCELLED') return false;
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  // Sort logic
  const sortedGoals = useMemo(() => {
    let sorted = [...goals];
    switch (sortBy) {
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
        break;
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.targetDate) - new Date(a.targetDate));
        break;
      case 'progress_asc':
        sorted.sort((a, b) => (a.progressPercentage || 0) - (b.progressPercentage || 0));
        break;
      case 'progress_desc':
        sorted.sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0));
        break;
      case 'status':
        const statusOrder = { 'IN_PROGRESS': 1, 'COMPLETED': 2, 'CANCELLED': 3 };
        sorted.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
        break;
      default:
        break;
    }
    return sorted;
  }, [goals, sortBy]);

  // Handlers
  const handleOpenAdd = () => {
    setFormData({ name: '', targetAmount: '', targetDate: '', status: 'IN_PROGRESS' });
    setCurrentGoal(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      status: goal.status
    });
    setCurrentGoal(goal);
    setIsAddEditModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (currentGoal) {
        await api.put(`/savings-goals/${currentGoal.id}`, formData);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/savings-goals', formData);
        toast.success('Goal created successfully');
      }
      setIsAddEditModalOpen(false);
      fetchGoalsAndSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save goal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenContribute = (goal) => {
    setContributeAmount('');
    setCurrentGoal(goal);
    setIsContributeModalOpen(true);
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post(`/savings-goals/${currentGoal.id}/contribute`, {
        amount: parseFloat(contributeAmount)
      });
      setIsContributeModalOpen(false);

      const updatedGoal = res.data?.data;
      if (updatedGoal && updatedGoal.status === 'COMPLETED' && currentGoal.status !== 'COMPLETED') {
        toast.success('🎉 Goal Achieved! Congratulations!', { duration: 5000, icon: '🎉' });
      } else {
        toast.success('Contribution added successfully');
      }

      fetchGoalsAndSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add contribution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (goal) => {
    setCurrentGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/savings-goals/${currentGoal.id}`);
      toast.success('Goal deleted successfully');
      setIsDeleteModalOpen(false);
      fetchGoalsAndSummary();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete goal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Savings Goals</h1>
          <p className="text-slate-500 mt-1">Track and manage your financial targets.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Saved</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.totalSavedAmount || 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Active Goals</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.activeGoals || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Completed</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.completedGoals || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Goals</h3>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.totalGoals || 0}</p>
        </div>
      </div>

      {/* Filters/Sorting */}
      <div className="flex justify-end w-full sm:justify-end">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-auto border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        >
          <option value="date_asc">Target Date (Earliest First)</option>
          <option value="date_desc">Target Date (Latest First)</option>
          <option value="progress_desc">Progress (High to Low)</option>
          <option value="progress_asc">Progress (Low to High)</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Goals Grid */}
      {sortedGoals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 px-6 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Savings Goals Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Set your financial targets and start tracking your savings progress today!
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGoals.map((goal) => {
            const percent = Math.min(goal.progressPercentage || 0, 100);
            const isCompleted = goal.status === 'COMPLETED';
            const isCancelled = goal.status === 'CANCELLED';
            const overdue = isOverdue(goal.targetDate, goal.status);

            const remaining = Math.max(0, goal.targetAmount - (goal.savedAmount || 0));

            return (
              <div key={goal.id} className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-2">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1" title={String(goal.name)}>{String(goal.name)}</h3>
                    <div className="flex items-center mt-1 text-sm text-slate-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  </div>
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-700' :
                    isCancelled ? 'bg-slate-100 text-slate-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {isCompleted ? 'Achieved' : isCancelled ? 'Cancelled' : 'In Progress'}
                  </span>
                </div>

                <div className="mt-2 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(goal.savedAmount)}</p>
                      <p className="text-sm text-slate-500">of {formatCurrency(goal.targetAmount)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {Math.round(percent)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-yellow-400' : 'bg-emerald-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Remaining & Days */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-6 flex-grow">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-slate-500 text-xs font-medium">Remaining</p>
                    <p className={`font-semibold ${remaining === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {formatCurrency(remaining)}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${overdue ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-slate-500'}`}>Timeline</p>
                    <p className={`font-semibold line-clamp-1 ${overdue ? 'text-red-700' : 'text-slate-800'}`} title={getDaysRemainingText(goal.targetDate, goal.status)}>
                      {getDaysRemainingText(goal.targetDate, goal.status)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenContribute(goal)}
                    disabled={isCompleted || isCancelled}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Contribute
                  </button>
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(goal)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">{currentGoal ? 'Edit Goal' : 'Create Goal'}</h3>
              <button onClick={() => setIsAddEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. New Car, Vacation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {currentGoal && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {isContributeModalOpen && currentGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <h3 className="text-lg font-bold text-slate-900">Add Contribution</h3>
              <button onClick={() => setIsContributeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleContribute} className="p-6">
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Goal: <span className="font-semibold text-slate-800">{String(currentGoal.name)}</span></p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Remaining to reach target:</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(Math.max(0, currentGoal.targetAmount - (currentGoal.savedAmount || 0)))}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Contribution Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-medium"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !contributeAmount}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl mx-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Savings Goal?</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{String(currentGoal.name)}</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
