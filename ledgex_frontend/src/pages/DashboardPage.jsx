import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import {
  Activity, TrendingUp, TrendingDown, DollarSign,
  Sparkles, AlertCircle, CheckCircle, Lightbulb, Target, BarChart3, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { getCategoryHexColor } from '../utils/colors';

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState({
    overview: null,
    budget: [],
    savings: [],
    health: null,
    insights: null,
    monthlyTrend: [],
    categorySpending: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const params = { month: selectedMonth, year: selectedYear };
        const [
          overviewRes,
          budgetRes,
          savingsRes,
          healthRes,
          insightsRes,
          monthlyTrendRes,
          categorySpendingRes
        ] = await Promise.all([
          api.get('analytics/overview', { params }).catch(() => ({ data: { data: { totalIncome: 0, totalExpense: 0, netBalance: 0, totalTransactions: 0, monthlyData: [] } } })),
          api.get('analytics/budget-vs-actual', { params }).catch(() => ({ data: { data: [] } })),
          api.get('savings-goals', { params }).catch(() => ({ data: { data: [] } })),
          api.get('analytics/financial-health-score', { params }).catch(() => ({ data: { data: { score: 0 } } })),
          api.get('ai/financial-insights', { params }).catch(() => ({ data: { data: { topInsight: 'No insights available', recommendations: [], warnings: [], achievements: [] } } })),
          api.get('analytics/monthly-trend', { params }).catch(() => ({ data: { data: [] } })),
          api.get('analytics/spending-by-category', { params }).catch(() => ({ data: { data: [] } }))
        ]);

        setData({
          overview: overviewRes.data?.data || null,
          budget: Array.isArray(budgetRes.data?.data) ? budgetRes.data.data : (Array.isArray(budgetRes.data) ? budgetRes.data : []),
          savings: Array.isArray(savingsRes.data?.data) ? savingsRes.data.data : (Array.isArray(savingsRes.data) ? savingsRes.data : []),
          health: healthRes.data?.data || healthRes.data || null,
          insights: insightsRes.data?.data || insightsRes.data || null,
          monthlyTrend: Array.isArray(monthlyTrendRes.data?.data) ? monthlyTrendRes.data.data : (Array.isArray(monthlyTrendRes.data) ? monthlyTrendRes.data : []),
          categorySpending: Array.isArray(categorySpendingRes.data?.data) ? categorySpendingRes.data.data : (Array.isArray(categorySpendingRes.data) ? categorySpendingRes.data : [])
        });
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Chart data extraction - Using realistic fallbacks so charts render beautifully if backend data is empty
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthlyData = data.monthlyTrend?.length ? data.monthlyTrend.map(t => ({
    month: typeof t.month === 'number' ? monthNames[(t.month - 1) % 12] : t.month,
    income: typeof t.income === 'object' ? (t.income?.amount || t.income?.value || 0) : (t.income || 0),
    expense: typeof t.expense === 'object' ? (t.expense?.amount || t.expense?.value || 0) : (t.expense || 0)
  })) : [];

  const spendingByCategory = data.categorySpending?.length ? data.categorySpending.map(item => ({
    name: item.category,
    value: item.totalAmount
  })) : [];

  const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.value, 0);


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700 transition-colors duration-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
            Welcome back, <span className="text-emerald-600 dark:text-emerald-500">{user?.firstName || 'User'}</span>!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">{currentDate}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-colors duration-200">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Health Score: {typeof data.health?.score === 'object' ? (data.health.score?.value || String(data.health.score)) : (data.health?.score ?? 'N/A')}
          </span>
        </div>
      </div>

      {/* 2. Summary Cards Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center transition-colors duration-200">
          <Calendar className="w-5 h-5 mr-2 text-emerald-500" />
          {monthNamesFull[selectedMonth - 1]} {selectedYear} Overview
        </h2>
        <div className="flex space-x-3 mt-3 sm:mt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-2 text-sm font-medium shadow-sm outline-none transition-colors duration-200"
          >
            {monthNamesFull.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-2 text-sm font-medium shadow-sm outline-none transition-colors duration-200"
          >
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Financial Health"
          value={typeof data.health?.score === 'object' ? (data.health.score?.value || String(data.health.score)) : (data.health?.score ?? '0')}
          icon={<Activity className="text-blue-500" />}
          bg="bg-blue-50"
        />
        <SummaryCard
          title="Total Income"
          value={formatCurrency(data.overview?.totalIncome)}
          icon={<TrendingUp className="text-emerald-500" />}
          bg="bg-emerald-50"
        />
        <SummaryCard
          title="Total Expense"
          value={formatCurrency(data.overview?.totalExpense)}
          icon={<TrendingDown className="text-red-500" />}
          bg="bg-red-50"
        />
        <SummaryCard
          title="Net Balance"
          value={formatCurrency(data.overview?.netBalance)}
          icon={<DollarSign className="text-purple-500" />}
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 5. Analytics Charts - Income vs Expense */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
              <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
              Income vs Expense
            </h2>
            <div className="h-72 min-w-0 w-full overflow-hidden">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#d1d5db' : '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} tick={{ fill: theme === 'dark' ? '#d1d5db' : '#6b7280' }} />
                    <RechartsTooltip 
                      cursor={{ fill: theme === 'dark' ? '#374151' : '#f3f4f6' }} 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#f3f4f6', color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      itemStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">
                  No monthly trend data available.
                </div>
              )}
            </div>
          </div>

          {/* 3. Budget Overview Section */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
              <Target className="w-5 h-5 mr-2 text-emerald-500" />
              Budget Overview
            </h2>
            <div className="space-y-5">
              {data.budget?.length > 0 ? data.budget.map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">
                      {typeof b.category === 'object' ? (b.category?.name || b.category?.title || String(b.category)) : (b.category || 'Unknown')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(b.actualSpent)}</span> / {formatCurrency(b.budgetLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 transition-colors duration-200">
                    <div
                      className={`h-2.5 rounded-full ${b.utilizationPercentage > 90 ? 'bg-red-500' : b.utilizationPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(b.utilizationPercentage || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400 transition-colors duration-200">{b.utilizationPercentage}% used</div>
                </div>
              )) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 transition-colors duration-200">No budget data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Side Area (Span 1) */}
        <div className="space-y-6">
          {/* 5. Spending by Category Pie Chart */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 transition-colors duration-200">Spending by Category</h2>
            <div className="flex flex-col">
              {spendingByCategory.length > 0 ? (
                <>
                  <div className="h-64 min-w-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {spendingByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getCategoryHexColor(entry.name)} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#f3f4f6', color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                          itemStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 mt-6">
                    {spendingByCategory.map((entry, index) => {
                      const percentage = totalSpending > 0 ? Math.round((entry.value / totalSpending) * 100) : 0;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center min-w-0 mr-3">
                            <span className="w-3 h-3 rounded-full mr-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: getCategoryHexColor(entry.name) }}></span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate transition-colors duration-200">{entry.name}</span>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(entry.value)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors duration-200">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                  No category spending data available.
                </div>
              )}
            </div>
          </div>

          {/* 4. Savings Goals Section */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
              Savings Goals
            </h2>
            <div className="space-y-5">
              {data.savings?.length > 0 ? data.savings.map((s, i) => {
                const percent = Math.min(((s.savedAmount / s.targetAmount) * 100) || 0, 100);
                return (
                  <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors duration-200">
                        {typeof s.name === 'object' ? (s.name?.name || s.name?.title || String(s.name)) : s.name}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full transition-colors duration-200">
                        {typeof s.status === 'object' ? (s.status?.name || s.status?.value || String(s.status)) : (s.status || 'Active')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium transition-colors duration-200">{formatCurrency(s.savedAmount)}</span>
                      <span className="text-gray-500 dark:text-gray-400 transition-colors duration-200">Target: {formatCurrency(s.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 transition-colors duration-200">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 transition-colors duration-200">No active savings goals.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. AI Insights Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200">
        <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-400 mb-6 flex items-center transition-colors duration-200">
          <Sparkles className="w-6 h-6 mr-2 text-emerald-600 dark:text-emerald-400" />
          AI Financial Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-emerald-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center transition-colors duration-200">
              <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
              Top Insight
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-200">
              {typeof data.insights?.topInsight === 'object'
                ? (data.insights.topInsight?.message || data.insights.topInsight?.text || String(data.insights.topInsight))
                : (data.insights?.topInsight || "Your spending is on track. Keep it up!")}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-emerald-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center transition-colors duration-200">
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
              Recommendations
            </h3>
            <ul className="space-y-2">
              {data.insights?.recommendations?.length > 0 ? (
                data.insights.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200">
                      {typeof r === 'object' ? (r?.message || r?.text || r?.insight || String(r)) : r}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">No recommendations at this time.</li>
              )}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-red-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <h3 className="font-semibold text-red-800 dark:text-red-400 mb-3 flex items-center transition-colors duration-200">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Warnings
            </h3>
            <ul className="space-y-2">
              {data.insights?.warnings?.length > 0 ? (
                data.insights.warnings.map((w, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200">
                      {typeof w === 'object' ? (w?.message || w?.text || w?.insight || String(w)) : w}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">No warnings! Your finances look healthy.</li>
              )}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center transition-colors duration-200">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Achievements
            </h3>
            <ul className="space-y-2">
              {data.insights?.achievements?.length > 0 ? (
                data.insights.achievements.map((a, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200">
                      {typeof a === 'object' ? (a?.message || a?.text || a?.insight || String(a)) : a}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">Keep using LedgeX to earn achievements.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, trendUp, bg }) {
  // Convert standard light mode bg variants to dark mode variants
  const darkBg = bg.replace('-50', '-900/20');
  
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-all hover:-translate-y-1 duration-200">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors duration-200">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium transition-colors duration-200 ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {trend} from last month
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl ${bg} dark:${darkBg} transition-colors duration-200`}>
        {icon}
      </div>
    </div>
  );
}
