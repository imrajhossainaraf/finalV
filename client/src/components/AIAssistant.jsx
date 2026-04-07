import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  Bot, 
  User, 
  Loader2, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AIAssistant() {
  const { students, attendance, triggerBulkNotice, sendManualNotice } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Attendly AI. How can I help you manage your attendance records today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Voice Recognition Setup
  const processAIAction = useCallback((text) => {
    const actionMatch = text.match(/@@ACTION:(.*?)@@/);
    if (!actionMatch) return;

    try {
      const action = JSON.parse(actionMatch[1]);
      console.log('🤖 AI identified action:', action);

      if (action.type === 'send_email') {
        const student = students.find(s => 
          s.name.toLowerCase().includes(action.target.toLowerCase()) || 
          s.uid === action.target
        );

        if (student) {
          sendManualNotice(student, action.message);
          toast.info(`AI Triggered: Sending email to ${student.name}`);
        } else {
          toast.warn(`AI couldn't find student: ${action.target}`);
        }
      } else if (action.type === 'bulk_notice') {
          const today = new Date().toISOString().split('T')[0];
          triggerBulkNotice(today);
          toast.info('AI Triggered: Sending bulk notifications for today.');
      }
    } catch (e) {
      console.error('Failed to parse AI action:', e);
    }
  }, [students, sendManualNotice, triggerBulkNotice]);

  const handleSend = useCallback(async (forcedInput = null) => {
    const text = forcedInput || input;
    if (!text.trim()) return;

    // No longer blocking here; the backend will use its .env key if needed.
    const newUserMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5002/api/chat', {
        message: text,
        context: { students, attendance },
        config: { provider, apiKey }
      });

      const reply = response.data.reply;
      
      processAIAction(reply);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply.replace(/@@ACTION:.*?@@/g, '').trim() 
      }]);
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${err.response?.data?.error || err.message}. Please check your API key or if the AI service is running on port 5002.` 
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, apiKey, provider, students, attendance, processAIAction]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error(`Voice error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [handleSend]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error('Voice recognition not supported in this browser.');
        return;
      }
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const saveSettings = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', apiKey);
    setShowSettings(false);
    toast.success('AI Settings Saved!');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className="mb-4 w-[380px] h-[550px] rounded-3xl overflow-hidden flex flex-col animate-scale-in"
          style={{
            background: 'var(--attendly-bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--attendly-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between"
            style={{ 
              background: 'var(--attendly-gradient-primary)',
              color: 'white'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">Attendly AI</h3>
                <span className="text-[10px] opacity-80">Online & Listening</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Settings Panel Overlay */}
          {showSettings && (
            <div className="absolute inset-x-0 top-[64px] bottom-0 z-10 p-6 flex flex-col" style={{ background: 'var(--attendly-bg-card)' }}>
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Settings size={16} /> AI Configuration
              </h4>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs text-muted block mb-1.5">AI Provider</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-[var(--attendly-bg-elevated)] border border-[var(--attendly-border)] rounded-xl px-4 py-2 text-sm"
                  >
                    <option value="gemini">Google Gemini (Flash)</option>
                    <option value="openrouter">OpenRouter (Free Models)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1.5">API Key</label>
                  <input 
                    type="password"
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[var(--attendly-bg-elevated)] border border-[var(--attendly-border)] rounded-xl px-4 py-2 text-sm"
                  />
                  <p className="text-[10px] text-muted mt-2 leading-relaxed">
                    Keys are stored locally in your browser and never sent anywhere except our private AI service on port 5002.
                  </p>
                </div>
              </div>

              <button 
                onClick={saveSettings}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save & Continue
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white border-br-none' 
                      : 'bg-[var(--attendly-bg-elevated)] border border-[var(--attendly-border)] text-br-none'
                  }`}
                  style={{
                    borderBottomRightRadius: m.role === 'user' ? '4px' : '20px',
                    borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '20px',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[var(--attendly-bg-elevated)] border border-[var(--attendly-border)] p-3 rounded-2xl flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black/10 border-t border-[var(--attendly-border)]">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Attendly AI..."
                  className="w-full bg-[var(--attendly-bg-elevated)] border border-[var(--attendly-border)] rounded-xl pl-4 pr-10 py-2.5 text-sm"
                />
                <button 
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isListening ? 'text-red-500 bg-red-500/10' : 'text-muted hover:bg-white/5'
                  }`}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90"
        style={{
          background: 'var(--attendly-gradient-primary)',
          boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
          transform: isOpen ? 'rotate(90deg)' : 'none'
        }}
      >
        {isOpen ? <X size={28} /> : <Bot size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[var(--attendly-bg-base)] animate-pulse" />
        )}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--attendly-border);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
