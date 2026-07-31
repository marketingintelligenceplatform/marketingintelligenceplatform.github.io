import React from "react";
import { ArrowRight, BarChart3, Database, Shield, BrainCircuit, Sparkles, Globe, Layers, TrendingUp, Users, Target, CheckCircle2 } from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div id="landing-container" className="min-h-screen bg-[#0D0B14] text-[#F8FAFC] font-sans overflow-x-hidden relative flex flex-col selection:bg-[#7C3AED] selection:text-white">
      {/* Ambient Background Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7C3AED] opacity-[0.12] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#A855F7] opacity-[0.10] blur-[170px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] rounded-full bg-[#A855F7] opacity-[0.08] blur-[100px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={onEnterApp}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#C084FC] p-[1.5px] transition-transform duration-500 group-hover:scale-105">
            <div className="w-full h-full bg-[#161122] rounded-[10px] flex items-center justify-center">
              <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] to-[#7C3AED] text-lg">M</span>
            </div>
          </div>
          <div>
            <h1 className="font-display font-semibold text-[#F8FAFC] tracking-tight text-base leading-none">MIP Platform</h1>
            <p className="text-[#94A3B8] font-mono text-[9px] uppercase tracking-wider leading-none mt-1">Marketing Intelligence Platform</p>
          </div>
        </div>

        <button 
          onClick={onEnterApp}
          className="px-5 py-2.5 rounded-xl font-medium text-xs bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white shadow-lg shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/40 hover:-translate-y-[1px] transition-all duration-300 flex items-center gap-2 cursor-pointer"
        >
          Launch Platform <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12 z-10 w-full">
        {/* Left Headline & Overview */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#7C3AED]/15 border border-[#7C3AED]/30 px-3.5 py-1.5 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#C084FC] font-semibold">For Business Owners & Growth Teams</span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F8FAFC] leading-[1.15]">
            The All-In-One{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#7C3AED]">
              Marketing Intelligence
            </span>{" "}
            & Lead CRM
          </h1>

          <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed max-w-xl">
            MIP provides business leaders, marketing directors, and sales managers with full visibility into their sales pipeline, acquisition channels, and revenue conversion metrics. Turn raw lead data into actionable business growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onEnterApp}
              className="px-6 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] rounded-xl font-medium text-xs text-white flex items-center justify-center gap-2 shadow-xl shadow-[#7C3AED]/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              Open Dashboard Workspace <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3.5 bg-[#161122]/90 hover:bg-[#1F1830] text-[#F8FAFC] border border-[#1F1830] hover:border-[#7C3AED]/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-300"
            >
              Learn How MIP Helps Your Business
            </a>
          </div>

          {/* Core Benefit Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="bg-[#161122]/60 border border-[#1F1830] p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-[#7C3AED]/10 rounded-lg shrink-0">
                <Layers className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h4 className="font-medium text-xs font-display text-white">Visual Sales Funnel</h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">Track prospects from initial contact to closed deal with custom stages.</p>
              </div>
            </div>

            <div className="bg-[#161122]/60 border border-[#1F1830] p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-[#7C3AED]/10 rounded-lg shrink-0">
                <BarChart3 className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h4 className="font-medium text-xs font-display text-white">Marketing Channel ROI</h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">Measure campaign spend, conversion rates, and cost per acquisition.</p>
              </div>
            </div>

            <div className="bg-[#161122]/60 border border-[#1F1830] p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-[#7C3AED]/10 rounded-lg shrink-0">
                <BrainCircuit className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h4 className="font-medium text-xs font-display text-white">Gemini AI Assistant</h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">Ask questions in plain English to get instant insights on revenue and leads.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
          <div className="absolute inset-0 bg-[#7C3AED]/10 rounded-3xl blur-3xl" />
          <div className="relative w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl border border-white/5 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">Illustrative product preview</span>
              </div>
              <span className="font-mono text-[9px] text-[#94A3B8] uppercase">Example view</span>
            </div>

            {/* Simulated Live Analytics Graph Card */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Funnel Revenue Performance</span>
              <div className="h-28 bg-[#0D0B14]/80 rounded-xl relative flex items-end justify-between p-4 border border-white/5 overflow-hidden">
                <div className="absolute top-2 left-3">
                  <span className="text-[10px] text-gray-400">Monthly Growth</span>
                  <p className="font-display font-semibold text-sm leading-tight text-[#C084FC]">+28.5% Revenue</p>
                </div>

                {/* Aesthetic Bars */}
                <span className="w-2.5 h-[35%] bg-[#2E2047] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[50%] bg-[#362553] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[60%] bg-[#402B61] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[75%] bg-[#58378E] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[80%] bg-[#7C3AED]/70 rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[95%] bg-gradient-to-t from-[#7C3AED] to-[#C084FC] rounded-sm transition-all" />
              </div>
            </div>

            {/* Quick Metrics Stats */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-[#161122]/80 border border-white/5 p-3 rounded-xl">
                <span className="text-[9px] text-[#94A3B8] block uppercase">Active Pipeline Value</span>
                <span className="text-sm font-semibold text-[#F8FAFC] font-display">$185,000</span>
              </div>
              <div className="bg-[#161122]/80 border border-white/5 p-3 rounded-xl">
                <span className="text-[9px] text-[#94A3B8] block uppercase">Win Ratio</span>
                <span className="text-sm font-semibold text-[#C084FC] font-display">68% Conversion</span>
              </div>
            </div>

            {/* Roles Picker Peek */}
            <div className="bg-[#161122]/60 p-3 rounded-xl border border-white/5 space-y-2">
              <span className="text-[9px] text-gray-400 uppercase block font-medium">Built For Multi-Role Collaboration</span>
              <div className="flex gap-1.5 text-[8px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/30">Exec / Admin</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">Marketing Lead</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">Sales Rep</span>
              </div>
            </div>

            <button
              onClick={onEnterApp}
              className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white rounded-xl font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-[#7C3AED]/20 group cursor-pointer"
            >
              Enter MIP Platform
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>

      {/* Business Owner Educational Section */}
      <section id="how-it-works" className="w-full bg-[#161122]/80 border-t border-[#1F1830] py-16 px-6 z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-mono text-[9px] tracking-wider uppercase text-[#C084FC] font-semibold">How MIP Drives Business Success</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#F8FAFC]">Built for Clarity, Efficiency, and Scale</h2>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              Whether you are running a boutique agency, an e-commerce brand, a B2B consultancy, or a growing enterprise, MIP provides the tools to manage leads and optimize marketing investments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-6 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 text-[#C084FC] font-bold text-sm flex items-center justify-center font-mono">1</div>
              <h3 className="font-display font-semibold text-base text-white">Capture & Organize Prospects</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Add leads from any channel (Organic Search, LinkedIn, Paid Ads, Referrals), set contact details, and assign deal values to maintain a structured customer database.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-6 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 text-[#C084FC] font-bold text-sm flex items-center justify-center font-mono">2</div>
              <h3 className="font-display font-semibold text-base text-white">Track the Sales Pipeline</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Move deals through defined sales stages—from Discovery and Proposal to Won Deals—with real-time conversion scoring and follow-up reminders.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-6 rounded-2xl space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 text-[#C084FC] font-bold text-sm flex items-center justify-center font-mono">3</div>
              <h3 className="font-display font-semibold text-base text-white">Optimize Campaign ROI</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Evaluate marketing campaign budgets against actual sales results. Run statistical confidence checks to identify your highest-performing acquisition sources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="w-full bg-[#0D0B14] py-16 px-6 z-10 border-t border-[#1F1830]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="font-mono text-[9px] tracking-wider uppercase text-[#C084FC] font-semibold">Core Capabilities</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#F8FAFC]">Complete Growth Toolkit</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Lead Management Block */}
            <div className="bg-[#161122] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 text-white">1. CRM Lead Management</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">Full lead profiles, search filters, activity logs, and editing capabilities to keep your contact list accurate and up-to-date.</p>
            </div>

            {/* Funnel Tracking Block */}
            <div className="bg-[#161122] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 text-white">2. Visual Funnel Pipeline</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">Drag and drop or transition leads through custom funnel stages, track stage conversion probability, and estimate forecasted revenue.</p>
            </div>

            {/* Statistical Block */}
            <div className="bg-[#161122] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 text-white">3. Analytics & Decision Engine</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">A/B testing, statistical hypothesis calculations, confidence intervals, and multi-currency formatting for international operations.</p>
            </div>

            {/* AI Integration Block */}
            <div className="bg-[#161122] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 text-white">4. Gemini AI Copilot</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">Conversational AI query bar for real-time dashboard data exploration, lead scoring recommendations, and growth suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#0D0B14] border-t border-[#1F1830] py-8 text-center text-[11px] text-[#94A3B8]/80 space-y-2 z-10 mt-auto">
        <p className="font-medium text-gray-300">
          Marketing Intelligence Platform (MIP)
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#94A3B8]/40">
          Enterprise Revenue & Pipeline Operating System
        </p>
      </footer>
    </div>
  );
}
