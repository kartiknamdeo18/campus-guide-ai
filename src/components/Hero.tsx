import React from 'react';
import { MessageSquareText, Search, BookOpen, CheckCircle2, Languages, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onStartChat: (initialQuery?: string) => void;
  onExploreFAQs: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartChat, onExploreFAQs }) => {
  const [quickQuery, setQuickQuery] = React.useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onStartChat(quickQuery.trim());
    } else {
      onStartChat();
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white py-12 lg:py-20 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & Direct Query Box */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-800 bg-indigo-100/70 px-3 py-1 rounded-md">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Grounded in Official College Records & Academic Handbooks</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
              Your College. Your Questions. One Smart Assistant.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Get quick answers about college services, scholarships, examinations, events, and student life — grounded in verified policies with smart English language intelligence.
            </p>

            {/* Quick Ask Box */}
            <form onSubmit={handleQuickSubmit} className="pt-2">
              <div className="relative flex items-center max-w-xl bg-white rounded-xl shadow-sm border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-1.5">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Ask a question (e.g. 'What is the attendance rule?' or 'Library timings')"
                  className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 transition-colors shadow-sm"
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </button>
              </div>
            </form>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onStartChat()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Ask CampusGuide AI</span>
              </button>

              <button
                onClick={onExploreFAQs}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Explore FAQs</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200/80 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Evidence-Backed Answers</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Verified English Knowledge</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero Hallucinations Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 group">
              <img
                src="/src/assets/images/campus_hero_banner_1793167539288.jpg"
                alt="University students learning commons and campus information point"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-300 mb-1">
                  Central Campus Knowledge Hub
                </div>
                <div className="text-sm font-semibold leading-snug">
                  Integrated Student Services, Circulars & Regulation Handbooks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
