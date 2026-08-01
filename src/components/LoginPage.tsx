import React, { useState } from "react";
import { Shield, Sparkles, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (credentials: { email: string; password: string }) => void;
  onSignUp: (details: { firstName: string; lastName: string; email: string; password: string }) => void;
  onBackToLanding: () => void;
  error?: string | null;
}

export default function LoginPage({ onLoginSuccess, onSignUp, onBackToLanding, error }: LoginPageProps) {
  // Local credential states
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      onSignUp({ firstName, lastName, email, password });
      return;
    }
    onLoginSuccess({ email, password });
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
        <ArrowLeft className="w-3.5 h-3.5" /> <span>Back to Overview</span>
      </button>

      {/* Main glass card portal */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-white/5 space-y-6 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1 border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3 text-[#C084FC]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#C084FC]">Platform Access</span>
          </div>
          <h2 className="font-display font-bold text-2xl tracking-tight mt-1 text-[#F8FAFC]">
            {mode === "login" ? "MIP Business Portal" : "Create your MIP account"}
          </h2>
          <p className="text-xs text-[#94A3B8]">
            {mode === "login"
              ? "Sign in with your organization account, or create your first account below."
              : "Create one account, then create or join the workspaces you belong to."}
          </p>
          {error && <p role="alert" className="text-xs text-red-300 bg-red-950/30 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Dynamic Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide block">First name</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide block">Last name</label>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide block">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
              placeholder="user@yourcompany.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wide">
                Password
              </label>
              {mode === "login" && <button
                type="button" 
                onClick={() => alert("Ask your administrator to reset your password. Password reset emails are not included in this first release.")}
                className="text-[9px] text-[#C084FC] hover:underline"
              >
                Forgot Password?
              </button>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d0b14]/90 border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword((prev) => !prev);
                }}
                className="absolute right-3 top-2.5 z-10 text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-[#C084FC]" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Permission list preview banner */}
          <div className="bg-[#161122]/80 border border-white/5 p-3 rounded-xl flex items-start space-x-2.5 text-[10px] text-gray-400 leading-normal">
            <Shield className="w-4 h-4 text-[#C084FC] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-300 block mb-0.5">{mode === "login" ? "Account access" : "Secure account setup"}</span>
              {mode === "signup" && "Use at least 12 characters. Your role is assigned by workspace ownership or an invitation, never by the sign-up form."}
              {mode === "login" && "Your workspace membership determines the permissions available after you sign in."}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white rounded-xl font-medium text-xs tracking-wide shadow-xl shadow-[#7C3AED]/15 hover:shadow-[#7C3AED]/35 transform hover:-translate-y-[1px] transition-all duration-300 flex items-center justify-center gap-1.5 font-display cursor-pointer"
          >
            {mode === "login" ? "Enter Dashboard" : "Create account"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-[#94A3B8]">
          {mode === "login" ? "New to MIP?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[#C084FC] hover:underline">
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>

      <div className="text-center text-[10px] text-[#94A3B8]/40 mt-8 space-y-1">
        <p>Marketing Intelligence Platform (MIP)</p>
        <p className="font-mono text-[8px] uppercase tracking-wider">Enterprise Revenue & Lead Management System</p>
      </div>
    </div>
  );
}
