import React, { useState } from "react";
import { Building2, CheckCircle2, LogOut, Sparkles } from "lucide-react";

export interface WorkspaceSetupInput {
  name: string;
  industry?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  includeSampleData: boolean;
}

interface WorkspaceSetupProps {
  onCreate: (input: WorkspaceSetupInput) => Promise<void>;
  onLogout: () => void;
  error?: string | null;
}

export default function WorkspaceSetup({ onCreate, onLogout, error }: WorkspaceSetupProps) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate({
        name,
        industry,
        country,
        timezone: "Africa/Nairobi",
        currency: "KES",
        includeSampleData,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0B14] text-[#F8FAFC] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#A855F7]/10 blur-3xl pointer-events-none" />
      <section className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#161122]/90 p-7 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#C084FC]">
              <Sparkles className="h-3 w-3" /> Step 1 of 2
            </span>
            <h1 className="font-display text-2xl font-bold">Create your workspace</h1>
            <p className="text-sm leading-relaxed text-[#94A3B8]">Your workspace keeps your team, pipeline, campaigns, and insights isolated from every other organization.</p>
          </div>
          <button onClick={onLogout} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400">Workspace name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} placeholder="K10 Investments" className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-4 py-3 text-sm outline-none focus:border-[#7C3AED]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400">Industry</span>
              <input value={industry} onChange={(event) => setIndustry(event.target.value)} maxLength={100} placeholder="Investment management" className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-4 py-3 text-sm outline-none focus:border-[#7C3AED]" />
            </label>
            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wide text-gray-400">Country</span>
              <input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={100} className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-4 py-3 text-sm outline-none focus:border-[#7C3AED]" />
            </label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#0D0B14]/70 p-4">
            <input type="checkbox" checked={includeSampleData} onChange={(event) => setIncludeSampleData(event.target.checked)} className="mt-0.5 accent-[#7C3AED]" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium"><Building2 className="h-4 w-4 text-[#C084FC]" /> Start with a guided sample</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#94A3B8]">Add a welcome campaign and sample lead so your team can understand the workflow immediately.</span>
            </span>
          </label>
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-100/80">
            <CheckCircle2 className="mr-1.5 inline h-4 w-4 text-emerald-400" /> Default roles, pipeline stages, and a welcome dashboard are prepared automatically.
          </div>
          <button disabled={isSubmitting} className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Creating workspace…" : "Create workspace and continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
