// =============================================================================
// File: frontend/src/pages/public/FaqPage.tsx
// Purpose: Public frequently asked questions with interactive accordion toggles
// =============================================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const FaqPage: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const faqs: FaqItem[] = [
    {
      category: 'GENERAL',
      question: 'What is the purpose of InternTrack?',
      answer: 'InternTrack is designed to structure, compute, and validate student internships. It coordinates university requirements, student reports, and mentor-led projects under a single transparent progress-tracking platform.',
    },
    {
      category: 'INTERN',
      question: 'How do I log my daily hours and attendance?',
      answer: 'When you log into your Intern dashboard, you can check in to log your active session and log out to complete it. The system automatically computes your daily hours and updates your attendance percentage.',
    },
    {
      category: 'INTERN',
      question: 'How do daily reports work?',
      answer: 'At the end of each working day, you are required to submit a report outlining your hours worked and achievements. Your mentor will inspect and set the status to Approved or Rejected. If rejected, you can review comments and resubmit.',
    },
    {
      category: 'MENTOR',
      question: 'Can mentors create projects and assign milestones?',
      answer: 'Yes. Mentors can create specific project guides, specify total durations, write description tasks, and assign milestones. Mentors approve or reject milestone submissions in real-time.',
    },
    {
      category: 'GENERAL',
      question: 'How are percentage metrics calculated?',
      answer: 'To ensure precision, all metric percentages (such as attendance rate, milestone completion, and project progress) are calculated dynamically on the backend and rounded to exactly two decimal places using standard rounding formulas.',
    },
    {
      category: 'COMPLIANCE',
      question: 'What happens if I fail to meet the required hours?',
      answer: 'Admins set a required hours threshold for each intern. If computed attendance hours fall short, the backend triggers compliance warnings for intervention, which are visible to admins and mentors.',
    },
    {
      category: 'COMPLIANCE',
      question: 'When is the internship completion certificate generated?',
      answer: 'Certificate generation is triggered on completion validation. Once all milestone goals are checked off and required hours are verified, the system validates the status change for completion certificate release.',
    },
  ];

  const categories = ['ALL', 'GENERAL', 'INTERN', 'MENTOR', 'COMPLIANCE'];

  const filteredFaqs = filterCategory === 'ALL'
    ? faqs
    : faqs.filter(faq => faq.category === filterCategory);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-base text-slate-400">
            Find answers to common operational questions, portal rules, and grading metrics.
          </p>
        </div>

        {/* Categories Filter Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCategory(cat);
                setExpandedIndex(null); // Reset accordion state when filter changes
              }}
              className={`px-4.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                filterCategory === cat
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div 
                  key={index} 
                  className={`rounded-2xl border transition-all duration-300 ${
                    isExpanded 
                      ? 'bg-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-950/20' 
                      : 'bg-slate-900/45 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(index)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <span className="text-base font-bold text-slate-200 hover:text-indigo-300 transition-colors">
                      {faq.question}
                    </span>
                    <span className="ml-4 p-1.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-slate-850/60 pt-4">
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                      <div className="mt-3.5 flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                          Category: {faq.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500">
              No questions found in this category.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
