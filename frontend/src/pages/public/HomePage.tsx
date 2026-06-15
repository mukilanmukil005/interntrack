// =============================================================================
// File: frontend/src/pages/public/HomePage.tsx
// Purpose: Public homepage displaying product hero, benefits, features, & CTA
// =============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  BarChart3, 
  Clock,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Clock className="h-6 w-6 text-indigo-400" />,
      title: 'Dynamic Attendance Logging',
      description: 'Log and track required internship hours in real time with automatic calculations.',
    },
    {
      icon: <BookOpen className="h-6 w-6 text-indigo-400" />,
      title: 'Weekly Progress & Reports',
      description: 'Easily submit daily reports and let mentors approve or request revisions instantly.',
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-indigo-400" />,
      title: 'Precision Analytics Engine',
      description: 'Rounding-precise computed metrics for attendance rates, milestone completions, and overall progress.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-indigo-400" />,
      title: 'Secure Role-Based Flow',
      description: 'Unique portals for students, mentors, and administrators to view reports, track goals, and manage progress.',
    },
  ];

  const faqs = [
    {
      question: 'What is InternTrack?',
      answer: 'InternTrack is a comprehensive management and tracking platform designed for colleges, organizations, mentors, and interns to measure attendance hours, evaluate daily project progress, and review milestone statuses.',
    },
    {
      question: 'How do I log my daily reports?',
      answer: 'As an intern, you can access your personal dashboard, input your daily achievements, hours worked, and submit them directly to your designated mentor for review and approval.',
    },
    {
      question: 'Who can approve my milestones?',
      answer: 'Your assigned project mentor is responsible for evaluating, giving feedback, and approving your milestone submissions or sending them back with revision notes.',
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 sm:pt-28 sm:pb-36 lg:pt-36 lg:pb-44">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-[250px] h-[250px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-6 animate-pulse">
              <span>Introducing InternTrack v1.0</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Track Internships with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
                Data-Driven Precision
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed">
              Standardize internship evaluations. Monitor hours logged, daily report submissions, and project milestones in one unified workspace.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all duration-200 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transform hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 rounded-xl bg-slate-900 text-slate-300 font-semibold border border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:text-white transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-slate-900 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Why Teams Choose InternTrack
            </h2>
            <p className="mt-4 text-slate-400">
              Eliminate paper logs and chaotic spreadsheets with structured, computed evaluations and review pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300 group"
              >
                <div className="p-3 bg-slate-950 w-fit rounded-xl border border-slate-800 group-hover:border-indigo-500/20 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview Section */}
      <section className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-400">
              Find quick answers to common questions about the InternTrack ecosystem.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-all">
                <h3 className="text-lg font-bold text-slate-200">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/faq" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
              View all FAQs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900/80 border border-indigo-500/20 text-center shadow-2xl shadow-indigo-900/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to streamline your internship program?
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Create a free student intern account today and begin documenting your reports, attendance, and project targets.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg"
              >
                Join as Intern
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-slate-900 text-slate-300 font-semibold border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
