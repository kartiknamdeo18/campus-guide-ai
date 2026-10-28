import React from 'react';
import {
  GraduationCap,
  CreditCard,
  Award,
  FileCheck,
  UserCheck,
  Library,
  Home,
  Briefcase,
  Calendar,
  LifeBuoy,
  ArrowRight
} from 'lucide-react';

interface CategoryCardsProps {
  onSelectCategory: (category: string) => void;
  onAskCategory: (category: string, samplePrompt: string) => void;
}

export const CATEGORIES_CONFIG = [
  {
    name: 'Admissions',
    description: 'Eligibility criteria, intake quotas, entrance scores & document verification',
    icon: GraduationCap,
    samplePrompt: 'What are the admission eligibility requirements for undergraduate programs?'
  },
  {
    name: 'Fees and Payments',
    description: 'Semester tuition fees, online payment portal, installments & refund rules',
    icon: CreditCard,
    samplePrompt: 'How do I pay semester tuition and examination fees online?'
  },
  {
    name: 'Scholarships',
    description: 'Merit-based financial aid, government schemes, deadlines & application',
    icon: Award,
    samplePrompt: 'How do I apply for a college merit scholarship?'
  },
  {
    name: 'Examinations',
    description: 'Schedules, hall tickets, grading schemes, supplementary exams & re-evaluation',
    icon: FileCheck,
    samplePrompt: 'Where can I find the semester examination timetable and hall ticket?'
  },
  {
    name: 'Attendance',
    description: '75% attendance rule, medical condonation procedures & leave approvals',
    icon: UserCheck,
    samplePrompt: 'What is the minimum attendance requirement to appear for exams?'
  },
  {
    name: 'Library',
    description: 'Operating hours, borrowing quotas, book renewals, digital catalog & study rooms',
    icon: Library,
    samplePrompt: 'What are the official college library operating hours and borrowing rules?'
  },
  {
    name: 'Hostel and Transport',
    description: 'Room allotment procedures, mess facilities, campus bus routes & transport passes',
    icon: Home,
    samplePrompt: 'What is the procedure for campus hostel room allotment and bus routes?'
  },
  {
    name: 'Placements and Internships',
    description: 'Campus recruitment drives, training workshops, resume criteria & partner firms',
    icon: Briefcase,
    samplePrompt: 'How do I register for campus placement drives and internships?'
  },
  {
    name: 'College Events',
    description: 'Annual fests, academic conferences, cultural celebrations & club activities',
    icon: Calendar,
    samplePrompt: 'When is the next major college fest or hackathon?'
  },
  {
    name: 'Student Services',
    description: 'Duplicate ID cards, grievance redressal, health clinic & anti-ragging support',
    icon: LifeBuoy,
    samplePrompt: 'How can I obtain a replacement college ID card?'
  }
];

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  onSelectCategory,
  onAskCategory
}) => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1">
              Knowledge Base Navigation
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quick-Access Campus Categories
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Click any category to browse verified answers or launch an instant inquiry with the AI assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CATEGORIES_CONFIG.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                className="group relative bg-slate-50/70 hover:bg-white rounded-xl p-5 border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-1.5">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={() => onSelectCategory(cat.name)}
                    className="text-slate-600 hover:text-indigo-700 transition-colors"
                  >
                    View FAQs
                  </button>

                  <button
                    onClick={() => onAskCategory(cat.name, cat.samplePrompt)}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                    title={`Ask AI about ${cat.name}`}
                  >
                    <span>Ask AI</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
