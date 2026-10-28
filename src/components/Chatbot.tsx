import React from 'react';
import {
  Send,
  Trash2,
  PlusCircle,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Languages,
  BookOpen,
  AlertCircle,
  Building2,
  FileText
} from 'lucide-react';
import { ChatMessage, ChatSource } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ChatbotProps {
  initialQuestion?: string;
  onClearInitialQuestion?: () => void;
}

const STARTER_QUESTIONS = [
  { text: 'What are the library timings?' },
  { text: 'How do I apply for a scholarship?' },
  { text: 'Where can I find the examination timetable?' },
  { text: 'What is the attendance requirement?' },
  { text: 'When is the next college event?' },
  { text: 'How do I contact the placement cell?' },
  { text: 'How can I obtain my college ID card?' },
  { text: 'What are the hostel application procedures?' }
];

export const Chatbot: React.FC<ChatbotProps> = ({
  initialQuestion,
  onClearInitialQuestion
}) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am CampusGuide AI, your verified college information assistant. Ask me questions about admissions, exams, scholarships, fees, library rules, hostel services, and campus events.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_grounded: true
    }
  ]);
  const [inputQuery, setInputQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle incoming initial question from hero or cards
  React.useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      sendMessage(initialQuestion.trim());
      if (onClearInitialQuestion) onClearInitialQuestion();
    }
  }, [initialQuestion]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsgId = 'user-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.askChatbot(query, 'en');

      const assistantMsg: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_grounded: response.is_grounded,
        sources: response.sources,
        department_contact: response.department_contact
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          err.message ||
          'Unable to reach the campus knowledge service. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Conversation reset. Ask any question regarding official college guidelines, fees, schedules, or facilities.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_grounded: true
      }
    ]);
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">CampusGuide AI Assistant</h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3" />
                  <span>RAG Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grounded in verified handbooks, circulars & official FAQs
              </p>
            </div>
          </div>

          {/* Controls: Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/40">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {/* Bubble Content */}
                  <p className="text-sm leading-relaxed whitespace-pre-line font-normal">
                    {msg.content}
                  </p>

                  {/* Grounding & Evidence Box */}
                  {!isUser && !msg.isError && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Verified Evidence & Sources ({msg.sources.length})</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-xs text-slate-600 space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="truncate">{src.reference}</span>
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {src.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 italic line-clamp-2">
                              "{src.excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback Notice if not grounded */}
                  {!isUser && !msg.isError && msg.is_grounded === false && (
                    <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Honest Verification Notice</div>
                        <div>This answer could not be verified in official records. Please consult the department.</div>
                      </div>
                    </div>
                  )}

                  {/* Department Channel if provided */}
                  {msg.department_contact && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 bg-indigo-50/60 p-2 rounded-lg">
                      <Building2 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>Contact: <strong className="text-slate-800">{msg.department_contact}</strong></span>
                    </div>
                  )}

                  {/* Footer Bar: Timestamp & Copy / Retry */}
                  <div
                    className={`mt-3 flex items-center justify-between text-[11px] ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    <div className="flex items-center gap-2">
                      {!isUser && !msg.isError && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                          title="Copy Answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      {msg.isError && (
                        <button
                          onClick={retryLastMessage}
                          className="flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs p-3 bg-white rounded-xl border border-slate-200/80 w-fit">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
              </div>
              <span className="font-medium text-slate-600">Searching verified campus documents...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starter Questions (Chips) */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto whitespace-nowrap no-scrollbar flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {STARTER_QUESTIONS.map((sq, i) => (
            <button
              key={i}
              onClick={() => sendMessage(sq.text)}
              disabled={isLoading}
              className="text-xs text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors shrink-0 disabled:opacity-50"
            >
              {sq.text}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about college guidelines, exam dates, fees, library rules (Press Enter to send)..."
                rows={2}
                disabled={isLoading}
                className="w-full resize-none px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors text-slate-900 placeholder-slate-400 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-colors shadow-xs shrink-0 flex items-center justify-center"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
            <span>Powered by configured Gemma / Gemini model</span>
            <span>·</span>
            <span>Zero Hallucinations: Non-verified answers trigger an honest fallback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
