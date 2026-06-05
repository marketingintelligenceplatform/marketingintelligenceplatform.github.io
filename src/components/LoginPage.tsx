import React, { useState } from "react";
import { UserRole, CurrentUser } from "../types";
import { Shield, Sparkles, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: CurrentUser) => void;
  onBackToLanding: () => void;
}

export default function LoginPage({ onLoginSuccess, onBackToLanding }: LoginPageProps) {
  // Local credential states
  const [email, setEmail] = useState("macreatives.global@gmail.com");
  const [password, setPassword] = useState("••••••••");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [customName, setCustomName] = useState("Stephen Kimaru");

  // Automated credential seeder for the demo
  const selectPresetRole = (role: UserRole) => {
    setSelectedRole(role);
    if (role === UserRole.ADMIN) {
      setCustomName("Stephen Kimaru");
      setEmail("macreatives.global@gmail.com");
    } else if (role === UserRole.MARKETING_MANAGER) {
      setCustomName("Sarah Connor");
      setEmail("sconnor@macreatives.com");
    } else {
      setCustomName("Alex Cooper");
      setEmail("acooper@macreatives.com");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      name: customName,
      email: email,
      role: selectedRole,
      avatar: customName.split(" ").map(w => w[0]).join("")
    });
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#0D0B14] text-[#F8FAFC] flex flex-col items-center justify-center font-sans relative px-4 select-none">
      {/* Background Soft Glows */}
      <div className="absolute top-[20%] left-[30%] w-[450px] h-[450px] rounded-full bg-[#7C3AED] opacity-[0.08] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[25%] w-[450px] h-[450px] rounded-full bg-[#A855F7] opacity-[0.06] blur-[150px] pointer-events-none" />

      {/* Back navigation button */}
      <button 
        onClick={onBackToLanding}
        className="absolute top-8 left-8 flex items-center space-x-2 text-xs text-[#94A3B8]/80 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> <span>Back to Home</span>
      </button>

      {/* Main glass card portal */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-white/5 space-y-6 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1 border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3 text-[#C084FC]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#C084FC]">Portal Authentication</span>
          </div>
          <h2 className="font-display font-bold text-2xl tracking-tight mt-1 text-[#F8FAFC]">
            MIP Enterprise Access
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Select a profile preset to simulate enterprise authorization rules and view configurations.
          </p>
        </div>

        {/* Dynamic Preset Selector Tabs */}
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-[#94A3B8] uppercase block tracking-wider font-semibold">
            Preset Role Authorization Profiles
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.values(UserRole) as UserRole[]).map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectPresetRole(role)}
                  className={`p-2.5 rounded-xl border text-[10px] font-medium leading-none flex flex-col justify-center items-center text-center space-y-1 transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-b from-[#7C3AED]/20 to-[#A855F7]/10 border-[#7C3AED] text-[#C084FC] shadow-lg shadow-[#7C3AED]/5"
                      : "bg-[#161122]/60 border-white/5 text-gray-400 hover:border-white/10 hover:bg-[#1F1830]/80"
                  }`}
                >
                  <UserCheck className={`w-3.5 h-3.5 ${active ? "text-[#C084FC]" : "text-gray-500"}`} />
                  <span className="truncate w-full">{role.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide block">
              Authorized Name
            </label>
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
              placeholder="e.g. Stephen Kimaru"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide block">
              Identity Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide">
                Key Phrase Password
              </label>
              <button 
                type="button" 
                onClick={() => alert("Enterprise credential lookup bypass active: Any password is accepted for preset verification.")}
                className="text-[9px] text-[#C084FC] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
            />
          </div>

          {/* Permission list preview banner */}
          <div className="bg-[#161122]/80 border border-white/5 p-3 rounded-xl flex items-start space-x-2.5 text-[10px] text-gray-400 leading-normal">
            <Shield className="w-4 h-4 text-[#C084FC] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-300 block mb-0.5">Authorization Level: {selectedRole}</span>
              {selectedRole === UserRole.ADMIN && "Full systems dashboard permission: Config stages, configure mock CRM data parameters, evaluate predictions."}
              {selectedRole === UserRole.MARKETING_MANAGER && "Campaign allocation edits, statistical hypothesis testing center, automated conversion profiling."}
              {selectedRole === UserRole.SALES_AGENT && "Pipeline lead movement, logging follow-ups & activities, assigned deals updates."}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white rounded-xl font-medium text-xs tracking-wide shadow-xl shadow-[#7C3AED]/15 hover:shadow-[#7C3AED]/35 transform hover:-translate-y-[1px] transition-all duration-300 flex items-center justify-center gap-1.5 font-display"
          >
            Authenticate Profile Preset <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      <div className="text-center text-[10px] text-[#94A3B8]/40 mt-8 space-y-1">
        <p>Built by Stephen Kimaru for Ma Creatives Studio</p>
        <p className="font-mono text-[8px] uppercase tracking-wider">MIP Sandbox Workspace Client • Security Level 3</p>
      </div>
    </div>
  );
}
