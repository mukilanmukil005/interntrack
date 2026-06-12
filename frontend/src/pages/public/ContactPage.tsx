// =============================================================================
// File: frontend/src/pages/public/ContactPage.tsx
// Purpose: Public contact page with static information and contact form layout
// =============================================================================

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Globe, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static form submission preview
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  const contactDetails = [
    {
      icon: <Mail className="h-5 w-5 text-indigo-400" />,
      label: 'Email Support',
      value: 'support@interntrack.edu',
      subtext: 'Get support on registration or logins.',
    },
    {
      icon: <Phone className="h-5 w-5 text-indigo-400" />,
      label: 'Phone helpline',
      value: '+1 (555) 019-2834',
      subtext: 'Mon-Fri from 9am to 5pm.',
    },
    {
      icon: <MapPin className="h-5 w-5 text-indigo-400" />,
      label: 'Office Headquarters',
      value: '100 Tech Park Drive, Suite 400',
      subtext: 'Silicon Valley, CA 94025',
    },
    {
      icon: <Globe className="h-5 w-5 text-indigo-400" />,
      label: 'Institutional Portal',
      value: 'www.interntrack.edu',
      subtext: 'Explore university integration docs.',
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Contact Support
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Have questions about system compliance or mentor assignments? Reach out to our coordination desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Static details column */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Get In Touch</h2>
            
            {contactDetails.map((detail, index) => (
              <div 
                key={index} 
                className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-all"
              >
                <div className="p-3 bg-slate-950 h-fit rounded-xl border border-slate-800 text-indigo-400">
                  {detail.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-350">{detail.label}</h4>
                  <p className="text-base font-bold text-slate-200 mt-1">{detail.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{detail.subtext}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form Layout (Static View) */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Send a Message</h2>
            <p className="text-sm text-slate-400 mb-6">
              Use the form below to compile inquiry details. Note: Contact forms are mock demonstrations only and will not store submissions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  id="subject"
                  required
                  placeholder="Inquiry about college dashboard access"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                ></textarea>
              </div>

              {formSubmitted && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
                  Success! Your mock submission was captured locally. (Email integration is disabled in this phase).
                </div>
              )}

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Send className="h-4 w-4" />
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
