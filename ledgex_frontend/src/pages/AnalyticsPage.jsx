import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity,
  BarChart3, Target, Wallet, CreditCard,
  AlertCircle, Lightbulb, AlertTriangle, ListFilter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getCategoryHexColor } from '../utils/colors';

const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [data, setData] = useState({
    overview: null,
    health: null,
    monthlyTrend: [],
    categorySpending: [],
    budget: [],
    savings: null,
    subscription: null
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [
        overviewRes,
        healthRes,
        monthlyTrendRes,
        categorySpendingRes,
        budgetRes,
        savingsRes,
        subscriptionRes
      ] = await Promise.all([
        api.get('analytics/overview', { params: { month: selectedMonth, year: selectedYear } }).catch(() => ({ data: { data: { totalIncome: 0, totalExpense: 0, netBalance: 0 } } })),
        api.get('analytics/financial-health-score', { params: { month: selectedMonth, year: selectedYear } }).catch(() => ({ data: { data: { score: 0 } } })),
        api.get('analytics/monthly-trend', { params: { year: selectedYear } }).catch(() => ({ data: { data: [] } })),
        api.get('analytics/spending-by-category', { params: { month: selectedMonth, year: selectedYear } }).catch(() => ({ data: { data: [] } })),
        api.get('analytics/budget-vs-actual', { params: { month: selectedMonth, year: selectedYear } }).catch(() => ({ data: { data: [] } })),
        api.get('analytics/savings-summary').catch(() => ({ data: { data: { totalSavedAmount: 0, totalTargetAmount: 0, overallSavingsProgressPercentage: 0 } } })),
        api.get('analytics/subscription-summary').catch(() => ({ data: { data: { monthlyEstimatedCost: 0, yearlyEstimatedCost: 0, activeSubscriptions: 0 } } }))
      ]);

      setData({
        overview: overviewRes.data?.data || null,
        health: healthRes.data?.data || healthRes.data || null,
        monthlyTrend: Array.isArray(monthlyTrendRes.data?.data) ? monthlyTrendRes.data.data : (Array.isArray(monthlyTrendRes.data) ? monthlyTrendRes.data : []),
        categorySpending: Array.isArray(categorySpendingRes.data?.data) ? categorySpendingRes.data.data : (Array.isArray(categorySpendingRes.data) ? categorySpendingRes.data : []),
        budget: Array.isArray(budgetRes.data?.data) ? budgetRes.data.data : (Array.isArray(budgetRes.data) ? budgetRes.data : []),
        savings: savingsRes.data?.data || null,
        subscription: subscriptionRes.data?.data || null
      });

    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

  const getHealthScorePrimitive = () => {
    return typeof data.health?.score === 'object' ? (data.health.score?.value || 0) : (data.health?.score || 0);
  };

  const getMonthlyTrendData = () => {
    return data.monthlyTrend?.length ? data.monthlyTrend.map(t => ({
      month: typeof t.month === 'number' ? monthNames[(t.month - 1) % 12] : t.month,
      income: typeof t.income === 'object' ? (t.income?.amount || t.income?.value || 0) : (t.income || 0),
      expense: typeof t.expense === 'object' ? (t.expense?.amount || t.expense?.value || 0) : (t.expense || 0)
    })) : [];
  };

  const getCategorySpendingData = () => {
    return data.categorySpending?.length ? data.categorySpending.map(item => ({
      name: item.category || 'Unknown',
      value: item.totalAmount || 0
    })) : [];
  };

  const monthlyTrendData = getMonthlyTrendData();
  const categorySpendingData = getCategorySpendingData().sort((a, b) => b.value - a.value);
  const totalSpending = categorySpendingData.reduce((sum, item) => sum + item.value, 0);

  // Derived Insights
  const highestCategory = categorySpendingData.length > 0 
    ? categorySpendingData[0] 
    : { name: 'None', value: 0 };

  const monthlySavings = monthlyTrendData.map(m => ({
    month: m.month,
    savings: m.income - m.expense
  }));
  const bestSavingMonth = monthlySavings.length > 0 
    ? monthlySavings.reduce((prev, current) => (prev.savings > current.savings) ? prev : current, monthlySavings[0]) 
    : { month: 'None', savings: 0 };

  const exceededBudgets = (data.budget || []).filter(b => (b.actualSpent || 0) > (b.budgetLimit || 0));

  const getHealthExplanation = (score) => {
    if (score >= 80) return "Excellent financial health. You maintain a strong balance of income, savings, and controlled expenses.";
    if (score >= 60) return "Good financial health. Your finances are stable, but there's room to optimize savings or reduce non-essential expenses.";
    if (score >= 40) return "Fair financial health. Monitor your budget closely and aim to increase your monthly savings rate.";
    return "Needs attention. Your expenses may be exceeding your income. Review your budgets immediately.";
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-gray-200 rounded-xl"></div>
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Filters - Compact */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Financial Analysis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Deep dive into your spending patterns and budgets</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="flex-1 md:flex-none bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-2 text-sm font-semibold outline-none transition-all cursor-pointer"
          >
            {monthNamesFull.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="flex-1 md:flex-none bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-2 text-sm font-semibold outline-none transition-all cursor-pointer"
          >
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-lg transition-colors border border-emerald-200 flex items-center justify-center disabled:opacity-50"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-sm">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Income" value={formatCurrency(data.overview?.totalIncome)} icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} bg="bg-emerald-100" />
        <KPICard title="Total Expense" value={formatCurrency(data.overview?.totalExpense)} icon={<TrendingDown className="w-6 h-6 text-red-600" />} bg="bg-red-100" />
        <KPICard title="Net Balance" value={formatCurrency(data.overview?.netBalance)} icon={<DollarSign className="w-6 h-6 text-purple-600" />} bg="bg-purple-100" />
        <KPICard title="Health Score" value={String(getHealthScorePrimitive())} icon={<Activity className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" />
      </div>

      {/* Row 2: Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[350px]">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
            Income vs Expense (Yearly Trend)
          </h2>
          <div className="flex-1 w-full">
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No trend data available for this year." />
            )}
          </div>
        </div>

        {/* Financial Insights */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-5 rounded-xl shadow-md text-white flex flex-col h-full min-h-[350px]">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-emerald-300" />
            Financial Insights
          </h2>
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1.5">Health Analysis</p>
              <p className="text-sm font-medium leading-relaxed">{getHealthExplanation(getHealthScorePrimitive())}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Top Spend</p>
                <p className="text-sm font-bold truncate" title={highestCategory.name}>{highestCategory.name}</p>
                <p className="text-lg font-extrabold text-emerald-300 mt-0.5">{formatCurrency(highestCategory.value)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Best Month</p>
                <p className="text-sm font-bold truncate">{bestSavingMonth.month !== 'None' ? bestSavingMonth.month : 'N/A'}</p>
                <p className="text-lg font-extrabold text-emerald-300 mt-0.5">{formatCurrency(bestSavingMonth.savings)}</p>
              </div>
            </div>

            {exceededBudgets.length > 0 ? (
              <div className="bg-red-500/20 rounded-lg p-3.5 backdrop-blur-sm border border-red-500/30">
                <p className="text-red-300 text-xs font-bold uppercase mb-1.5 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Action Needed
                </p>
                <p className="text-sm font-medium leading-snug text-red-100">
                  Budgets exceeded: <span className="font-bold text-white">{exceededBudgets.map(b => typeof b.category === 'object' ? (b.category?.name || b.category?.title) : b.category).join(', ')}</span>.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-500/20 rounded-lg p-3.5 backdrop-blur-sm border border-emerald-500/30">
                <p className="text-emerald-200 text-xs font-bold uppercase mb-1.5 flex items-center">
                  <Activity className="w-4 h-4 mr-1.5" /> On Track
                </p>
                <p className="text-sm font-medium leading-snug text-emerald-50">
                  Great job! You haven't exceeded any budgets this month.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Category Spending and Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Spending Analysis (Horizontal Bars) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <ListFilter className="w-5 h-5 mr-2 text-emerald-600" />
            Category Analysis
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[450px] custom-scrollbar">
            {categorySpendingData.length > 0 ? categorySpendingData.map((entry, index) => {
              const percentage = totalSpending > 0 ? ((entry.value / totalSpending) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="group">
                  <div className="flex justify-between items-end mb-1.5 text-sm">
                    <span className="font-semibold text-gray-700 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: getCategoryHexColor(entry.name) }}></span>
                      {entry.name}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(entry.value)}</span>
                      <span className="text-gray-500 font-medium ml-1.5 w-12 inline-block text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%`, backgroundColor: getCategoryHexColor(entry.name) }}
                    ></div>
                  </div>
                </div>
              );
            }) : <EmptyState message="No spending data available." />}
          </div>
        </div>

        {/* Budget Performance */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-emerald-600" />
            Detailed Budget Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar content-start">
            {data.budget?.length > 0 ? data.budget.map((b, i) => {
              const categoryName = typeof b.category === 'object' ? (b.category?.name || b.category?.title || String(b.category)) : (b.category || 'Unknown');
              const budgetLimit = b.budgetLimit || 0;
              const actualSpent = b.actualSpent || 0;
              const remaining = Math.max(budgetLimit - actualSpent, 0);
              const utilization = b.utilizationPercentage || 0;
              const overBudget = actualSpent > budgetLimit ? actualSpent - budgetLimit : 0;
              
              let progressColor = 'bg-emerald-500';
              let bgLight = 'bg-emerald-50';
              let borderLight = 'border-emerald-100';

              if (utilization > 100) { 
                progressColor = 'bg-red-500'; bgLight = 'bg-red-50'; borderLight = 'border-red-100'; 
              } else if (utilization >= 90) { 
                progressColor = 'bg-red-500'; bgLight = 'bg-red-50'; borderLight = 'border-red-100';
              } else if (utilization >= 70) { 
                progressColor = 'bg-amber-500'; bgLight = 'bg-amber-50'; borderLight = 'border-amber-100';
              }

              return (
                <div key={i} className={`border ${borderLight} rounded-xl p-4 ${bgLight} transition-all hover:shadow-sm`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-gray-800 truncate pr-2">{categoryName}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white shadow-sm whitespace-nowrap border border-gray-100 ${utilization > 100 ? 'text-red-600' : 'text-gray-600'}`}>
                      {utilization}% Used
                    </span>
                  </div>
                  
                  <div className="w-full bg-black/5 rounded-full h-2 mb-3.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium mb-0.5">Budget Limit</p>
                      <p className="font-bold text-gray-900">{formatCurrency(budgetLimit)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-0.5">Amount Spent</p>
                      <p className="font-bold text-gray-900">{formatCurrency(actualSpent)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-0.5">Remaining</p>
                      <p className="font-bold text-gray-900">{formatCurrency(remaining)}</p>
                    </div>
                    {overBudget > 0 && (
                      <div>
                        <p className="text-red-600 font-bold mb-0.5">Over Budget</p>
                        <p className="font-bold text-red-700">{formatCurrency(overBudget)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : <div className="col-span-full"><EmptyState message="No budgets set for this month." /></div>}
          </div>
        </div>
      </div>

      {/* Row 4: Savings and Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Summary */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-emerald-600" />
              Savings Goal Progress
            </h2>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Saved</p>
                <p className="text-3xl font-extrabold text-emerald-600">{formatCurrency(data.savings?.totalSavedAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Target</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(data.savings?.totalTargetAmount)}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3.5 mb-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 relative" 
                style={{ width: `${Math.min(data.savings?.overallSavingsProgressPercentage || 0, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-emerald-600">{Number(data.savings?.overallSavingsProgressPercentage || 0).toFixed(1)}% Completed</span>
              <span className="text-gray-500">{formatCurrency(Math.max((data.savings?.totalTargetAmount || 0) - (data.savings?.totalSavedAmount || 0), 0))} Remaining</span>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
             <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex-1 text-center min-w-[120px] shadow-sm">
               <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1.5">Active Goals</p>
               <p className="text-4xl font-black text-emerald-800">{data.savings?.activeGoals || 0}</p>
             </div>
             <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex-1 text-center min-w-[120px] shadow-sm">
               <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1.5">Completed</p>
               <p className="text-4xl font-black text-blue-800">{data.savings?.completedGoals || 0}</p>
             </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
            Subscription Summary
          </h2>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Monthly Cost</p>
                <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(data.subscription?.monthlyEstimatedCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Yearly Est.</p>
                <p className="text-lg font-bold text-gray-700">{formatCurrency(data.subscription?.yearlyEstimatedCost)}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center">
                <p className="text-xs font-bold uppercase tracking-wide mb-1.5 text-emerald-600">Active</p>
                <p className="text-3xl font-black">{data.subscription?.activeSubscriptions || 0}</p>
              </div>
              <div className={`flex-1 p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center ${data.subscription?.upcomingRenewalsCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${data.subscription?.upcomingRenewalsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Renewing</p>
                <p className="text-3xl font-black">{data.subscription?.upcomingRenewalsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}

function KPICard({ title, value, icon, bg }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate max-w-[150px] sm:max-w-[180px]">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${bg} flex-shrink-0`}>
        {icon}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px] text-gray-500 text-sm font-medium bg-gray-50 rounded-xl border border-dashed border-gray-300">
      {message}
    </div>
  );
}
