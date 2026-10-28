import React from 'react';
import { Search, Filter, ChevronDown, ChevronUp, CheckCircle, FileText, Languages, MessageSquare } from 'lucide-react';
import { FAQ } from '../types/index.ts';

interface FAQExplorerProps {
  faqs: FAQ[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  onAskAIAboutFAQ: (question: string) => void;
}

export const FAQExplorer: React.FC<FAQExplorerProps> = ({
  faqs,
  selectedCategory,
  onSelectCategory,
  categories,
  onAskAIAboutFAQ
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Filter FAQs
  const filteredFAQs = React.useMemo(() => {
    return faqs.filter(faq => {
      // Category filter
      if (selectedCategory !== 'All' && faq.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section id="college-faqs" className="py-12 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1">
              Verified Knowledge Archive
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked College Questions
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800 tabular-nums">{filteredFAQs.length}</span> verified records
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs by keywords (e.g. scholarship, attendance, library hours, exam schedule)..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <button
              onClick={() => onSelectCategory('All')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">No matching FAQs found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
              We couldn't find any verified questions matching "{searchQuery}". Try different keywords or ask our AI assistant directly.
            </p>
            {searchQuery && (
              <button
                onClick={() => onAskAIAboutFAQ(searchQuery)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask AI About "{searchQuery}"</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 focus:outline-none"
                  >
                    <div className="space-y-1.5">
                      {/* Quiet unboxed metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="text-indigo-700 font-semibold">{faq.category}</span>
                        {faq.is_verified && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Verified Official Policy</span>
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>

                    <div className="p-1 rounded-md text-slate-400 hover:text-slate-600 shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>

                      <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Official Source: <span className="font-medium text-slate-700">{faq.source_reference}</span></span>
                        </div>

                        <div className="flex items-center gap-3">
                          {faq.review_date && (
                            <span>Review Date: {faq.review_date}</span>
                          )}
                          <button
                            onClick={() => onAskAIAboutFAQ(faq.question)}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ask AI to explain</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
