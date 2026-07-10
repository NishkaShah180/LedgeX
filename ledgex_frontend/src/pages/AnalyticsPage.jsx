import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { 
  RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity,
  BarChart3, Target, Wallet, CreditCard,
  AlertCircle, Lightbulb, AlertTriangle, ListFilter, Calendar, Info,
  ArrowRight, ArrowUpRight, ArrowDownRight, CircleCheck, CircleAlert, BadgeCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { getCategoryHexColor } from '../utils/colors';
import PageHeader from '../components/PageHeader';

const TIME_RANGES = {
  THIS_MONTH: { label: 'This Month', months: 1, offset: 0 },
  LAST_MONTH: { label: 'Last Month', months: 1, offset: 1 },
  LAST_3_MONTHS: { label: 'Last 3 Months', months: 3, offset: 0 },
  LAST_6_MONTHS: { label: 'Last 6 Months', months: 6, offset: 0 },
  LAST_12_MONTHS: { label: 'Last 12 Months', months: 12, offset: 0 },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('LAST_3_MONTHS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const cache = useRef({});

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (isRefresh) {
        cache.current = {}; // Clear cache on manual refresh
      }

      const rangeDef = TIME_RANGES[timeRange];
      const targetMonthsCount = rangeDef.months;
      const offset = rangeDef.offset || 0;

      const now = new Date();
      const currentPeriodPairs = [];
      for (let i = 0; i < targetMonthsCount; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset - i, 1);
        currentPeriodPairs.push({ month: d.getMonth() + 1, year: d.getFullYear(), date: d });
      }

      const prevPeriodPairs = [];
      for (let i = 0; i < targetMonthsCount; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset - targetMonthsCount - i, 1);
        prevPeriodPairs.push({ month: d.getMonth() + 1, year: d.getFullYear(), date: d });
      }

      const allPairs = [...currentPeriodPairs, ...prevPeriodPairs];

      const fetchWithCache = async (endpoint, m, y, fallback) => {
        const key = `${endpoint}_${y}_${m}`;
        if (cache.current[key]) return cache.current[key];
        try {
          const res = await api.get(endpoint, { params: { month: m, year: y } });
          const result = res.data?.data !== undefined ? res.data.data : (res.data || fallback);
          cache.current[key] = result;
          return result;
        } catch (e) {
          cache.current[key] = fallback;
          return fallback;
        }
      };

      if (!cache.current['all_transactions']) {
        const tRes = await api.get('/transactions').catch(() => ({ data: { data: [] } }));
        cache.current['all_transactions'] = tRes.data?.data || [];
      }
      if (!cache.current['savings_summary']) {
        const sRes = await api.get('/analytics/savings-summary').catch(() => ({ data: { data: null } }));
        cache.current['savings_summary'] = sRes.data?.data;
      }
      if (!cache.current['subscription_summary']) {
        const sRes = await api.get('/analytics/subscription-summary').catch(() => ({ data: { data: null } }));
        cache.current['subscription_summary'] = sRes.data?.data;
      }
      if (!cache.current['health_score']) {
        const hRes = await await api.get('/analytics/financial-health-score').catch(() => ({ data: { data: null } }));
        cache.current['health_score'] = hRes.data?.data;
      }

      // Fetch month-specific data concurrently
      await Promise.all(allPairs.map(async p => {
        await Promise.all([
          fetchWithCache('/analytics/overview', p.month, p.year, { totalIncome: 0, totalExpense: 0, netBalance: 0 }),
          fetchWithCache('/analytics/spending-by-category', p.month, p.year, []),
          fetchWithCache('/analytics/budget-vs-actual', p.month, p.year, [])
        ]);
      }));

      // Aggregate data
      const currentOverview = { totalIncome: 0, totalExpense: 0, netBalance: 0 };
      const prevOverview = { totalIncome: 0, totalExpense: 0, netBalance: 0 };
      const currentCategories = {};
      const prevCategories = {};
      const budgetHistory = [];
      const trendData = [];

      currentPeriodPairs.forEach(p => {
        const ov = cache.current[`/analytics/overview_${p.year}_${p.month}`];
        currentOverview.totalIncome += ov?.totalIncome || 0;
        currentOverview.totalExpense += ov?.totalExpense || 0;

        const cats = cache.current[`/analytics/spending-by-category_${p.year}_${p.month}`];
        (cats || []).forEach(c => {
          const name = c.category || 'Unknown';
          currentCategories[name] = (currentCategories[name] || 0) + (c.totalAmount || 0);
        });

        const buds = cache.current[`/analytics/budget-vs-actual_${p.year}_${p.month}`];
        budgetHistory.push({ month: p.month, year: p.year, budgets: buds || [] });

        trendData.unshift({
          period: `${p.date.toLocaleString('default', { month: 'short' })} ${p.year.toString().slice(2)}`,
          Income: ov?.totalIncome || 0,
          Expense: ov?.totalExpense || 0
        });
      });
      currentOverview.netBalance = currentOverview.totalIncome - currentOverview.totalExpense;

      prevPeriodPairs.forEach(p => {
        const ov = cache.current[`/analytics/overview_${p.year}_${p.month}`];
        prevOverview.totalIncome += ov?.totalIncome || 0;
        prevOverview.totalExpense += ov?.totalExpense || 0;

        const cats = cache.current[`/analytics/spending-by-category_${p.year}_${p.month}`];
        (cats || []).forEach(c => {
          const name = c.category || 'Unknown';
          prevCategories[name] = (prevCategories[name] || 0) + (c.totalAmount || 0);
        });
      });
      prevOverview.netBalance = prevOverview.totalIncome - prevOverview.totalExpense;

      const allTx = cache.current['all_transactions'];
      let startDate, endDate;
      
      if (currentPeriodPairs.length > 0) {
          const oldestDate = currentPeriodPairs[currentPeriodPairs.length - 1].date;
          startDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
          const newestDate = currentPeriodPairs[0].date;
          endDate = new Date(newestDate.getFullYear(), newestDate.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
          startDate = new Date(); endDate = new Date();
      }

      const currentTx = allTx.filter(t => {
        const d = new Date(t.transactionDate);
        return d >= startDate && d <= endDate;
      });

      setData({
        rangeDef,
        currentOverview, prevOverview,
        currentCategories, prevCategories,
        budgetHistory, trendData,
        currentTx,
        savings: cache.current['savings_summary'],
        subscription: cache.current['subscription_summary'],
        health: cache.current['health_score']
      });

    } catch (err) {
      console.error(err);
      setError('Failed to aggregate analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  
  const insights = useMemo(() => {
    if (!data) return null;
    const { currentOverview, prevOverview, currentCategories, prevCategories, budgetHistory, currentTx, health, savings, rangeDef } = data;

    // Changes
    const incDiff = currentOverview.totalIncome - prevOverview.totalIncome;
    const incPct = prevOverview.totalIncome > 0 ? (incDiff / prevOverview.totalIncome) * 100 : (currentOverview.totalIncome > 0 ? 100 : 0);
    const expDiff = currentOverview.totalExpense - prevOverview.totalExpense;
    const expPct = prevOverview.totalExpense > 0 ? (expDiff / prevOverview.totalExpense) * 100 : (currentOverview.totalExpense > 0 ? 100 : 0);
    const savDiff = currentOverview.netBalance - prevOverview.netBalance;
    const savPct = prevOverview.netBalance > 0 ? (savDiff / prevOverview.netBalance) * 100 : (currentOverview.netBalance > 0 ? 100 : 0);

    const catDiffs = Object.keys(currentCategories).map(c => {
      const curr = currentCategories[c];
      const prev = prevCategories[c] || 0;
      const diff = curr - prev;
      return { name: c, curr, prev, diff, pct: prev > 0 ? (diff / prev) * 100 : (curr > 0 ? 100 : 0) };
    }).sort((a, b) => b.curr - a.curr);

    // Biggest changes for highlights
    const topIncrease = [...catDiffs].sort((a, b) => b.diff - a.diff).find(c => c.diff > 0);
    const topDecrease = [...catDiffs].sort((a, b) => a.diff - b.diff).find(c => c.diff < 0);

    // Habits
    const expenses = currentTx.filter(t => t.type === 'EXPENSE');
    const largestPurchase = expenses.length ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0]) : null;
    const avgTxValue = expenses.length ? currentOverview.totalExpense / expenses.length : 0;
    
    const dailySpends = {};
    const catCounts = {};
    expenses.forEach(t => {
      const date = (t.transactionDate || '').split('T')[0];
      dailySpends[date] = (dailySpends[date] || 0) + t.amount;
      
      const cname = typeof t.category === 'object' ? (t.category?.name || 'Unknown') : (t.category || 'Unknown');
      catCounts[cname] = (catCounts[cname] || 0) + 1;
    });
    
    let maxDay = null, maxDayVal = 0;
    Object.keys(dailySpends).forEach(d => { if (dailySpends[d] > maxDayVal) { maxDay = d; maxDayVal = dailySpends[d]; }});
    
    let topFreqCat = null, topFreqCount = 0;
    Object.keys(catCounts).forEach(c => { if (catCounts[c] > topFreqCount) { topFreqCat = c; topFreqCount = catCounts[c]; }});

    // Budget consistency
    let budgetKept = 0; let totalBudgets = 0;
    budgetHistory.forEach(bh => {
      bh.budgets.forEach(b => {
        totalBudgets++;
        if ((b.actualSpent || 0) <= (b.budgetLimit || 0)) budgetKept++;
      });
    });

    // Pattern
    let pattern = "Neutral Observer";
    let patternDesc = "Your spending and savings are stable.";
    let patternColor = "bg-gray-100 text-gray-800 border-gray-200";
    const healthScore = typeof health?.score === 'object' ? (health.score?.value || 0) : (health?.score || 0);
    
    if (healthScore >= 80 && currentOverview.netBalance > 0) {
      pattern = "Consistent Saver"; patternDesc = "You consistently spend less than you earn and maintain a healthy surplus."; patternColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    } else if (currentOverview.totalExpense > currentOverview.totalIncome && currentOverview.totalExpense > 0) {
      pattern = "Lifestyle Spender"; patternDesc = "Your recent expenses have exceeded your income. Consider reviewing your top categories."; patternColor = "bg-amber-100 text-amber-800 border-amber-200";
    } else if (totalBudgets > 0 && (budgetKept / totalBudgets) >= 0.8) {
      pattern = "Budget Conscious"; patternDesc = "You stick to your limits! You've stayed within budget on most of your categories."; patternColor = "bg-blue-100 text-blue-800 border-blue-200";
    } else if (savings?.activeGoals > 0 && currentOverview.netBalance > 0) {
      pattern = "Goal Driven"; patternDesc = "You are actively saving and keeping a surplus for your future goals."; patternColor = "bg-purple-100 text-purple-800 border-purple-200";
    }

    // Natural Language Report
    const reportParagraphs = [];
    if (rangeDef.months === 1) {
       reportParagraphs.push(`During ${rangeDef.label.toLowerCase()}, you brought in ${formatCurrency(currentOverview.totalIncome)} and spent ${formatCurrency(currentOverview.totalExpense)}.`);
    } else {
       reportParagraphs.push(`Over the ${rangeDef.label.toLowerCase()}, your total income was ${formatCurrency(currentOverview.totalIncome)} against ${formatCurrency(currentOverview.totalExpense)} in expenses.`);
    }
    
    if (expDiff > 0) {
        reportParagraphs.push(`Your spending increased by ${formatCurrency(expDiff)} (${expPct.toFixed(1)}%) compared to the previous period.`);
    } else if (expDiff < 0) {
        reportParagraphs.push(`Great job! Your spending decreased by ${formatCurrency(Math.abs(expDiff))} (${Math.abs(expPct).toFixed(1)}%) compared to the previous period.`);
    } else {
        reportParagraphs.push(`Your spending remained relatively stable compared to the previous period.`);
    }

    if (topIncrease) {
        reportParagraphs.push(`The biggest driver of increased spending was ${topIncrease.name}, which went up by ${formatCurrency(topIncrease.diff)}.`);
    }

    return {
      incDiff, incPct, expDiff, expPct, savDiff, savPct, catDiffs,
      topIncrease, topDecrease,
      largestPurchase, avgTxValue, maxDay, maxDayVal, numTx: expenses.length, topFreqCat,
      budgetKept, totalBudgets,
      pattern, patternDesc, patternColor,
      reportParagraphs
    };
  }, [data]);

  const renderTrendIndicator = (diff, pct) => {
    if (diff > 0) return <span className="text-red-600 font-bold text-sm flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> +{pct.toFixed(1)}%</span>;
    if (diff < 0) return <span className="text-emerald-600 font-bold text-sm flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> {pct.toFixed(1)}%</span>;
    return <span className="text-gray-500 font-bold text-sm flex items-center"><ArrowRight className="w-4 h-4 mr-1" /> Stable</span>;
  };
  
  const renderReverseTrendIndicator = (diff, pct) => {
    if (diff > 0) return <span className="text-emerald-600 font-bold text-sm flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> +{pct.toFixed(1)}%</span>;
    if (diff < 0) return <span className="text-red-600 font-bold text-sm flex items-center"><TrendingDown className="w-4 h-4 mr-1" /> {pct.toFixed(1)}%</span>;
    return <span className="text-gray-500 font-bold text-sm flex items-center"><ArrowRight className="w-4 h-4 mr-1" /> Stable</span>;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-1/4 mb-8"></div>
        <div className="h-32 bg-gray-200 rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl mt-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header and Time Range */}
      <PageHeader
        title="Financial Trends"
        subtitle="Analyze your financial habits over time"
        action={
          <>
            <div className="relative flex-1 md:flex-none">
               <select
                 value={timeRange}
                 onChange={(e) => setTimeRange(e.target.value)}
                 className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pl-4 pr-10 py-2.5 text-sm font-bold shadow-sm outline-none transition-all cursor-pointer"
               >
                 {Object.entries(TIME_RANGES).map(([key, val]) => (
                   <option key={key} value={key}>{val.label}</option>
                 ))}
               </select>
               <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3 top-3 pointer-events-none transition-colors" />
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800 flex items-center justify-center disabled:opacity-50 shadow-sm"
              title="Refresh Analysis"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </>
        }
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl flex items-center shadow-sm transition-colors duration-200">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Your Financial Report */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10">
            <h2 className="text-xl font-bold text-emerald-300 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" /> Your Financial Report
            </h2>
            <div className="space-y-3 max-w-4xl">
              {insights.reportParagraphs.map((p, i) => (
                <p key={i} className="text-base sm:text-lg text-emerald-50 leading-relaxed font-medium">{p}</p>
              ))}
            </div>
        </div>
      </div>

      {/* Financial Progress (KPI Cards) */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mt-10 mb-4 flex items-center transition-colors duration-200">
         <Target className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Financial Progress
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 transition-colors duration-200">Income</p>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 flex-wrap">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white min-w-0 truncate transition-colors duration-200">{formatCurrency(data.currentOverview.totalIncome)}</h3>
            <div className="sm:text-right min-w-0">
               {renderReverseTrendIndicator(insights.incDiff, insights.incPct)}
               <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 truncate transition-colors duration-200">{insights.incDiff > 0 ? '+' : ''}{formatCurrency(insights.incDiff)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 transition-colors duration-200">Expenses</p>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 flex-wrap">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white min-w-0 truncate transition-colors duration-200">{formatCurrency(data.currentOverview.totalExpense)}</h3>
            <div className="sm:text-right min-w-0">
               {renderTrendIndicator(insights.expDiff, insights.expPct)}
               <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 truncate transition-colors duration-200">{insights.expDiff > 0 ? '+' : ''}{formatCurrency(insights.expDiff)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 transition-colors duration-200">Net Savings</p>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 flex-wrap">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white min-w-0 truncate transition-colors duration-200">{formatCurrency(data.currentOverview.netBalance)}</h3>
            <div className="sm:text-right min-w-0">
               {renderReverseTrendIndicator(insights.savDiff, insights.savPct)}
               <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 truncate transition-colors duration-200">{insights.savDiff > 0 ? '+' : ''}{formatCurrency(insights.savDiff)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Trends & Biggest Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col min-h-[400px] transition-colors duration-200">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Income vs Expense Trend
          </h2>
          <div className="flex-1 w-full mt-2">
            {data.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-gray-700/50" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} dy={10} className="fill-slate-500 dark:fill-gray-400" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} className="fill-slate-500 dark:fill-gray-400" />
                  <RechartsTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#0f172a' }} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200">No trend data available.</div>
            )}
          </div>
          
          {/* Biggest Changes Highlights inside the same block as requested */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 transition-colors duration-200">
             <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center transition-colors duration-200">
                 <Info className="w-4 h-4 mr-1.5" /> Biggest Changes
             </h3>
             <div className="flex flex-wrap gap-3">
                {insights.topIncrease && (
                   <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-100 dark:border-red-800/50 flex items-center transition-colors duration-200">
                      <ArrowUpRight className="w-4 h-4 mr-1.5" /> {insights.topIncrease.name} increased by {formatCurrency(insights.topIncrease.diff)}
                   </div>
                )}
                {insights.topDecrease && (
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-semibold border border-emerald-100 dark:border-emerald-800/50 flex items-center transition-colors duration-200">
                      <ArrowDownRight className="w-4 h-4 mr-1.5" /> {insights.topDecrease.name} reduced by {formatCurrency(Math.abs(insights.topDecrease.diff))}
                   </div>
                )}
                {insights.savDiff > 0 && (
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-semibold border border-emerald-100 dark:border-emerald-800/50 flex items-center transition-colors duration-200">
                      <ArrowUpRight className="w-4 h-4 mr-1.5" /> Savings improved by {formatCurrency(insights.savDiff)}
                   </div>
                )}
                {!insights.topIncrease && !insights.topDecrease && insights.savDiff <= 0 && (
                   <div className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors duration-200">No significant changes detected.</div>
                )}
             </div>
          </div>
        </div>

        {/* Your Financial Pattern */}
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-center text-center transition-colors duration-200 ${insights.patternColor.replace('bg-gray-100 text-gray-800 border-gray-200', 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700').replace('bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50').replace('bg-amber-100 text-amber-800 border-amber-200', 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50').replace('bg-blue-100 text-blue-800 border-blue-200', 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50').replace('bg-purple-100 text-purple-800 border-purple-200', 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800/50')}`}>
          <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors duration-200">
             <Activity className="w-8 h-8 opacity-80" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Your Financial Pattern</h2>
          <h3 className="text-3xl font-black mb-3">{insights.pattern}</h3>
          <p className="text-sm font-medium opacity-90 leading-relaxed px-4">{insights.patternDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Category Evolution */}
         <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
               <ListFilter className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Category Evolution
            </h2>
            <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {insights.catDiffs.length > 0 ? insights.catDiffs.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                     <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: getCategoryHexColor(cat.name) }}></div>
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white transition-colors duration-200">{cat.name}</p>
                           <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">{formatCurrency(cat.curr)}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        {renderTrendIndicator(cat.diff, cat.pct)}
                     </div>
                  </div>
               )) : (
                  <div className="py-10 text-center text-gray-500 dark:text-gray-400 font-medium transition-colors duration-200">No category spending data available.</div>
               )}
            </div>
         </div>

         {/* Financial Habits (Transaction level metrics) */}
         <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
               <Wallet className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Spending Habits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors duration-200">Largest Purchase</p>
                  {insights.largestPurchase ? (
                     <>
                        <p className="text-lg font-black text-gray-900 dark:text-white truncate transition-colors duration-200" title={insights.largestPurchase.title}>{insights.largestPurchase.title}</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-200">{formatCurrency(insights.largestPurchase.amount)}</p>
                     </>
                  ) : <p className="text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors duration-200">N/A</p>}
               </div>
               
               <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors duration-200">Avg Tx Value</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(insights.avgTxValue)}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">Across {insights.numTx} expenses</p>
               </div>

               <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors duration-200">Highest Spending Day</p>
                  {insights.maxDay ? (
                     <>
                        <p className="text-lg font-black text-gray-900 dark:text-white transition-colors duration-200">{new Date(insights.maxDay).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 transition-colors duration-200">{formatCurrency(insights.maxDayVal)}</p>
                     </>
                  ) : <p className="text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors duration-200">N/A</p>}
               </div>

               <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors duration-200">Most Frequent Category</p>
                  {insights.topFreqCat ? (
                     <p className="text-lg font-black text-gray-900 dark:text-white transition-colors duration-200">{insights.topFreqCat}</p>
                  ) : <p className="text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors duration-200">N/A</p>}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Budget Performance */}
         <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center transition-colors duration-200">
               <Target className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Budget Consistency
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                {insights.totalBudgets > 0 ? (
                   <>
                     <div className="w-24 h-24 mb-4 rounded-full border-8 border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center bg-white dark:bg-gray-800 shadow-inner transition-colors duration-200">
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{Math.round((insights.budgetKept / insights.totalBudgets)*100)}%</span>
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Budget Success Rate</h3>
                     <p className="text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">You stayed within budget on <span className="font-bold text-emerald-700 dark:text-emerald-400">{insights.budgetKept}</span> out of <span className="font-bold">{insights.totalBudgets}</span> budget tracking periods during this time.</p>
                   </>
                ) : (
                   <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-200">No budgets were set during this period.</p>
                )}
            </div>
         </div>

         {/* Savings & Subscriptions (Live Data) */}
         <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
               <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center transition-colors duration-200">
                  <Wallet className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Current Savings Journey
               </h2>
               {data.savings ? (
                  <div>
                     <div className="flex justify-between items-end mb-2">
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400 transition-colors duration-200">Total Saved</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 transition-colors duration-200">{formatCurrency(data.savings.totalSavedAmount)}</p>
                     </div>
                     <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden mb-3 transition-colors duration-200">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(data.savings.overallSavingsProgressPercentage, 100)}%` }}></div>
                     </div>
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 text-right transition-colors duration-200">{data.savings.overallSavingsProgressPercentage.toFixed(1)}% of total targets</p>
                  </div>
               ) : <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Savings data unavailable.</p>}
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 transition-colors duration-200">
               <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center transition-colors duration-200">
                  <CreditCard className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" /> Recurring Expenses
               </h2>
               {data.subscription ? (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                     <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors duration-200">Monthly Cost</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(data.subscription.monthlyEstimatedCost)}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 transition-colors duration-200">Active</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 transition-colors duration-200">{data.subscription.activeSubscriptions}</p>
                     </div>
                  </div>
               ) : <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Subscription data unavailable.</p>}
            </div>
         </div>
      </div>
      
      {/* Projected Progress */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-6 sm:p-8 rounded-2xl shadow-sm transition-colors duration-200">
         <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center transition-colors duration-200">
            <TrendingUp className="w-5 h-5 mr-2" /> Projected Progress
         </h2>
         <p className="text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed transition-colors duration-200">
            Based on your average monthly savings of <strong className="text-emerald-900 dark:text-emerald-100">{formatCurrency(insights.savDiff > 0 ? (data.currentOverview.netBalance / data.rangeDef.months) : Math.max(data.currentOverview.netBalance / data.rangeDef.months, 0))}</strong> over this period, 
            {data.savings?.totalTargetAmount > data.savings?.totalSavedAmount ? 
               ` you could reach your total current savings target of ${formatCurrency(data.savings.totalTargetAmount)} in approximately ${Math.ceil((data.savings.totalTargetAmount - data.savings.totalSavedAmount) / (Math.max(data.currentOverview.netBalance / data.rangeDef.months, 1)))} months.`
               : " you are well-positioned to maintain a healthy financial surplus."}
            {insights.totalBudgets > 0 && (insights.budgetKept / insights.totalBudgets) < 0.5 ? " However, focusing on budget consistency could accelerate this progress." : " Your strong budget adherence will help keep you on track!"}
         </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
