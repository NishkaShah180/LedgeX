import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Sparkles, Smile, AlertCircle, CheckCircle, 
  Target, MessageCircle, Send,
  TrendingUp, Award, Calendar, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
      setChatHistory(prev => [...prev, { role: 'coach', text: "I'm having trouble analyzing your data right now. Please try again later." }]);
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
          <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-emerald-100 p-4 rounded-full">
            <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-emerald-800 font-medium animate-pulse">Your Financial Coach is analyzing your data...</p>
      </div>
    );
  }

  // Derived state for the UI
  const healthScore = basicInsights?.financialHealthScore || 0;
  
  let statusColor = "from-emerald-100 to-emerald-50 text-emerald-900 border-emerald-200";
  let iconColor = "text-emerald-500 bg-emerald-100";
  let statusTitle = "You're doing well";
  let StatusIcon = Smile;

  if (healthScore < 50) {
    statusColor = "from-rose-100 to-rose-50 text-rose-900 border-rose-200";
    iconColor = "text-rose-500 bg-rose-100";
    statusTitle = "Needs attention";
    StatusIcon = AlertCircle;
  } else if (healthScore < 75) {
    statusColor = "from-amber-100 to-amber-50 text-amber-900 border-amber-200";
    iconColor = "text-amber-500 bg-amber-100";
    statusTitle = "You're making steady progress";
    StatusIcon = Target;
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

  const achievements = basicInsights?.achievements || [];
  
  const suggestedPrompts = [
    '💰 Help me save more',
    '📈 Analyze this month',
    '🛍 Am I overspending?',
    '🎯 My savings goals',
    '💳 My subscriptions',
    '💡 How can I reach my goals faster?'
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header & Time Period */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center mb-2">
            <span className="text-emerald-500 mr-3">💚</span> LedgeX Financial Coach
          </h1>
          <p className="text-gray-600 text-lg">
            👋 Hi {user?.firstName || 'there'}! I've reviewed your finances for {monthNamesFull[selectedMonth - 1]} {selectedYear}. Let's see how you're doing.
          </p>
        </div>
        <div className="flex space-x-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-gray-700 focus:ring-0 block text-sm font-medium outline-none cursor-pointer"
          >
            {monthNamesFull.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <div className="w-px bg-gray-300"></div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-gray-700 focus:ring-0 block text-sm font-medium outline-none cursor-pointer"
          >
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start animate-fade-in-up">
          <AlertCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className={`space-y-8 transition-opacity duration-500 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Section 1: Today's Financial Check-in */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className={`p-8 rounded-3xl border bg-gradient-to-br shadow-sm flex flex-col sm:flex-row items-center sm:items-start transition-all hover:shadow-md ${statusColor}`}>
            <div className={`p-5 rounded-2xl shadow-sm mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 bg-white`}>
              <StatusIcon className={`w-12 h-12 ${iconColor.split(' ')[0]}`} />
            </div>
            <div className="text-center sm:text-left pt-2">
              <h3 className="text-2xl font-bold mb-3 tracking-tight">{statusTitle}</h3>
              <p className="text-lg opacity-90 leading-relaxed max-w-2xl font-medium">
                {basicInsights?.topInsight || "Everything is looking good right now. Keep maintaining your healthy financial habits!"}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: What I Noticed */}
        {geminiInsights?.financialSummary && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 ml-2 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-emerald-500" />
              What I Noticed
            </h2>
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 to-transparent opacity-50 rounded-bl-full pointer-events-none"></div>
              <p className="text-gray-700 text-lg leading-relaxed font-medium relative z-10">
                "{geminiInsights.financialSummary}"
              </p>
            </div>
          </section>
        )}

        {/* Grid for Actions, Wins, Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 3: What I'd Do Next */}
          <section className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 ml-2">What I'd Do Next</h2>
            {allRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allRecommendations.slice(0, 4).map((action, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-center h-full relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 bg-emerald-50 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="flex items-start z-10">
                      <div className="bg-emerald-100 p-2 rounded-xl mr-4 text-emerald-600 flex-shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <p className="text-gray-700 text-base font-medium leading-relaxed">{action}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center text-gray-500 font-medium">
                You're all set! No specific actions needed right now.
              </div>
            )}
          </section>

          {/* Section 4: Tiny Wins */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 ml-2 flex items-center">
              <Award className="w-5 h-5 text-blue-500 mr-2" />
              Tiny Wins
            </h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
              {achievements.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {achievements.map((win, i) => (
                    <div key={i} className="p-5 flex items-center hover:bg-blue-50/50 transition-colors">
                      <div className="bg-blue-100 rounded-full p-2 mr-4 flex-shrink-0 text-2xl">
                        🎉
                      </div>
                      <p className="text-gray-700 font-medium">{win}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 h-full flex flex-col justify-center">
                  Keep up the good habits to earn your first win!
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Things to Watch */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 ml-2 flex items-center">
              <TrendingUp className="w-5 h-5 text-amber-500 mr-2" />
              Things to Watch
            </h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
              {warnings.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {warnings.map((warning, i) => (
                    <div key={i} className="p-5 flex items-center hover:bg-amber-50/50 transition-colors">
                      <div className="bg-amber-100 rounded-full p-2 mr-4 flex-shrink-0 text-xl">
                        ⚠
                      </div>
                      <p className="text-gray-700 font-medium">{warning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 h-full flex flex-col justify-center">
                  No immediate concerns detected. Your finances look stable!
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Section 6: Talk to Your Financial Coach */}
        <section className="mt-12 bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden animate-fade-in-up flex flex-col h-[600px]" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="bg-emerald-100 p-2 rounded-full mr-3">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              Talk to Your Financial Coach
            </h2>
            <p className="text-gray-500 mt-2 text-sm ml-12">
              I can analyze your budget, track your goals, and give personalized advice.
            </p>
          </div>
          
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col h-full justify-center items-center text-center max-w-lg mx-auto">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Smile className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Hi {user?.firstName} 👋 What would you like help understanding today?
                </h3>
                <p className="text-gray-500 mb-8 text-sm">
                  Select a topic below or type your own question. I'll use your actual {monthNamesFull[selectedMonth - 1]} data to answer.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSendMessage(prompt)}
                      className="bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm shadow-sm transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white shadow-md rounded-br-none' 
                        : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none prose prose-sm prose-emerald'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="m-0 text-[15px]">{msg.text}</p>
                      ) : (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none p-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="relative max-w-4xl mx-auto flex items-end bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-50 transition-all p-1 shadow-inner">
              <textarea 
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your finances..." 
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 pl-4 pr-12 text-gray-700 min-h-[52px] max-h-[120px]"
                rows={1}
                disabled={isChatLoading}
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!chatPrompt.trim() || isChatLoading}
                className="absolute right-2 bottom-2 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isChatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              The AI Coach uses your actual LedgeX financial data to provide personalized guidance.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
