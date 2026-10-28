import React from 'react';
import { GraduationCap, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenAdmin,
  onOpenAbout
}) => {
  const quickCategories = [
    'Admissions',
    'Fees and Payments',
    'Scholarships',
    'Examinations',
    'Attendance',
    'Library',
    'Hostel and Transport',
    'Placements and Internships',
    'College Events',
    'Student Services'
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Safety Note */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">CampusGuide AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Smart College FAQ Assistant providing evidence-grounded answers to academic and administrative queries in Hindi and English.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Grounded in official regulation handbooks with zero-guess safety.
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Campus Categories
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {quickCategories.slice(0, 5).map(c => (
                <button
                  key={c}
                  onClick={() => onSelectCategory(c)}
                  className="text-left hover:text-indigo-400 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Student Support Channels */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Official Channels
            </h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Student Services Desk: Block B, Room 102</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>helpdesk@campusguide.edu</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Helpline: Ext. 102 (Mon–Fri, 9am–5pm)</span>
              </div>
            </div>
          </div>

          {/* Col 4: Project Integrity & Admin */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              System Governance
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All demonstration policies and event records are clearly marked as verified educational samples for testing and evaluation.
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <button
                onClick={onOpenAbout}
                className="text-left text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Project Architecture & RAG Safety →
              </button>
              <button
                onClick={onOpenAdmin}
                className="text-left text-slate-400 hover:text-white"
              >
                Staff Administrator Login
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} CampusGuide AI. College Information Assistant v1.0.
          </div>
          <div className="flex items-center gap-4">
            <span>Privacy & Record Protection: Active</span>
            <span>·</span>
            <span>Gemma 4 Grounding Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
