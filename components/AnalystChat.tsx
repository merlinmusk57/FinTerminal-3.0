
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { queryGemini } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useData } from '../contexts/DataContext';

export const AnalystChat: React.FC = () => {
  const { financialData, apiKey } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Good morning. I am your dedicated financial analyst AI. I have context on Bank of East Asia (HK), Standard Chartered HK, BOC HK and Hang Seng financials. How can I assist with your peer analysis today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'user', text: input, timestamp: new Date() }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', text: "⚠️ API Key missing. Please go to Settings to configure your Google GenAI API Key.", timestamp: new Date() }]);
      }, 500);
      setInput('');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await queryGemini(apiKey, userMsg.text, history, financialData);
      
      const botMsg: ChatMessage = { role: 'model', text: responseText || "No response.", timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI service. Check console for details.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
        <h2 className="text-sm font-mono text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} /> AI Assistant
        </h2>
        <div className="flex items-center gap-2">
           {!apiKey && <span className="text-[10px] text-red-500 font-bold mr-2">KEY MISSING</span>}
           <div className="text-[10px] text-gray-500">MODEL: GEMINI-2.5-FLASH</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 text-amber-500">
                <Bot size={16} />
              </div>
            )}
            
            <div className={`max-w-[70%] p-3 rounded text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-amber-900/30 text-gray-100 border border-amber-900/50' 
                : 'bg-gray-900 text-gray-300 border border-gray-800'
            }`}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0 min-h-[1em]">{line}</p>
              ))}
              <div className="mt-2 text-[9px] opacity-40 text-right">
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 text-amber-500">
                <Bot size={16} />
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-800">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-slate-950 text-white rounded border border-gray-700 pl-4 pr-12 py-3 focus:border-amber-500 outline-none font-sans"
            placeholder="Ask about NII trends, Provision coverage, or specific bank comparisons..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-amber-500 transition-colors"
            onClick={handleSend}
            disabled={loading}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-gray-600 font-mono text-center">
          AI can make mistakes. Verify important data in the 'Peer Analysis' tab.
        </div>
      </div>
    </div>
  );
};
