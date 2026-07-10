import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import {
  Plus, Trash2, Edit2, AlertCircle, Calendar,
  CreditCard, Search, Repeat, CalendarDays,
  XCircle, CheckCircle2, ShieldCheck, ShieldAlert,
  Wallet, IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Current Subscription for operations
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    billingCycle: 'MONTHLY',
    nextBillingDate: '',
    isActive: true
  });

  // Filters / Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCycle, setFilterCycle] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('next_renewal');

  const fetchSubscriptionsAndSummary = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [subsRes, summaryRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/subscriptions/summary')
      ]);
      setSubscriptions(subsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscriptions');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionsAndSummary(true);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getDaysUntilBilling = (targetDateStr) => {
    if (!targetDateStr) return 9999;
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBadgeStyle = (days) => {
    if (days < 0) return 'bg-red-100 text-red-700 border border-red-200'; // Overdue
    if (days === 0) return 'bg-red-100 text-red-700 border border-red-200';
    if (days <= 7) return 'bg-amber-100 text-amber-700 border border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  };

  const getBadgeText = (days) => {
    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return 'Renews Today';
    if (days === 1) return 'Renews Tomorrow';
    return `Renews in ${days} days`;
  };

  // Calculate upcoming renewals (next 30 days) from active subscriptions
  const upcomingRenewalsCount = useMemo(() => {
    return subscriptions.filter(sub => {
      if (!sub.isActive) return false;
      const days = getDaysUntilBilling(sub.nextBillingDate);
      return days >= 0 && days <= 30;
    }).length;
  }, [subscriptions]);

  // Filter and Sort logic
  const filteredAndSortedSubs = useMemo(() => {
    let result = [...subscriptions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name?.toLowerCase().includes(query) || s.category?.toLowerCase().includes(query));
    }

    // Cycle filter
    if (filterCycle !== 'ALL') {
      result = result.filter(s => s.billingCycle === filterCycle);
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      const isStatusActive = filterStatus === 'ACTIVE';
      result = result.filter(s => s.isActive === isStatusActive);
    }

    // Sort
    switch (sortBy) {
      case 'next_renewal':
        result.sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate));
        break;
      case 'cost_desc':
        result.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'cost_asc':
        result.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        break;
    }
    return result;
  }, [subscriptions, searchQuery, filterCycle, filterStatus, sortBy]);

  const getCategoryColor = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('entertainment') || cat.includes('music') || cat.includes('movie')) return 'bg-fuchsia-100 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:border-fuchsia-800';
    if (cat.includes('health') || cat.includes('gym') || cat.includes('fitness')) return 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800';
    if (cat.includes('software') || cat.includes('tech') || cat.includes('app')) return 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800';
    if (cat.includes('shopping') || cat.includes('ecommerce')) return 'bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800';
    if (cat.includes('food') || cat.includes('dining') || cat.includes('grocery')) return 'bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800';
    if (cat.includes('news') || cat.includes('read') || cat.includes('book')) return 'bg-cyan-100 border-cyan-200 dark:bg-cyan-900/30 dark:border-cyan-800';
    if (cat.includes('utility') || cat.includes('bill') || cat.includes('internet')) return 'bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800';
    
    // Hash fallback
    const colors = [
      'bg-rose-100 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800',
      'bg-violet-100 border-violet-200 dark:bg-violet-900/30 dark:border-violet-800',
      'bg-teal-100 border-teal-200 dark:bg-teal-900/30 dark:border-teal-800',
      'bg-lime-100 border-lime-200 dark:bg-lime-900/30 dark:border-lime-800',
      'bg-sky-100 border-sky-200 dark:bg-sky-900/30 dark:border-sky-800'
    ];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
      hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      billingCycle: 'MONTHLY',
      nextBillingDate: '',
      isActive: true
    });
    setCurrentSubscription(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setFormData({
      name: sub.name || '',
      amount: sub.amount || '',
      category: sub.category || '',
      billingCycle: sub.billingCycle || 'MONTHLY',
      nextBillingDate: sub.nextBillingDate || '',
      isActive: sub.isActive !== undefined ? sub.isActive : true
    });
    setCurrentSubscription(sub);
    setIsAddEditModalOpen(true);
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (currentSubscription) {
        await api.put(`/subscriptions/${currentSubscription.id}`, payload);
        toast.success('Subscription updated successfully');
      } else {
        await api.post('/subscriptions', payload);
        toast.success('Subscription added successfully');
      }
      setIsAddEditModalOpen(false);
      fetchSubscriptionsAndSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (sub) => {
    setCurrentSubscription(sub);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/subscriptions/${currentSubscription.id}`);
      toast.success('Subscription deleted successfully');
      setIsDeleteModalOpen(false);
      fetchSubscriptionsAndSummary();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subscription');
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
      <PageHeader
        title="Subscriptions"
        subtitle="Manage your recurring payments and services."
        action={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Subscription
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Active Subscriptions</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors duration-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{summary?.activeSubscriptions || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Monthly Cost</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors duration-200">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{formatCurrency(summary?.monthlyEstimatedCost || 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Yearly Cost</h3>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors duration-200">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{formatCurrency(summary?.yearlyEstimatedCost || 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors duration-200">Upcoming Renewals</h3>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg transition-colors duration-200">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{upcomingRenewalsCount}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-200">Next 30 days</p>
        </div>
      </div>

      {/* Filters/Sorting */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-center transition-colors duration-200">
        <div className="relative w-full lg:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors duration-200"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1 justify-end">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors duration-200"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          
          <select
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors duration-200"
          >
            <option value="ALL">All Cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="DAILY">Daily</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors duration-200"
          >
            <option value="next_renewal">Next Renewal First</option>
            <option value="cost_desc">Cost (High to Low)</option>
            <option value="cost_asc">Cost (Low to High)</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      {filteredAndSortedSubs.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 py-16 px-6 text-center transition-colors duration-200">
          <div className="w-16 h-16 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
            <Repeat className="w-8 h-8 text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-200">No Subscriptions Found</h3>
          <p className="text-slate-500 dark:text-gray-400 max-w-sm mx-auto mb-6 transition-colors duration-200">
            {subscriptions.length === 0 
              ? "Keep track of your recurring services and never miss a payment." 
              : "No subscriptions match your current filters."}
          </p>
          {subscriptions.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedSubs.map((sub) => {
            const daysUntil = getDaysUntilBilling(sub.nextBillingDate);
            const badgeStyle = getBadgeStyle(daysUntil);
            const badgeText = getBadgeText(daysUntil);
            const cardColorClass = getCategoryColor(sub.category);

            return (
              <div key={sub.id} className={`${cardColorClass} rounded-2xl shadow-sm border p-6 flex flex-col ${!sub.isActive ? 'opacity-75 grayscale-[0.5]' : ''} hover:shadow-md transition-shadow`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-4 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white break-words transition-colors duration-200">{String(sub.name)}</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 transition-colors duration-200">{String(sub.category)}</p>
                  </div>
                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition-colors duration-200 ${sub.isActive ? 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'}`}>
                      {sub.isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 mb-6">
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-200">{formatCurrency(sub.amount)}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-medium transition-colors duration-200">/{sub.billingCycle.toLowerCase()}</p>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="grid grid-cols-1 gap-3 text-sm mb-6 flex-grow">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-white/40 dark:border-white/10 transition-colors duration-200">
                    <div className="flex items-center text-slate-700 dark:text-slate-300 transition-colors duration-200">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Next Billing</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white transition-colors duration-200">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {sub.isActive && (
                    <div className={`p-2.5 rounded-lg text-center font-medium text-xs dark:bg-opacity-20 dark:border-opacity-30 ${badgeStyle}`}>
                      {badgeText}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-900/10 dark:border-white/10 transition-colors duration-200">
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="flex-1 py-2 bg-white/60 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg font-medium transition-colors border border-white/40 dark:border-white/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenDelete(sub)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800/50"
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl mx-4 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-gray-800 transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">
                {currentSubscription ? 'Edit Subscription' : 'Add Subscription'}
              </h3>
              <button onClick={() => setIsAddEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveSubscription} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 transition-colors">Service Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors"
                  placeholder="e.g. Netflix, Spotify"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 transition-colors">Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors"
                    placeholder="199"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 transition-colors">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 transition-colors">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors"
                  placeholder="e.g. Entertainment, Utilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 transition-colors">Next Billing Date</label>
                <input
                  type="date"
                  required
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-colors"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                    Subscription is Active
                  </div>
                </label>
              </div>

              <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 dark:border-gray-800 transition-colors">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 font-medium transition-colors border border-transparent dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Save Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-xl mx-4 border border-slate-100 dark:border-gray-800 transition-colors">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors">Delete Subscription?</h3>
            <p className="text-slate-500 dark:text-gray-400 mb-6 transition-colors">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-gray-200">{String(currentSubscription.name)}</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 font-medium transition-colors border border-transparent dark:border-gray-700"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
