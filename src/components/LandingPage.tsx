import React from "react";
import { ArrowRight, BarChart3, Database, Shield, BrainCircuit, Sparkles, Send, Globe, Layers } from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div id="landing-container" className="min-h-screen bg-[#0D0B14] text-[#F8FAFC] font-sans overflow-x-hidden relative flex flex-col selection:bg-[#7C3AED] selection:text-white">
      {/* Cinematic Ambient Glow Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7C3AED] opacity-[0.12] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#A855F7] opacity-[0.10] blur-[170px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] rounded-full bg-[#A855F7] opacity-[0.08] blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#C084FC] p-[1.5px] transition-transform duration-500 group-hover:rotate-12">
            <div className="w-full h-full bg-[#161122] rounded-[10px] flex items-center justify-center">
              <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] to-[#7C3AED] text-lg">M</span>
            </div>
          </div>
          <div>
            <h1 className="font-display font-semibold text-[#F8FAFC] tracking-tight text-base leading-none">MIP Enterprise</h1>
            <p className="text-[#94A3B8] font-mono text-[9px] uppercase tracking-wider leading-none mt-1">Ma Creatives Studio</p>
          </div>
        </div>

        <button 
          onClick={onEnterApp}
          className="px-5 py-2.5 rounded-xl font-medium text-xs bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white shadow-lg shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/40 hover:-translate-y-[1px] transition-all duration-300 flex items-center gap-2"
        >
          Access Platform <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-10 z-10 w-full">
        {/* Left Intro Text */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rgba(124,58,237,0.15) to-rgba(192,132,252,0.15) border border-[#7C3AED]/20 px-3.5 py-1.5 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#C084FC] font-semibold">Enterprise Hub Beta v1.0</span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#F8FAFC] leading-[1.1]">
            The System of Record for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#7C3AED]">
              Conversion Deciders
            </span>
          </h1>

          <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed max-w-xl">
            A premium business intelligence, sales funnel tracker, CRM, and applied statistics platform built to capture customer lifecycles and enable real-time machine learning conversions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onEnterApp}
              className="px-6 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] rounded-xl font-medium text-xs text-white flex items-center justify-center gap-2 shadow-xl shadow-[#7C3AED]/30 hover:scale-[1.02] transition-all duration-300"
            >
              Sign In to Environment <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://stephenkimaru.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#161122]/90 hover:bg-[#1F1830] text-[#F8FAFC] border border-[#1F1830]-hover hover:border-[#7C3AED]/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-300"
            >
              <Globe className="w-4 h-4 text-[#C084FC]" /> Explorer Portfolio
            </a>
          </div>

          {/* Quick Pillar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="bg-[#161122]/50 border border-[#1F1830] p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-[#7C3AED]/10 rounded-lg shrink-0">
                <Layers className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h4 className="font-medium text-xs font-display">Funnel Tracking</h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">Visual interactive pipeline of client stages.</p>
              </div>
            </div>

            <div className="bg-[#161122]/50 border border-[#1F1830] p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-[#7C3AED]/10 rounded-lg shrink-0">
                <BarChart3 className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h4 className="font-medium text-xs font-display">Applied Stats</h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">Confidence interval bounds and A/B trials inside.</p>
              </div>
            </div>

            <div className="bg-[#161122]/50 border border-[#1F1830] p-4 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-[#7C3AED]/10 rounded-lg shrink-0">
                <BrainCircuit className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h4 className="font-medium text-xs font-display">AI Copilot Core</h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">Dynamic Gemini dashboard query processing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Glassmorphism Interactive Console Card */}
        <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
          <div className="absolute inset-0 bg-[#7C3AED]/10 rounded-3xl blur-3xl" />
          <div className="relative w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl border border-white/5 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">Engine Healthy</span>
              </div>
              <span className="font-mono text-[9px] text-[#94A3B8] uppercase">CRM Pipeline v0.9</span>
            </div>

            {/* Simulated Live Analytics Graph Card */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Conversion Metrics</span>
              <div className="h-28 bg-[#0D0B14]/80 rounded-xl relative flex items-end justify-between p-4 border border-white/5 overflow-hidden">
                <div className="absolute top-2 left-3">
                  <span className="text-[10px] text-gray-400">Winning Trend</span>
                  <p className="font-display font-semibold text-sm leading-tight text-[#C084FC]">+24.3%</p>
                </div>

                {/* Aesthetic Bars */}
                <span className="w-2.5 h-[30%] bg-[#2E2047] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[45%] bg-[#362553] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[50%] bg-[#402B61] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[75%] bg-[#58378E] rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[65%] bg-[#7C3AED]/70 rounded-sm duration-300 hover:bg-[#7C3AED]" />
                <span className="w-2.5 h-[90%] bg-gradient-to-t from-[#7C3AED] to-[#C084FC] rounded-sm transition-all" />
              </div>
            </div>

            {/* Quick Metrics Stats */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-[#161122]/80 border border-white/5 p-3 rounded-xl">
                <span className="text-[9px] text-[#94A3B8] block uppercase">Est. Portfolio</span>
                <span className="text-sm font-semibold text-[#F8FAFC] font-display">$251,400</span>
              </div>
              <div className="bg-[#161122]/80 border border-white/5 p-3 rounded-xl">
                <span className="text-[9px] text-[#94A3B8] block uppercase">Avg. Deal Score</span>
                <span className="text-sm font-semibold text-[#C084FC] font-display">74.5 / 100</span>
              </div>
            </div>

            {/* Roles Picker Peek */}
            <div className="bg-[#161122]/60 p-3 rounded-xl border border-white/5 space-y-2">
              <span className="text-[9px] text-gray-400 uppercase block font-medium">Platform Roles configured</span>
              <div className="flex gap-1.5 text-[8px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 cursor-default text-[#C084FC] border border-[#7C3AED]/30">Admin</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">Marketer</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">Sales Agent</span>
              </div>
            </div>

            <button
              onClick={onEnterApp}
              className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white rounded-xl font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-[#7C3AED]/20 group"
            >
              Launch Dashboard Workspace
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>

      {/* Feature Objectives Section */}
      <section className="w-full bg-[#161122]/50 border-t border-[#1F1830] py-14 px-6 z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="font-mono text-[9px] tracking-wider uppercase text-[#C084FC] font-semibold">Analytical Objectives</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#F8FAFC]">System Deliverables & Architecture</h2>
            <p className="text-[#94A3B8] text-xs">MIP implements high-performance features split over strategic development phases.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Lead Management Block */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 hover:bg-[#1F1830]/70 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">1. Lead Lifecycle CRM</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">Continuous profile updates, customized activity documentation feeds, and granular field tracking matching Phase 1 outcomes.</p>
            </div>

            {/* Funnel Tracking Block */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 hover:bg-[#1F1830]/70 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">2. Pipeline Kanban</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">Dynamic state monitoring through customized stages, real-time conversion probability evaluations, and calculated stage revenues.</p>
            </div>

            {/* Statistical Block */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 hover:bg-[#1F1830]/70 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">3. Statistical Significance</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">A/B Testing significance computations. Graph of Dynamic central limit distributions, p-value diagnostics, and conversion confidence tables.</p>
            </div>

            {/* future ai integration block */}
            <div className="bg-[#1F1830]/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-[#7C3AED]/40 hover:bg-[#1F1830]/70 transition-all duration-300">
              <div className="text-[#C084FC] bg-[#7C3AED]/10 p-2.5 rounded-xl w-fit mb-4">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">4. Gemini Insight Engine</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">Server-side natural language interrogation pipeline allowing conversational queries on crm databases, lead scoring, and next action advice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#0D0B14] border-t border-[#1F1830] py-8 text-center text-[11px] text-[#94A3B8]/80 space-y-2 z-10 mt-auto">
        <p>
          Built by <a href="https://stephenkimaru.github.io" target="_blank" rel="noopener noreferrer" className="text-[#C084FC] hover:underline font-medium">Stephen Kimaru</a>
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#94A3B8]/40">
          Powered by Ma Creatives Studio · All Rights Reserved 2026
        </p>
      </footer>
    </div>
  );
}
