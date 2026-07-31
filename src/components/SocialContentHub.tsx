import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Share2, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Copy, 
  Plus, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  Users, 
  BarChart2, 
  Filter,
  Eye,
  ExternalLink,
  Target,
  FileText,
  Zap,
  Radio,
  UserCheck,
  Check,
  Globe,
  ArrowRight
} from "lucide-react";
import { Lead } from "../types";

interface SocialPost {
  id: string;
  title: string;
  platform: "LinkedIn" | "Instagram" | "Twitter/X" | "Facebook" | "TikTok" | "Multi-Channel";
  targetPlatforms?: string[];
  goal: "Lead Magnet" | "Case Study" | "Product Demo" | "Educational Carousel" | "Direct Pitch";
  content: string;
  scheduledTime: string;
  status: "Published" | "Scheduled" | "Draft";
  impressions: number;
  engagements: number;
  clicks: number;
  leadsGenerated: number;
  attributedRevenue: number;
}

interface SocialComment {
  id: string;
  postId: string;
  authorName: string;
  authorHandle: string;
  platform: "LinkedIn" | "Instagram" | "Twitter/X" | "Facebook" | "TikTok";
  commentText: string;
  timestamp: string;
  sentiment: "Positive" | "Neutral" | "High Intent" | "Objection";
  intentTag: "Demo Request" | "Pricing Inquiry" | "Buying Signals" | "General Feedback";
  convertedToLead: boolean;
}

interface SocialContentHubProps {
  leads: Lead[];
  formatCurrency?: (val: number) => string;
  selectedCurrency?: string;
  onAddLeadFromSocial?: (leadData: Partial<Lead>) => void;
}

