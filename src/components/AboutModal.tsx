import React from 'react';
import { X, ShieldCheck, Cpu, Database, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">About CampusGuide AI</h3>
              <p className="text-xs text-slate-500">Architecture, RAG Pipeline & Safety Philosophy</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <span>Core Principle: Zero Hallucinations</span>
            </div>
            <p>
              Unlike generic chatbot assistants that guess answers to policies and fees, CampusGuide AI adheres to a strict grounding protocol: it uses retrieved verified passages from official handbooks and FAQs as its only source of truth. If verified evidence is not found, it honestly declines to invent rules and prompts students to contact the appropriate administrative department.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Configurable Model Core</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Powered by the configured Gemma 4 / Gemini model via the official <code className="text-indigo-700">@google/genai</code> SDK, with server-side proxy isolation protecting all credentials.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>RAG Retrieval Engine</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Extracts and segments PDF, TXT, and CSV documents into semantic chunks with relevance scoring and threshold filtering.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-slate-900 text-sm">Key Capabilities</h4>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Evidence-Grounded Intelligence:</strong> High-precision natural-language Q&A grounded in official English college records.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Source Provenance:</strong> Every factual answer includes citations to handbook sections, rule numbers, or FAQ IDs.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Admin Review Queue:</strong> Unanswered inquiries are logged so university staff can verify new policies and publish FAQs with one click.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>CampusGuide AI v1.0 · College Hackathon Edition</span>
            <span>All demonstration records clearly labeled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
