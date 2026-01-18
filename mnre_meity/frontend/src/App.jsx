import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, Send, User, Bot, Menu, X, RefreshCw, Loader2 } from 'lucide-react';

const App = () => {
  // State for managing the chat
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [activeMinistry, setActiveMinistry] = useState('MNRE'); // Default selection
  const [hasStarted, setHasStarted] = useState(false); // To track if user has started chatting
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile menu toggle

  // --- Backend Connection States ---
  const [isClassifying, setIsClassifying] = useState(false); 
  const [autoSwitched, setAutoSwitched] = useState(null); 
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle sending a message and connecting to backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const currentPrompt = inputValue;
    
    // 1. Add user message to UI immediately (Optimistic UI)
    const newMessages = [
      ...messages,
      { id: Date.now(), text: currentPrompt, sender: 'user' }
    ];
    setMessages(newMessages);
    setHasStarted(true);
    setInputValue('');
    setIsClassifying(true);

    try {
      // 2. CONNECT TO PYTHON BACKEND
      // We send a POST request to the Flask server running on port 5000
      const response = await fetch('http://localhost:5000/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentPrompt }), // Key must match python 'query'
      });

      const data = await response.json();
      
      // 3. Handle Classification Result
      // The backend returns uppercase 'MNRE', 'MEITY', or 'UNCLASSIFIED'
      if (data.ministry && data.ministry !== 'UNCLASSIFIED') {
          // Normalize 'MEITY' (backend) to 'MeiTY' (frontend state ID)
          const targetMinistry = data.ministry === 'MEITY' ? 'MeiTY' : 'MNRE';
          
          // Only switch if the ministry is actually different
          if (targetMinistry !== activeMinistry) {
            setActiveMinistry(targetMinistry);
            setAutoSwitched(targetMinistry); // Trigger the toast notification
            setTimeout(() => setAutoSwitched(null), 3000);
          }
      }

      // 4. Simulate Bot Response (using the real classification data)
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            id: Date.now() + 1, 
            text: `${data.ministry}. Retrieving relevant docs...`, 
            sender: 'bot' 
          }
        ]);
        setIsClassifying(false);
      }, 500);

    } catch (error) {
      console.error("Failed to connect to classifier:", error);
      setIsClassifying(false);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: "Error: Could not reach the backend server. Make sure 'query_classifier.py' is running on port 5000.", sender: 'bot' }
      ]);
    }
  };

  // Ministry options
  const ministries = [
    { id: 'MNRE', name: 'MNRE', fullName: 'Ministry of New and Renewable Energy' },
    { id: 'MeiTY', name: 'MeiTY', fullName: 'Ministry of Electronics and IT' }
  ];

  return (
    <div className="flex h-screen w-full bg-white font-sans text-slate-900 overflow-hidden relative">
      
      {/* Auto-Switch Toast (Minimalist Style) */}
      {autoSwitched && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3">
            <RefreshCw size={18} className="animate-spin-once" />
            <span className="text-sm font-bold">Switched to {autoSwitched}</span>
          </div>
        </div>
      )}

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-slate-100 rounded-full border border-slate-900"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Modeled after the "Pill" shape in the sketch */}
      <div className={`
        fixed md:relative z-40 h-full transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:w-1/4 lg:w-1/5 flex flex-col p-4
      `}>
        <div className="h-full w-full border-4 border-slate-900 rounded-[3rem] bg-white flex flex-col items-center py-12 shadow-xl">
          <div className="text-center mb-10 px-4">
            <h2 className="text-xl font-extrabold tracking-tight mb-2">Ministries</h2>
            <h2 className="text-xl font-extrabold tracking-tight">Supported</h2>
          </div>

          <div className="flex flex-col gap-6 w-full px-6">
            {ministries.map((ministry) => (
              <button
                key={ministry.id}
                onClick={() => {
                  setActiveMinistry(ministry.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  relative group overflow-hidden rounded-full border-2 border-slate-900 py-4 px-6 text-center font-bold text-lg transition-all duration-300
                  ${activeMinistry === ministry.id 
                    ? 'bg-slate-900 text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-900 hover:bg-slate-100'}
                `}
              >
                {ministry.name}
              </button>
            ))}
          </div>

          <div className="mt-auto opacity-50 text-xs text-center px-4">
            Local Governance<br/>Transparency Portal
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative p-4 md:p-8">
        
        {/* Top Right Icon from sketch */}
        <div className="absolute top-8 right-8 flex flex-col items-center gap-1 opacity-80">
          <div className="relative">
            <FileText size={48} strokeWidth={1.5} />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full border border-slate-900 p-1">
              <Search size={16} />
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={`transition-all duration-500 flex flex-col items-center ${hasStarted ? 'mt-4 mb-2' : 'mt-20 md:mt-32 mb-12'}`}>
          <h1 className="text-2xl md:text-4xl font-bold text-center max-w-2xl leading-tight">
            Platform for transparency of <br/>
            <span className="text-slate-700">Local Governance</span>
          </h1>
          {!hasStarted && (
            <p className="mt-4 text-slate-500 text-center max-w-md">
              Access real-time data and documents from {activeMinistry === 'MNRE' ? 'Renewable Energy' : 'Electronics & IT'} departments.
            </p>
          )}
        </div>

        {/* Chat Area / Results */}
        {hasStarted && (
          <div className="flex-1 overflow-y-auto mb-6 px-4 md:px-20 space-y-6 scrollbar-hide">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  flex items-start gap-3 max-w-[80%] 
                  ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}
                `}>
                  <div className={`
                    p-2 rounded-full border border-slate-900 shrink-0
                    ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  `}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`
                    p-4 rounded-2xl border-2 border-slate-900
                    ${msg.sender === 'user' 
                      ? 'bg-slate-100 rounded-tr-none' 
                      : 'bg-white rounded-tl-none shadow-sm'}
                  `}>
                    <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Minimalist Loading Indicator */}
            {isClassifying && (
              <div className="flex w-full justify-start animate-in fade-in duration-300">
                 <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full border border-slate-900 shrink-0 bg-white text-slate-900">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-none border-2 border-slate-900 bg-white flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-slate-900" />
                      <span className="text-sm text-slate-500 font-medium">Checking {activeMinistry} database...</span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area - Centered initially, sticks to bottom after start */}
        <div className={`
          w-full max-w-3xl mx-auto transition-all duration-500 ease-in-out
          ${hasStarted ? 'mb-4' : 'flex-1 flex flex-col justify-start pt-10'}
        `}>
          <div className="w-full relative">
            {!hasStarted && (
              <label className="block text-xl font-bold mb-3 ml-2 text-slate-800">
                Ask Away!
              </label>
            )}
            
            <form onSubmit={handleSendMessage} className="relative group">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Ask a question about ${activeMinistry}...`}
                className="w-full h-16 pl-6 pr-14 rounded-full border-[3px] border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 text-lg shadow-sm transition-shadow bg-white"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isClassifying}
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors
                  ${inputValue.trim() && !isClassifying
                    ? 'bg-slate-900 text-white hover:bg-slate-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
              >
                {hasStarted ? <Send size={20} /> : <Search size={20} />}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;