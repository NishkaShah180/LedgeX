import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Sparkles, Smile, AlertCircle, CheckCircle, 
  Target, MessageCircle, Send,
  TrendingUp, Award, Calendar, Loader2,
  DollarSign, CreditCard, Lightbulb, ShieldCheck, 
  TrendingDown, Wallet, PiggyBank, BrainCircuit, Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PageHeader from '../components/PageHeader';

export default function AiInsightsPage() {
  const { user } = useAuth();
  
  // State for Month/Year
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [basicInsights, setBasicInsights] = useState(null);
  const [geminiInsights, setGeminiInsights] = useState(null);

  // Chat State
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatEndRef = useRef(null);

  const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { month: selectedMonth, year: selectedYear };
        const [basicRes, geminiRes] = await Promise.all([
          api.get('ai/financial-insights', { params }).catch(() => ({ data: { data: null } })),
          api.get('ai/gemini-insights', { params }).catch(() => ({ data: { data: null } }))
        ]);
        
        setBasicInsights(basicRes.data?.data || null);
        setGeminiInsights(geminiRes.data?.data || null);
      } catch (err) {
        setError('Failed to load your financial insights. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [selectedMonth, selectedYear]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const handleSendMessage = async (customPrompt = null) => {
    const messageToSend = customPrompt || chatPrompt;
    if (!messageToSend.trim()) return;

    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', text: messageToSend }]);
    setChatPrompt("");
    setChatError(null);
    setIsChatLoading(true);

    try {
      const response = await api.post('ai/chat', {
        prompt: messageToSend,
        month: selectedMonth,
        year: selectedYear
      });
      
      const reply = response.data?.data?.response || "I'm sorry, I couldn't process that request.";
      setChatHistory(prev => [...prev, { role: 'coach', text: reply }]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "I'm having trouble analyzing your data right now. Please try again later.";
      setChatError(errorMessage);
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && !basicInsights) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-800 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full transition-colors duration-200">
            <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-emerald-800 dark:text-emerald-300 font-medium animate-pulse transition-colors duration-200">Your Financial Coach is analyzing your data...</p>
      </div>
    );
  }

  // Derived state for the UI
  const healthScore = basicInsights?.financialHealthScore || 0;
  
  let statusColor = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
  let iconColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30";
  let statusTitle = "Excellent";
  let StatusIcon = ShieldCheck;
  let statusMessage = "Your overall financial situation is strong this month. You're balancing spending and saving well.";

  if (healthScore < 50) {
    statusColor = "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400";
    iconColor = "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30";
    statusTitle = "Needs Attention";
    StatusIcon = AlertCircle;
    statusMessage = "Your finances need some attention this month. Let's look at ways to get back on track.";
  } else if (healthScore < 75) {
    statusColor = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    iconColor = "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
    statusTitle = "Good";
    StatusIcon = Target;
    statusMessage = "Your finances are stable, but there's room for improvement in your spending habits.";
  }

  const allRecommendations = [
    ...(geminiInsights?.recommendations || []),
    ...(geminiInsights?.budgetAdvice || []),
    ...(geminiInsights?.savingsAdvice || [])
  ].filter(Boolean);

  const warnings = [
    ...(basicInsights?.warnings || []),
    ...(geminiInsights?.risks || [])
  ].filter(Boolean);

  const processWarnings = (rawWarningsList) => {
    if (!rawWarningsList || rawWarningsList.length === 0) return [];

    // Filter out empty or "no warnings" placeholders
    const filteredWarnings = rawWarningsList.filter(w => {
      if (!w) return false;
      const lower = w.toLowerCase();
      if (lower.includes("no critical risks") || lower.includes("no warnings") || lower.includes("finances look stable")) return false;
      return true;
    });

    if (filteredWarnings.length === 0) return [];

    const formatCategories = (categories) => {
      if (categories.length === 0) return '';
      if (categories.length === 1) return categories[0];
      if (categories.length === 2) return `${categories[0]} and ${categories[1]}`;
      return `${categories.slice(0, -1).join(', ')}, and ${categories[categories.length - 1]}`;
    };

    // 1. Classify each warning
    const classified = filteredWarnings.map(warning => {
      let desc = warning.trim();
      // Clean up markdown bullet points or extra quotes
      if (desc.startsWith('*') || desc.startsWith('-')) desc = desc.substring(1).trim();
      if (desc.startsWith('"') && desc.endsWith('"')) desc = desc.slice(1, -1).trim();
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
      if (!/[.!?]$/.test(desc)) desc += '.';

      const lower = desc.toLowerCase();
      
      let topic = 'general';
      let severity = 'Informational';
      let category = '';
      let utilization = '';

      // Check category keywords first to identify if it belongs to a category
      const categoriesList = ['food', 'dining', 'shopping', 'entertainment', 'travel', 'utilities', 'rent', 'groceries', 'grocery', 'transport', 'bills'];
      for (const cat of categoriesList) {
        if (lower.includes(cat)) {
          category = cat.charAt(0).toUpperCase() + cat.slice(1);
          if (category === 'Groceries') category = 'Grocery';
          break;
        }
      }

      // Check deficit
      if (lower.includes('exceed income') || lower.includes('negative balance') || lower.includes('deficit') || lower.includes('exceeds income') || lower.includes('spending outpaced')) {
        topic = 'deficit';
        severity = 'Attention';
      }
      // Check budget exceeded
      else if (lower.includes('exceeded') && lower.includes('budget')) {
        topic = 'budget_exceeded';
        severity = 'Attention';
      }
      // Check budget near limit
      else if (lower.includes('budget') && (lower.includes('utilization') || lower.includes('near') || lower.includes('limit') || lower.includes('close to'))) {
        topic = 'budget_near_limit';
        severity = 'Near Limit';
        
        // Try to extract percentage
        const pctMatch = lower.match(/(\d+)%/);
        if (pctMatch) {
          utilization = pctMatch[1];
        }
      }
      // Check savings
      else if (lower.includes('saving') || lower.includes('savings') || lower.includes('deposit')) {
        topic = 'savings';
        if (lower.includes('days') || lower.includes('approaching') || lower.includes('under') || lower.includes('missed')) {
          severity = 'Near Limit';
        } else {
          severity = 'Informational';
        }
      }
      // Check subscriptions
      else if (lower.includes('subscription')) {
        topic = 'subscriptions';
        if (lower.includes('consuming') || lower.includes('high') || lower.includes('increasing')) {
          severity = 'Near Limit';
        } else {
          severity = 'Informational';
        }
      }

      // Generate concise Title
      let title = 'Financial Alert';
      if (topic === 'deficit') {
        title = 'Monthly Deficit';
      } else if (topic === 'budget_exceeded') {
        title = category ? `${category} Budget` : 'Budget Exceeded';
      } else if (topic === 'budget_near_limit') {
        title = category ? `${category} Budget` : 'Budget Limit';
      } else if (topic === 'savings') {
        title = category ? `${category} Savings` : 'Savings Goals';
      } else if (topic === 'subscriptions') {
        title = 'Subscription Costs';
      } else {
        // Try keyword matching for title
        const keywordMap = [
          { keywords: ['grocery', 'groceries'], title: 'Grocery Spending' },
          { keywords: ['food', 'dining', 'restaurant', 'meal', 'eat'], title: 'Food Budget' },
          { keywords: ['shopping', 'clothing', 'clothes', 'apparel'], title: 'Shopping Budget' },
          { keywords: ['entertainment', 'movie', 'show', 'netflix', 'spotify', 'leisure'], title: 'Entertainment Budget' },
          { keywords: ['travel', 'vacation', 'trip', 'flight', 'hotel'], title: 'Travel Budget' },
          { keywords: ['utility', 'electricity', 'water', 'gas', 'bill'], title: 'Utility Costs' },
          { keywords: ['rent', 'housing', 'mortgage'], title: 'Housing Costs' },
          { keywords: ['saving', 'savings', 'emergency fund'], title: 'Savings Goals' },
          { keywords: ['invest', 'investment', 'portfolio', 'stock'], title: 'Investment Alert' },
          { keywords: ['income', 'salary', 'earn'], title: 'Income Alert' },
          { keywords: ['health score', 'financial health'], title: 'Financial Health' },
          { keywords: ['deficit', 'exceed income', 'overspend', 'negative balance'], title: 'Monthly Deficit' },
          { keywords: ['budget', 'budgets', 'limit'], title: 'Budget Limit' }
        ];
        const match = keywordMap.find(item => item.keywords.some(kw => lower.includes(kw)));
        title = match ? match.title : (category ? `${category} Spending` : 'Financial Alert');
      }

      return {
        title,
        description: desc,
        severity,
        topic,
        category,
        utilization,
        original: warning
      };
    });

    // 2. Deduplicate / Merge Same-Category and Same-Topic Warnings
    const uniqueItems = [];
    classified.forEach(item => {
      const duplicateIdx = uniqueItems.findIndex(existing => 
        (existing.category && item.category && existing.category.toLowerCase() === item.category.toLowerCase() && existing.topic === item.topic) ||
        (existing.topic === 'subscriptions' && item.topic === 'subscriptions') ||
        (existing.topic === 'savings' && item.topic === 'savings')
      );

      if (duplicateIdx > -1) {
        const existing = uniqueItems[duplicateIdx];
        const hasNumber = (str) => /₹|\d+%|\d+/.test(str);
        if (hasNumber(item.description) && !hasNumber(existing.description)) {
          existing.description = item.description;
        } else if (!hasNumber(item.description) && hasNumber(existing.description)) {
          // Keep existing
        } else {
          if (item.description.length > existing.description.length) {
            existing.description = item.description;
          }
        }
        
        // Upgrade severity if needed
        const severityLevels = { 'Attention': 3, 'Near Limit': 2, 'Informational': 1 };
        if (severityLevels[item.severity] > severityLevels[existing.severity]) {
          existing.severity = item.severity;
        }
      } else {
        uniqueItems.push(item);
      }
    });

    // 3. Group Budget Categories Conditional on Threshold (> 3)
    let processedList = [...uniqueItems];

    const groupBudgetsBySeverity = (targetSeverity, groupTitle, groupTopic) => {
      const budgetItems = processedList.filter(item => 
        item.severity === targetSeverity && 
        (item.topic === 'budget_exceeded' || item.topic === 'budget_near_limit' || item.title.toLowerCase().includes('budget'))
      );

      if (budgetItems.length > 3) {
        const categories = [...new Set(budgetItems.map(item => item.category || 'Other').filter(Boolean))];
        const percentages = budgetItems.map(item => parseInt(item.utilization)).filter(p => !isNaN(p));
        let pctStr = "";
        if (percentages.length > 0) {
          const minPct = Math.min(...percentages);
          pctStr = `above ${minPct}% of `;
        } else if (targetSeverity === 'Near Limit') {
          pctStr = "above 85% of ";
        }

        const description = `${formatCategories(categories)} are all ${pctStr}their monthly budgets.`;
        
        const groupedCard = {
          title: groupTitle,
          description,
          severity: targetSeverity,
          topic: groupTopic,
          category: ''
        };

        processedList = processedList.filter(item => !budgetItems.includes(item));
        processedList.push(groupedCard);
      }
    };

    groupBudgetsBySeverity('Attention', 'Multiple Budgets Exceeded', 'budget_exceeded_grouped');
    groupBudgetsBySeverity('Near Limit', 'Multiple Budgets Near Limit', 'budget_near_limit_grouped');

    // 4. Sort by severity: Attention first, then Near Limit, then Informational
    const severityOrder = { 'Attention': 1, 'Near Limit': 2, 'Informational': 3 };
    processedList.sort((a, b) => {
      return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
    });

    // 5. Limit the Watchlist to maximum of 5 cards, summarize the rest
    const MAX_CARDS = 5;
    if (processedList.length > MAX_CARDS) {
      const keptCards = processedList.slice(0, MAX_CARDS - 1);
      const remainingCards = processedList.slice(MAX_CARDS - 1);
      
      const summarizeRemaining = (remaining) => {
        if (remaining.length === 0) return "";
        const clauses = remaining.map(c => {
          let clause = c.description.trim();
          if (clause.endsWith('.')) clause = clause.slice(0, -1);
          return clause.charAt(0).toLowerCase() + clause.slice(1);
        });
        
        if (clauses.length === 1) {
          return `Additionally, note that ${clauses[0]}.`;
        }
        if (clauses.length === 2) {
          return `Additionally, note that ${clauses[0]}, and ${clauses[1]}.`;
        }
        return `Additionally, note that ${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}.`;
      };

      let highestSeverity = 'Informational';
      const severityLevels = { 'Attention': 3, 'Near Limit': 2, 'Informational': 1 };
      remainingCards.forEach(c => {
        if (severityLevels[c.severity] > severityLevels[highestSeverity]) {
          highestSeverity = c.severity;
        }
      });

      const summaryCard = {
        title: 'Additional Observations',
        description: summarizeRemaining(remainingCards),
        severity: highestSeverity,
        topic: 'summary_overflow',
        category: ''
      };

      processedList = [...keptCards, summaryCard];
    }

    return processedList;
  };

  const processedWarnings = processWarnings(warnings);


  const achievements = basicInsights?.achievements || [];
  
  const suggestedPrompts = [
    { text: 'How can I save more?', icon: DollarSign },
    { text: 'Why did I spend more this month?', icon: TrendingUp },
    { text: 'How am I doing overall?', icon: Activity },
    { text: 'Can I afford a vacation?', icon: Target },
    { text: 'Which subscriptions should I cancel?', icon: CreditCard }
  ];

  const getCardDetails = (text, index) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('save') || lowerText.includes('savings') || lowerText.includes('deposit')) return { icon: PiggyBank, title: 'Increase Savings', text };
    if (lowerText.includes('budget') || lowerText.includes('spend') || lowerText.includes('expense')) return { icon: Wallet, title: 'Watch Spending', text };
    if (lowerText.includes('invest') || lowerText.includes('goal') || lowerText.includes('habit')) return { icon: TrendingUp, title: 'Keep the Momentum', text };
    const icons = [Lightbulb, Target, BrainCircuit];
    return { icon: icons[index % icons.length], title: 'Financial Tip', text };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Header & Time Period */}
      <PageHeader
        title="AI Insights"
        subtitle={`Hi ${user?.firstName || 'there'}! I've reviewed your finances for ${monthNamesFull[selectedMonth - 1]} ${selectedYear}. Let's see how you're doing.`}
        action={
          <div className="flex space-x-3 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 md:flex-none transition-colors duration-200">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-gray-800 dark:text-gray-200 focus:ring-0 block text-sm font-bold outline-none cursor-pointer px-2 transition-colors duration-200"
            >
              {monthNamesFull.map((m, i) => (
                <option key={i} value={i + 1} className="dark:bg-gray-800">{m}</option>
              ))}
            </select>
            <div className="w-px bg-gray-200 dark:bg-gray-700 transition-colors duration-200"></div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-gray-800 dark:text-gray-200 focus:ring-0 block text-sm font-bold outline-none cursor-pointer px-2 transition-colors duration-200"
            >
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="dark:bg-gray-800">{y}</option>
              ))}
            </select>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl flex items-start animate-fade-in-up transition-colors duration-200">
          <AlertCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className={`space-y-12 transition-opacity duration-500 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Section 1: Today's Financial Check-in */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center transition-all hover:shadow-md duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 md:mb-0">
              <div className={`p-3 rounded-xl mb-3 sm:mb-0 sm:mr-4 flex-shrink-0 transition-colors duration-200 ${iconColor}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5 transition-colors duration-200">{statusTitle}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-xl transition-colors duration-200">
                  {statusMessage}
                </p>
              </div>
            </div>
            <div className="md:ml-4 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2 rounded-xl flex items-center self-start md:self-auto w-full md:w-auto transition-colors duration-200">
               <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-3 transition-colors duration-200">Financial Health</span>
               <span className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors duration-200 ${statusColor}`}>
                 {statusTitle}
               </span>
            </div>
          </div>
        </section>

        {/* Section 2: Monthly Review */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center transition-colors duration-200">
            <BrainCircuit className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" />
            Monthly Review
          </h2>
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden group border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 dark:from-emerald-900/20 to-transparent opacity-50 rounded-bl-full pointer-events-none transition-colors duration-200"></div>
            <ul className="relative z-10 space-y-6">
              <li className="flex items-start">
                <div className={`p-2.5 rounded-xl mr-4 flex-shrink-0 transition-colors duration-200 ${healthScore >= 75 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : healthScore >= 50 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-1 text-lg transition-colors duration-200">Overall Balance</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed transition-colors duration-200">
                   {healthScore >= 75 ? "Your income comfortably exceeded your spending, allowing you to save a good portion of what you earned." : 
                    healthScore >= 50 ? "Your spending was mostly under control, but you have opportunities to optimize your savings." : 
                    "Your spending outpaced your optimal budget levels, meaning you have less surplus left for savings."}
                  </p>
                </div>
              </li>
              
              {achievements.length > 0 && (
                <li className="flex items-start">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded-xl mr-4 flex-shrink-0 transition-colors duration-200">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="text-gray-900 dark:text-white font-semibold mb-1 text-lg transition-colors duration-200">Milestones Achieved</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed transition-colors duration-200">
                      You hit some great milestones this month, which is a strong indicator of consistent financial habits.
                    </p>
                  </div>
                </li>
              )}
              
              {warnings.length > 0 && (
                <li className="flex items-start">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded-xl mr-4 flex-shrink-0 transition-colors duration-200">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="text-gray-900 dark:text-white font-semibold mb-1 text-lg transition-colors duration-200">Areas to Monitor</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed transition-colors duration-200">
                      We noticed a few areas needing attention—like your {warnings[0].toLowerCase().replace('budget is at', 'budget getting close to').replace('%', 'percent')}.
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Grid for Actions, Wins, Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 3: Recommended Actions */}
          <section className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center transition-colors duration-200">
              <Lightbulb className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" />
              Recommended Actions
            </h2>
            {allRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {allRecommendations.slice(0, 4).map((action, i) => {
                  const details = getCardDetails(action, i);
                  const Icon = details.icon;
                  return (
                    <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group duration-200">
                      <div className="flex items-center mb-3">
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400 mr-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors duration-200">{details.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed transition-colors duration-200">{details.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-center shadow-sm transition-colors duration-200">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">You're all set! No specific actions needed right now.</p>
              </div>
            )}
          </section>

          {/* Section 4: Tiny Wins */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center transition-colors duration-200">
              <Award className="w-5 h-5 text-blue-500 mr-2" />
              Tiny Wins
            </h2>
            {achievements.length > 0 ? (
              <div className="flex flex-col gap-3">
                {achievements.map((win, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex items-center shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-lg mr-3 flex-shrink-0 transition-colors duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed transition-colors duration-200">{win}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-center shadow-sm h-full flex flex-col justify-center transition-colors duration-200">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Keep up the good habits to earn your first win!</p>
              </div>
            )}
          </section>

          {/* Section 5: Watchlist */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center transition-colors duration-200">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              Watchlist
            </h2>
            {processedWarnings.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors duration-200">
                 <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 transition-colors duration-200">Active Alerts</h3>
                 <div className="flex flex-col gap-3">
                  {processedWarnings.map((card, i) => {
                    const getCardIcon = (topic) => {
                      if (topic?.includes('budget')) return Wallet;
                      if (topic?.includes('savings')) return PiggyBank;
                      if (topic?.includes('subscription')) return CreditCard;
                      if (topic === 'deficit') return TrendingDown;
                      return AlertCircle;
                    };
                    const Icon = getCardIcon(card.topic);

                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 p-4 rounded-xl transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            card.severity === 'Attention' 
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400' 
                              : card.severity === 'Near Limit'
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400'
                              : 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">
                              {card.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed transition-colors duration-200">
                              {card.description}
                            </p>
                          </div>
                        </div>
                        <div className="sm:self-center shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border transition-colors duration-200 ${
                            card.severity === 'Attention'
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                              : card.severity === 'Near Limit'
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                              : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'
                          }`}>
                            {card.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                 </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-center shadow-sm h-full flex flex-col justify-center transition-colors duration-200">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">No immediate concerns detected. Your finances look stable!</p>
              </div>
            )}
          </section>

        </div>

        {/* Section 6: Talk to Your Financial Coach */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in-up flex flex-col h-[600px] mt-8 transition-colors duration-200" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900 flex items-center transition-colors duration-200">
            {/* Future LedgeX Logo Container */}
            <div className="w-8 h-8 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-sm transition-colors duration-200">
               <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                LedgeX Assistant
              </h2>
            </div>
          </div>
          
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900 transition-colors duration-200">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col h-full justify-center items-center text-center max-w-3xl mx-auto pb-10">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-8 transition-colors duration-200">
                  How can I help you today, {user?.firstName}?
                </h3>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {suggestedPrompts.map((prompt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSendMessage(prompt.text)}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2.5 rounded-full text-sm font-medium transition-colors text-left flex items-center group duration-200"
                    >
                      <prompt.icon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-sm flex-shrink-0 mt-1 transition-colors duration-200">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-colors duration-200 ${
                      msg.role === 'user' 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-800 dark:text-gray-200 prose prose-sm prose-emerald dark:prose-invert'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="m-0 text-sm font-medium">{msg.text}</p>
                      ) : (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-sm flex-shrink-0 mt-1 transition-colors duration-200">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-4 flex items-center space-x-1.5 h-[52px]">
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 transition-colors duration-200">
            <div className="relative max-w-4xl mx-auto flex items-end bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-gray-300 dark:focus-within:border-gray-600 focus-within:ring-4 focus-within:ring-gray-100 dark:focus-within:ring-gray-800 transition-all p-1.5">
              <textarea 
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message LedgeX Assistant..." 
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 pl-3 pr-14 text-sm font-medium text-gray-800 dark:text-white min-h-[44px] max-h-[120px] transition-colors duration-200"
                rows={1}
                disabled={isChatLoading}
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!chatPrompt.trim() || isChatLoading}
                className="absolute right-2.5 bottom-2.5 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
            <p className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-2 transition-colors duration-200">
              LedgeX Assistant uses your live data to provide personalized guidance.
            </p>
            {chatError && (
              <div className="flex justify-center mt-2 animate-fade-in-up">
                <p className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs font-medium py-1.5 px-3 rounded-full flex items-center shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                  {chatError}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Closing Summary */}
        <section className="text-center pt-8 pb-4 animate-fade-in-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
           <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl mx-auto font-medium transition-colors duration-200">
             Keep tracking your daily expenses and checking back here to stay on top of your financial health. 
             Every small step brings you closer to your long-term goals!
           </p>
        </section>

      </div>
    </div>
  );
}
