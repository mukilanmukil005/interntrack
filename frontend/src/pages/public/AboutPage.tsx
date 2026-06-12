// =============================================================================
// File: frontend/src/pages/public/AboutPage.tsx
// Purpose: Public about page featuring mission statement, overview, and goals
// =============================================================================

import React from 'react';
import { Target, Award, Users, BookOpen } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const goals = [
    {
      icon: <Target className="h-6 w-6 text-indigo-400" />,
      title: 'Structural Milestones',
      description: 'Break complex internship projects down into modular, actionable targets that can be iteratively reviewed and signed off.',
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-400" />,
      title: 'Mentor Collaboration',
      description: 'Connect students directly with industry practitioners who approve logs, guide implementations, and provide reviews.',
    },
    {
      icon: <BookOpen className="h-6 w-6 text-indigo-400" />,
      title: 'Academic Validation',
      description: 'Provide colleges with immutable reports detailing attendance completion percentages and daily achievement logs.',
    },
    {
      icon: <Award className="h-6 w-6 text-indigo-400" />,
      title: 'Objective Grading',
      description: 'Remove bias and evaluate performance based on computed metrics, submitted reports, and completed deliverables.',
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            About InternTrack
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Bridging the gap between academic education and real-world execution through structured, metric-driven tracking.
          </p>
        </div>

        {/* Mission Section */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 mb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="max-w-3xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Our Mission</h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              "To make internship evaluations objective, collaborative, and transparent."
            </p>
            <p className="mt-6 text-slate-400 leading-relaxed text-base sm:text-lg">
              We believe internships are the foundation of professional growth. However, many programs lack structured review loops, transparent attendance tracking, and modular project guidelines. InternTrack builds a transparent software bridge that enables interns to log milestones, mentors to approve tasks, and universities to verify hour requirements instantly.
            </p>
          </div>
        </section>

        {/* Overview Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              A Unified Ecosystem for All Stakeholders
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              InternTrack organizes a chaotic, multi-party process into a single, clean workspace. Everyone involved gains real-time insight into progress and compliance.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-550/20 text-indigo-400 flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <h4 className="text-slate-200 font-semibold">For Interns</h4>
                  <p className="text-slate-400 text-sm mt-1">Submit daily achievements, track mandatory logged hours, and review milestone statuses.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-550/20 text-indigo-400 flex items-center justify-center font-bold text-xs">2</div>
                <div>
                  <h4 className="text-slate-200 font-semibold">For Mentors</h4>
                  <p className="text-slate-400 text-sm mt-1">Assign projects, review submissions, and provide guidance with structured approvals.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-550/20 text-indigo-400 flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <h4 className="text-slate-200 font-semibold">For Colleges & Admins</h4>
                  <p className="text-slate-400 text-sm mt-1">Track attendance averages, export program completions, and verify requirements instantly.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/15 transition duration-300"></div>
            <div className="relative p-8 rounded-3xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-bold text-slate-200 mb-6">InternTrack Performance Highlights</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Average Project Completion Rate</span>
                    <span className="font-semibold text-indigo-400">92.45%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '92.45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Daily Report Submission Compliance</span>
                    <span className="font-semibold text-indigo-400">88.12%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88.12%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Mentor Review Turnaround (&lt; 24h)</span>
                    <span className="font-semibold text-indigo-400">95.00%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">Our Core Design Principles</h2>
            <p className="mt-4 text-slate-400">
              Building a software environment designed around four major pillars of progress tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {goals.map((goal, index) => (
              <div key={index} className="flex gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-850 hover:bg-slate-900/80 transition-all">
                <div className="p-3 bg-slate-950 h-fit rounded-xl border border-slate-800 text-indigo-400">
                  {goal.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{goal.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{goal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