export default function SocialContentHub({ leads, formatCurrency, selectedCurrency = "KES", onAddLeadFromSocial }: SocialContentHubProps) {
  const displayVal = (v: number) => formatCurrency ? formatCurrency(v) : `$${v.toLocaleString()}`;

  // Local state for AI Content Generator & Multi-Channel Dispatcher
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState<SocialPost["goal"]>("Lead Magnet");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["LinkedIn", "Twitter/X", "Instagram"]);
  const [tone, setTone] = useState("Punchy & Direct");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);

  // Initial Seed Social Posts
  const [posts, setPosts] = useState<SocialPost[]>([]);

  // Social Listening & Comments Feed
  const [comments, setComments] = useState<SocialComment[]>([]);

  // Navigation tab
  const [activeSubTab, setActiveSubTab] = useState<"generator" | "calendar" | "listening" | "analytics">("generator");
  const [filterPlatform, setFilterPlatform] = useState<string>("All");

  // Toggle selection for channels
  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) => 
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  // Handle AI Content Generation
  const handleGenerateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGeneratedPost(null);

    setTimeout(() => {
      const mainPlat = selectedChannels[0] || "LinkedIn";
      let contentTemplate = "";
      if (mainPlat === "LinkedIn") {
        contentTemplate = `🔥 ${topic} — Why traditional marketing approaches are failing in 2026:\n\nIf you're looking to scale your pipeline and drive real revenue, focus on these 3 fundamentals:\n\n• Clear Value Proposition: Communicate ROI in 5 seconds.\n• Frictionless Qualification: Capture intent before booking calls.\n• Data-Driven Follow-Up: Engage leads while they're warm.\n\n💡 Pro Tip: Stop relying on gut feeling when evaluating campaign spend.\n\nDM "GROWTH" or reply below to see how our Marketing Intelligence Platform turns raw traffic into paying customers! 👇`;
      } else if (mainPlat === "Instagram") {
        contentTemplate = `✨ Want to transform how you approach ${topic}?\n\nHere is the exact playbook top brands use to convert audience attention into high-ticket clients:\n\n1️⃣ Hook with a specific pain point\n2️⃣ Show real proof & metrics\n3-[#] Offer a clear, single call-to-action\n\n💬 Drop a "🔥" in the comments to get our step-by-step PDF guide sent to your inbox!`;
      } else if (mainPlat === "Twitter/X") {
        contentTemplate = `Quick breakdown on ${topic}:\n\nMost teams overcomplicate lead generation. Here is the 80/20 framework:\n\n• Hook: Address the core frustration\n• Proof: Show numbers, not promises\n• Offer: Give immediate value\n\nWhat is your biggest bottleneck right now? Let's discuss below 👇`;
      } else {
        contentTemplate = `🎯 Here is what nobody tells you about ${topic}...\n\nIf you want posts that actually generate revenue (not just vanity likes), focus on clarity and strong calls to action.\n\nSave this post for your next content batch! 📌`;
      }

      setGeneratedPost(contentTemplate);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Publish across all selected channels instantly
  const handlePublishAllChannels = () => {
    if (!generatedPost || selectedChannels.length === 0) return;

    setIsDispatching(true);
    setDispatchLogs([]);

    const channelsToDispatch = [...selectedChannels];
    let step = 0;

    const interval = setInterval(() => {
      if (step < channelsToDispatch.length) {
        const ch = channelsToDispatch[step];
        setDispatchLogs((prev) => [
          ...prev,
          ` Dispatching content payload to ${ch} API Gateway... [HTTP 200 OK]`
        ]);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsDispatching(false);

          const newPostObj: SocialPost = {
            id: `post-${Date.now()}`,
            title: topic || "Omni-Channel Broadcast Post",
            platform: selectedChannels.length > 1 ? "Multi-Channel" : (selectedChannels[0] as any),
            targetPlatforms: selectedChannels,
            goal,
            content: generatedPost,
            scheduledTime: "Just Now (Live)",
            status: "Published",
            impressions: Math.floor(Math.random() * 800) + 200,
            engagements: Math.floor(Math.random() * 60) + 15,
            clicks: Math.floor(Math.random() * 25) + 5,
            leadsGenerated: 2,
            attributedRevenue: 300000
          };

          setPosts([newPostObj, ...posts]);
          alert(`🚀 Success! Post dispatched live to ${selectedChannels.join(", ")} simultaneously.`);
          setActiveSubTab("calendar");
        }, 500);
      }
    }, 600);
  };

  // Convert a social comment into a CRM Lead
  const handleConvertCommentToLead = (comment: SocialComment) => {
    if (comment.convertedToLead) return;

    // Call callback or add lead
    if (onAddLeadFromSocial) {
      onAddLeadFromSocial({
        name: comment.authorName,
        email: `${comment.authorHandle.replace("@", "")}@sociallead.com`,
        company: `${comment.platform} Social Lead`,
        source: "Social Media" as any,
        value: 1500, // standard starter
        notes: `Extracted from ${comment.platform} comment: "${comment.commentText}"`
      });
    }

    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, convertedToLead: true } : c));
    alert(`🎉 Lead "${comment.authorName}" successfully imported into MIP Lead CRM!`);
  };

  // Metrics summary
  const totalImpressions = posts.reduce((acc, p) => acc + p.impressions, 0);
  const totalEngagements = posts.reduce((acc, p) => acc + p.engagements, 0);
  const totalSocialLeads = posts.reduce((acc, p) => acc + p.leadsGenerated, 0);
  const totalSocialRevenue = posts.reduce((acc, p) => acc + p.attributedRevenue, 0);

  const filteredPosts = filterPlatform === "All" 
    ? posts 
    : posts.filter(p => p.platform === filterPlatform || p.targetPlatforms?.includes(filterPlatform));

  return (
    <div className="space-y-6 text-[#F8FAFC]">
      {/* Top Banner Header */}
      <div className="bg-[#161122] border border-[#1F1830] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-[#7C3AED]/15 border border-[#7C3AED]/30 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-[#C084FC] font-semibold">
                Social workspace preview
              </span>
            </div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
              Content workspace preview
            </h1>
            <p className="text-xs text-[#94A3B8] max-w-2xl mt-1">
              Shape content ideas and channel plans here. Publishing, social listening, and social performance metrics are not connected in Version 1, so MIP will not present simulated results as live data.
            </p>
          </div>

          {/* Sub-tab navigation selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0D0B14] p-1.5 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => setActiveSubTab("generator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "generator"
                  ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Dispatcher
            </button>
            <button
              onClick={() => setActiveSubTab("listening")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "listening"
                  ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Social Listening ({comments.filter(c => !c.convertedToLead).length})
            </button>
            <button
              onClick={() => setActiveSubTab("calendar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "calendar"
                  ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Posts Queue ({posts.length})
            </button>
            <button
              onClick={() => setActiveSubTab("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "analytics"
                  ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> ROI Engine
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161122] border border-[#1F1830] p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Social Leads Converted</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold font-display text-emerald-400">{totalSocialLeads}</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">In Lead CRM</span>
          </div>
        </div>

        <div className="bg-[#161122] border border-[#1F1830] p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Attributed Revenue</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold font-display text-[#C084FC]">{displayVal(totalSocialRevenue)}</span>
          </div>
        </div>

        <div className="bg-[#161122] border border-[#1F1830] p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Total Audience Reach</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold font-display text-white">{totalImpressions.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#161122] border border-[#1F1830] p-4 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-mono block">High-Intent Comments</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold font-display text-amber-400">{comments.filter(c => c.sentiment === "High Intent").length}</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Ready to Convert</span>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: AI DISPATCHER & MULTI-CHANNEL PUBLISHER */}
      {activeSubTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Generator & Multi-Channel Selector Form */}
          <div className="lg:col-span-6 bg-[#161122] border border-[#1F1830] rounded-2xl p-6 space-y-5 shadow-xl">
            <div>
              <h2 className="font-display font-semibold text-base text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#C084FC]" />
                Content draft workspace
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Select channels and prepare a draft. A live publishing integration is planned for a later release.
              </p>
            </div>

            <form onSubmit={handleGenerateContent} className="space-y-4">
              {/* Channel Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-gray-400 font-semibold block">
                  Select Target Channels to Publish To:
                </label>
                <div className="flex flex-wrap gap-2">
                  {["LinkedIn", "Twitter/X", "Instagram", "Facebook", "TikTok"].map((ch) => {
                    const isSelected = selectedChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#7C3AED]/20 border-[#7C3AED] text-white"
                            : "bg-[#0D0B14] border-white/10 text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          isSelected ? "bg-[#7C3AED] text-white" : "border border-gray-600"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-gray-400 font-semibold block">
                  Product, Service, or Topic <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Enterprise Marketing Automation Software or High-Ticket Lead Generation"
                  className="w-full bg-[#0D0B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-gray-400 font-semibold block">
                  Conversion Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as SocialPost["goal"])}
                  className="w-full bg-[#0D0B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="Lead Magnet">Lead Magnet / Free Resource</option>
                  <option value="Case Study">Client Case Study & Proof</option>
                  <option value="Product Demo">Product Demo / Tour</option>
                  <option value="Educational Carousel">Educational Carousel</option>
                  <option value="Direct Pitch">Direct Sales Pitch</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-gray-400 font-semibold block">
                  Tone of Voice
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["Punchy & Direct", "Authoritative & Expert", "Storytelling & Authentic", "Urgent & Promotional"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer ${
                        tone === t
                          ? "bg-[#7C3AED]/20 border-[#7C3AED] text-[#C084FC] font-semibold"
                          : "bg-[#0D0B14] border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Crafting Omni-Channel Post Copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate & Preview Post
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Generated Result & Direct Publish Action */}
          <div className="lg:col-span-6 bg-[#161122] border border-[#1F1830] rounded-2xl p-6 space-y-4 shadow-xl relative min-h-[380px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-[#1F1830] pb-3">
                <span className="font-display font-semibold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C084FC]" /> Content draft preview
                </span>
                {selectedChannels.length > 0 && (
                  <span className="text-[10px] font-mono bg-[#7C3AED]/20 text-[#C084FC] px-2.5 py-0.5 rounded-full border border-[#7C3AED]/30">
                    {selectedChannels.length} Channels Selected
                  </span>
                )}
              </div>

              {generatedPost ? (
                <div className="mt-4 space-y-4">
                  <div className="bg-[#0D0B14] border border-white/10 rounded-xl p-4 text-xs leading-relaxed text-gray-200 whitespace-pre-wrap font-sans">
                    {generatedPost}
                  </div>

                  {/* Simulated API dispatch status log */}
                  {dispatchLogs.length > 0 && (
                    <div className="bg-[#0D0B14] border border-emerald-500/30 p-3 rounded-xl font-mono text-[10px] space-y-1 text-emerald-400">
                      {dispatchLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 space-y-3">
                  <Globe className="w-10 h-10 text-gray-600 animate-pulse" />
                  <p className="text-xs max-w-xs">Select your target channels and topic to prepare a local draft. Social publishing is not connected in Version 1.</p>
                </div>
              )}
            </div>

            {generatedPost && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[#1F1830]">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedPost)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy Text"}
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <><Send className="w-3.5 h-3.5" /> Publishing integration coming soon</>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: SOCIAL LISTENING & AI COMMENT-TO-LEAD CONVERTER */}
      {activeSubTab === "listening" && (
        <div className="bg-[#161122] border border-[#1F1830] rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-base text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Live Social Listening & AI Intent Extractor
              </h2>
              <p className="text-xs text-gray-400">
                Incoming comments across your published posts. AI detects buying intent so you can convert commenters straight into your CRM pipeline with 1 click.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#1F1830]">
            {comments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Radio className="w-8 h-8 text-gray-600 animate-pulse" />
                <p className="text-xs text-gray-400 font-mono">No incoming social comments logged yet.</p>
                <p className="text-[11px] text-gray-500 max-w-sm">When audience members comment on your dispatched social posts, AI will analyze their sentiment and display them here for instant 1-click lead conversion.</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/30">
                        {c.platform}
                      </span>
                      <span className="font-semibold text-sm text-white">{c.authorName}</span>
                      <span className="text-xs text-gray-500 font-mono">{c.authorHandle}</span>
                      <span className="text-[10px] text-gray-500 font-mono">• {c.timestamp}</span>
                    </div>

                    <p className="text-xs text-gray-200 bg-[#0D0B14] p-3 rounded-xl border border-white/5 italic">
                      "{c.commentText}"
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-gray-500">AI Intent Analysis:</span>
                      <span className={`px-2 py-0.5 rounded ${
                        c.sentiment === "High Intent"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        {c.sentiment} ({c.intentTag})
                      </span>
                    </div>
                  </div>

                  {/* Conversion Action */}
                  <div className="shrink-0">
                    {c.convertedToLead ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Imported to CRM
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConvertCommentToLead(c)}
                        className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Convert Comment to CRM Lead
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CONTENT CALENDAR & POST QUEUE */}
      {activeSubTab === "calendar" && (
        <div className="bg-[#161122] border border-[#1F1830] rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-base text-white">Social Media Post Queue & Logs</h2>
              <p className="text-xs text-gray-400">View published posts, active dispatches, and channel metrics.</p>
            </div>

            {/* Platform filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">Platform:</span>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="bg-[#0D0B14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Platforms</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Twitter/X">Twitter / X</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-[#1F1830]">
            {filteredPosts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Share2 className="w-8 h-8 text-gray-600 animate-pulse" />
                <p className="text-xs text-gray-400 font-mono">No social media posts created yet.</p>
                <p className="text-[11px] text-gray-500 max-w-sm">Use the AI Dispatcher tab to generate post copy and broadcast it to your social media channels.</p>
              </div>
            ) : (
              filteredPosts.map((p) => (
                <div key={p.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.targetPlatforms && p.targetPlatforms.length > 0 ? (
                        p.targetPlatforms.map((tp) => (
                          <span key={tp} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/30">
                            {tp}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/30">
                          {p.platform}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-300">
                        Goal: {p.goal}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        p.status === "Published" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-white">{p.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{p.content}</p>
                    <span className="text-[10px] text-gray-500 font-mono block">
                      <Clock className="w-3 h-3 inline mr-1" /> {p.scheduledTime}
                    </span>
                  </div>

                  {/* Metrics pill */}
                  <div className="flex items-center gap-4 bg-[#0D0B14] p-3 rounded-xl border border-white/5 shrink-0 text-center text-xs">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Impressions</span>
                      <span className="font-bold text-white">{p.impressions.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Engagements</span>
                      <span className="font-bold text-blue-400">{p.engagements}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Leads</span>
                      <span className="font-bold text-emerald-400">{p.leadsGenerated}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Revenue</span>
                      <span className="font-bold text-[#C084FC]">{displayVal(p.attributedRevenue)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ROI & CONVERSION ANALYTICS */}
      {activeSubTab === "analytics" && (
        <div className="bg-[#161122] border border-[#1F1830] rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="font-display font-semibold text-base text-white">Social Media Closed-Loop ROI</h2>
            <p className="text-xs text-gray-400">Track how organic content translates directly into deals won and pipeline growth in KES/USD.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0D0B14] border border-white/5 p-5 rounded-xl space-y-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono">Top Performing Channel</span>
              <p className="text-lg font-bold text-white">LinkedIn & Twitter/X</p>
              <p className="text-xs text-emerald-400 font-mono">68% of total social leads</p>
            </div>

            <div className="bg-[#0D0B14] border border-white/5 p-5 rounded-xl space-y-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono">Best Converting Goal</span>
              <p className="text-lg font-bold text-white">Case Study & Proof</p>
              <p className="text-xs text-emerald-400 font-mono">18 leads generated</p>
            </div>

            <div className="bg-[#0D0B14] border border-white/5 p-5 rounded-xl space-y-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono">Avg Revenue Per Post</span>
              <p className="text-lg font-bold text-[#C084FC]">{displayVal(Math.round(totalSocialRevenue / Math.max(posts.length, 1)))}</p>
              <p className="text-xs text-gray-400 font-mono">Across {posts.length} posts</p>
            </div>
          </div>

          {/* Marketing OS Strategy Roadmap */}
          <div className="bg-[#1F1830]/50 border border-[#7C3AED]/30 p-5 rounded-2xl space-y-3">
            <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C084FC]" />
              The MIP "Marketing OS" Competitive Advantage
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300">
              <li className="bg-[#0D0B14] p-3 rounded-xl border border-white/5 space-y-1">
                <strong className="text-white block font-semibold">1. Closed-Loop Attribution</strong>
                <p className="text-gray-400 leading-normal text-[11px]">Unlike Hootsuite or Buffer that only track likes, MIP links every post directly to CRM pipeline revenue.</p>
              </li>
              <li className="bg-[#0D0B14] p-3 rounded-xl border border-white/5 space-y-1">
                <strong className="text-white block font-semibold">2. Automated Intent Extraction</strong>
                <p className="text-gray-400 leading-normal text-[11px]">AI scans incoming post comments for buying signals and converts high-intent users into leads automatically.</p>
              </li>
              <li className="bg-[#0D0B14] p-3 rounded-xl border border-white/5 space-y-1">
                <strong className="text-white block font-semibold">3. Multi-Currency Revenue OS</strong>
                <p className="text-gray-400 leading-normal text-[11px]">All social lead values instantly convert between KES, USD, EUR, and GBP with real-time exchange rates.</p>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
