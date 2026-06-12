// =============================================================================
// File: frontend/src/pages/public/ProgramsPage.tsx
// Purpose: Public internship programs page listing durations and specialized domains
// =============================================================================

import React from 'react';
import { Calendar, Clock, Code, Layout, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProgramsPage: React.FC = () => {
  const staticPrograms = [
    {
      id: 'p1',
      title: 'Frontend Web Engineering',
      duration: 'THREE_MONTHS',
      reqHours: 120,
      icon: <Layout className="h-6 w-6 text-indigo-400" />,
      description: 'Master modern frontend structures. Learn responsive design pipelines, React state patterns, component orchestration, and Tailwind layouts.',
      objectives: ['React & TypeScript standard practices', 'Tailwind utility layouts', 'State lifecycle and API bindings', 'Code quality audits and builds'],
    },
    {
      id: 'p2',
      title: 'Backend Systems & API Design',
      duration: 'THREE_MONTHS',
      reqHours: 120,
      icon: <Code className="h-6 w-6 text-indigo-400" />,
      description: 'Build enterprise-ready database architectures. Design RESTful APIs, validate payloads with Zod, and establish RBAC route middlewares.',
      objectives: ['Node.js & Express frameworks', 'MySQL database modeling with Prisma', 'JWT token storage & RBAC validations', 'Performance optimizations & loggers'],
    },
    {
      id: 'p3',
      title: 'DevOps & Cloud Systems',
      duration: 'ONE_MONTH',
      reqHours: 40,
      icon: <ShieldAlert className="h-6 w-6 text-indigo-400" />,
      description: 'Introduction to pipeline operations. Understand CI/CD build scripts, server deployment workflows, and container configurations.',
      objectives: ['GitHub Actions automations', 'Docker containerized images', 'Cloud services setup', 'Health monitoring tools'],
    },
    {
      id: 'p4',
      title: 'Applied Intelligence Engineering',
      duration: 'THREE_MONTHS',
      reqHours: 120,
      icon: <Cpu className="h-6 w-6 text-indigo-400" />,
      description: 'Integrate artificial intelligence workflows into modern web properties. Train, validate, and query cognitive models via structured micro-services.',
      objectives: ['Data preparation pipelines', 'Supervised learning applications', 'Model API endpoint integrations', 'Inference latency monitoring'],
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Internship Programs
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Choose from our highly structured, objective-driven curriculum plans. Every track is monitored via computed milestone completions.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {staticPrograms.map((program) => (
            <div 
              key={program.id}
              className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header Icon + Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-indigo-500/20 transition-all duration-300">
                    {program.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {program.title}
                    </h3>
                    <div className="flex gap-4 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        {program.duration === 'THREE_MONTHS' ? '3 Months' : '1 Month'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        {program.reqHours} Hours Required
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {program.description}
                </p>

                {/* Key Learning Objectives */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-350 uppercase tracking-widest mb-3">Key Learnings</h4>
                  <ul className="space-y-2">
                    {program.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom CTA for program */}
              <div className="pt-6 border-t border-slate-850">
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-all duration-200"
                >
                  Apply for this track
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Note info box */}
        <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 text-center max-w-3xl mx-auto">
          <p className="text-sm text-indigo-300 leading-relaxed">
            Note: Standard program durations and hour obligations are defined globally by University guidelines. During registration, your profile is initially placed in a pending status until a project and mentor are officially assigned.
          </p>
        </div>
      </div>
    </div>
  );
};
