import React, { useState } from "react";
import { Lead, Campaign } from "../types";
import { BarChart3, Calculator, TrendingUp, HelpCircle, Activity, Sparkles, Binary, CheckCircle2, AlertTriangle, Play } from "lucide-react";

interface AnalyticsEngineProps {
  leads: Lead[];
  campaigns: Campaign[];
}

export default function AnalyticsEngine({ leads, campaigns }: AnalyticsEngineProps) {
  // --- STATE FOR A/B TESTING CALCULATOR ---
  const [clicksA, setClicksA] = useState<number>(1800);
  const [convA, setConvA] = useState<number>(145);
  const [clicksB, setClicksB] = useState<number>(2200);
  const [convB, setConvB] = useState<number>(210);

  // --- STATE FOR CENTRAL LIMIT THEOREM DISTRIBUTION SIMULATOR ---
  const [sampleSize, setSampleSize] = useState<number>(120);
  const [successRatio, setSuccessRatio] = useState<number>(45); // probability preset out of 100

  // --- CALCULATE A/B TEST STATISTICS ---
  const rateA = clicksA > 0 ? convA / clicksA : 0;
  const rateB = clicksB > 0 ? convB / clicksB : 0;
  
  // Standard error and Z-score calculations
  const pPooled = (clicksA + clicksB) > 0 ? (convA + convB) / (clicksA + clicksB) : 0;
  const errorPooled = Math.sqrt(pPooled * (1 - pPooled) * (1 / clicksA + 1 / clicksB));
  const zScore = errorPooled > 0 ? (rateB - rateA) / errorPooled : 0;
  
  // Quick normal distribution function to approximate p-value
  const getPValue = (z: number) => {
    // 2-tailed test approximation
    const absZ = Math.abs(z);
    // Standard normal CDF approximation (Abramowitz & Stegun formula)
    const t = 1 / (1 + 0.2316419 * absZ);
    const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    const value = 2 * prob; // 2-tailed
    return Math.min(Math.max(value, 0), 1);
  };

  const pValue = getPValue(zScore);
  const isSignificant = pValue < 0.05;
  const confidenceLevel = (1 - pValue) * 100;

  // Confidence Interval Bounds for Variant A and B (95%)
  const errorA = Math.sqrt((rateA * (1 - rateA)) / clicksA || 0);
  const errorB = Math.sqrt((rateB * (1 - rateB)) / clicksB || 0);
  const ciLowerA = Math.max(0, rateA - 1.96 * errorA);
  const ciUpperA = Math.min(1, rateA + 1.96 * errorA);
  const ciLowerB = Math.max(0, rateB - 1.96 * errorB);
  const ciUpperB = Math.min(1, rateB + 1.96 * errorB);

  // --- CENTRAL LIMIT THEOREM PROBABILITY CURVE PLOTTING ---
  // Mean = p, Variance = p*(1-p)/n
  const p = successRatio / 100;
  const stdError = Math.sqrt((p * (1 - p)) / sampleSize);

  // Generate points for SVG plotting of standard normal curve centered around p
  const curvePoints: { x: number; y: number; val: number }[] = [];
  const svgWidth = 400;
  const svgHeight = 120;
  const startX = p - 3.5 * stdError;
  const endX = p + 3.5 * stdError;
  const rangeX = endX - startX;

  for (let i = 0; i <= 50; i++) {
    const val = startX + (i / 50) * rangeX;
    // Normal PDF equation: y = (1 / (stdError * sqrt(2*pi))) * e^(-0.5 * ((val - p)/stdError)^2)
    const exponent = -0.5 * Math.pow((val - p) / stdError, 2);
    const yVal = (1 / (stdError * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    
    // Scale points to fit SVG constraints
    const xSVG = (i / 50) * (svgWidth - 40) + 20;
    // Map max probability density to 80% height
    const maxDensity = 1 / (stdError * Math.sqrt(2 * Math.PI)) || 1;
    const ySVG = svgHeight - (yVal / maxDensity) * (svgHeight - 24) - 10;
    
    curvePoints.push({ x: xSVG, y: ySVG, val });
  }

  // Path generator
  let cltPath = "";
  if (curvePoints.length > 0) {
    cltPath = `M ${curvePoints[0].x} ${curvePoints[0].y}`;
    for (let i = 1; i < curvePoints.length; i++) {
      cltPath += ` L ${curvePoints[i].x} ${curvePoints[i].y}`;
    }
  }

  // Total portfolio lifetime calculation helper
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const avgDealValue = leads.length > 0 ? totalValue / leads.length : 0;
  // Estimated CLV using standard dynamic parameters
  const avgRetentionMonths = 24;
  const frequencyFactor = 1.25; // average repeat contracts
  const estimatedCLV = avgDealValue * frequencyFactor * (avgRetentionMonths / 12);

  return (
    <div className="space-y-6">
      
      {/* Upper overview header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1F1830]/80 p-5 rounded-2xl border border-white/5 gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Binary className="w-5 h-5 text-[#C084FC]" /> Dynamic Statistical Testing Console
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Perform mathematical validations, marketing experiments, and dynamic hypothesis tests.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono bg-[#7C3AED]/10 text-[#C084FC] border border-[#7C3AED]/25 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Decision Support Pipeline Active</span>
        </div>
      </div>

      {/* Main Grid: A/B Significance & CLT Simulators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Campaign A/B Experiment Analysis */}
        <div className="lg:col-span-7 bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-[#C084FC]" />
              <h3 className="font-display font-semibold text-sm text-[#F8FAFC]">Campaign Multi-Variant Significance Test</h3>
            </div>
            <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#7C3AED]/15 text-[#C084FC]">Two-Tailed Z-Test</span>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Input traffic and conversion results to calculate mathematical significance ($2$-tailed CDF) and determine positive budget allocation rules.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Variant A Inputs */}
            <div className="bg-[#161122]/60 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="font-mono text-[10px] text-[#C084FC] font-semibold block uppercase">Variant A (Control)</span>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Raw Impressions / Clicks</label>
                <input
                  type="number"
                  min="1"
                  value={clicksA}
                  onChange={(e) => setClicksA(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0D0B14] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Validated Conversions</label>
                <input
                  type="number"
                  min="0"
                  value={convA}
                  onChange={(e) => setConvA(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0D0B14] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="pt-1.5 flex justify-between items-center text-[11px] font-mono">
                <span className="text-gray-400">Conversion Rate:</span>
                <span className="text-white font-medium">{(rateA * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* Variant B Inputs */}
            <div className="bg-[#161122]/60 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="font-mono text-[10px] text-[#A855F7] font-semibold block uppercase">Variant B (Challenger)</span>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Raw Impressions / Clicks</label>
                <input
                  type="number"
                  min="1"
                  value={clicksB}
                  onChange={(e) => setClicksB(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0D0B14] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Validated Conversions</label>
                <input
                  type="number"
                  min="0"
                  value={convB}
                  onChange={(e) => setConvB(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0D0B14] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="pt-1.5 flex justify-between items-center text-[11px] font-mono">
                <span className="text-gray-400">Conversion Rate:</span>
                <span className="text-white font-medium">{(rateB * 100).toFixed(2)}%</span>
              </div>
            </div>

          </div>

          {/* Test Outcomes Dashboard Panel */}
          <div className="bg-[#0D0B14]/80 border border-white/5 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            <div className="space-y-1">
              <span className="text-[9px] text-[#94A3B8] uppercase block">Test Statistic Z</span>
              <span className="text-xl font-bold font-display text-[#F8FAFC]" id="z-score-val">
                {zScore.toFixed(3)}
              </span>
              <span className="text-[9px] text-gray-400 block font-mono">SE = {errorPooled.toFixed(4)}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-[#94A3B8] uppercase block">Significance p-value</span>
              <span className={`text-xl font-bold font-display ${pValue <= 0.05 ? "text-emerald-400" : "text-amber-500"}`} id="p-value-val">
                {pValue.toFixed(4)}
              </span>
              <span className="text-[9px] text-gray-400 block font-mono">Confidence: {confidenceLevel.toFixed(1)}%</span>
            </div>

            <div className="rounded-lg p-2 flex items-center justify-center border text-center text-xs h-full"
              style={{
                borderColor: isSignificant ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                backgroundColor: isSignificant ? "rgba(16, 185, 129, 0.05)" : "rgba(245, 158, 11, 0.05)"
              }}
            >
              <div>
                {isSignificant ? (
                  <div className="text-emerald-400 flex flex-col items-center">
                    <CheckCircle2 className="w-5 h-5 mb-0.5" />
                    <span className="font-semibold block text-[10px]">Significant Match</span>
                  </div>
                ) : (
                  <div className="text-amber-400 flex flex-col items-center">
                    <AlertTriangle className="w-5 h-5 mb-0.5" />
                    <span className="font-semibold block text-[10px]">Inconclusive</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Probability Confidence Bounds Table */}
          <div className="space-y-2">
            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wide">95% Conversion Interval Bounds</span>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#161122]/50 p-2.5 rounded-lg border border-white/5">
                <span className="text-gray-400 text-[10px] block mb-0.5">Variant A Bounds</span>
                <span className="text-white text-[11px] block">
                  [{(ciLowerA * 100).toFixed(2)}% — {(ciUpperA * 100).toFixed(2)}%]
                </span>
              </div>
              <div className="bg-[#161122]/50 p-2.5 rounded-lg border border-white/5">
                <span className="text-gray-400 text-[10px] block mb-0.5">Variant B Bounds</span>
                <span className="text-white text-[11px] block">
                  [{(ciLowerB * 100).toFixed(2)}% — {(ciUpperB * 100).toFixed(2)}%]
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#94A3B8]/80 leading-normal pt-1">
              {isSignificant 
                ? `Variant B shows statistically superior performance at the 95% confidence level ($p${pValue < 0.001 ? " < 0.001" : ` = ${pValue.toFixed(3)}`}$). The business is advised to replace the standard Variant A control.` 
                : "The difference in variants conversions is currently too narrow to pass the standard 95% significance criteria ($p > 0.05$). Run the campaign longer before adopting budget reallocations."
              }
            </p>
          </div>
        </div>

        {/* Right Side: Central Limit Theorem Simulator & Corporate KPI calculations */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CLT normal density plot */}
          <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-[#C084FC]" />
                <h3 className="font-display font-semibold text-sm text-[#F8FAFC]">CLT Convergence Sandbox</h3>
              </div>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400">Normal CDF</span>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Central Limit Theorem states sample conversion distribution converges toward normality as $n$ expands.
            </p>

            {/* Slider parameters */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-400">Sample Leads Size (n):</span>
                  <span className="text-[#C084FC] font-semibold">{sampleSize}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#0d0b14] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-400">Conversion Probability (p):</span>
                  <span className="text-[#C084FC] font-semibold">{successRatio}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  step="1"
                  value={successRatio}
                  onChange={(e) => setSuccessRatio(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#0d0b14] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                />
              </div>
            </div>

            {/* CLT SVG Graph Plot */}
            <div className="h-32 bg-[#0D0B14] rounded-xl border border-white/5 p-3 flex flex-col justify-between overflow-hidden relative">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                {/* Bell Curve Line */}
                {cltPath && (
                  <path
                    d={cltPath}
                    fill="none"
                    stroke="#C084FC"
                    strokeWidth="2.5"
                    filter="drop-shadow(0 0 4px rgba(192, 132, 252, 0.4))"
                  />
                )}
                {/* Center Mean Guideline */}
                <line
                  x1={svgWidth / 2}
                  y1="5"
                  x2={svgWidth / 2}
                  y2={svgHeight - 15}
                  stroke="#7C3AED"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              </svg>
              <div className="flex justify-between text-[9px] font-mono text-gray-400">
                <span>Min boundary: {(startX * 100).toFixed(1)}%</span>
                <span className="text-[#C084FC] font-medium">Mean (μ): {(p * 100).toFixed(1)}%</span>
                <span>Max boundary: {(endX * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Standard Error stats */}
            <div className="bg-[#161122]/50 p-2.5 rounded-xl border border-white/5 text-[10px] font-mono text-gray-400 flex justify-between">
              <span>Standard Error (σ): {(stdError * 100).toFixed(2)}%</span>
              <span>Skewness: 0 (Normal)</span>
            </div>
          </div>

          {/* Business intelligence calculation summary */}
          <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
            <span className="font-display font-semibold text-xs text-[#F8FAFC] block border-b border-white/5 pb-2">
              Decision Support & CLV Metrics
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400">Current Lead Retention</span>
                <span className="text-base font-bold font-display text-white">84.5%</span>
                <span className="text-[9px] text-[#34D399] tracking-wider block font-mono">Low attritions</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400">Estimated CLV (SaaS)</span>
                <span className="text-base font-bold font-display text-[#C084FC]" id="clv-val">
                  ${Math.round(estimatedCLV).toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 block font-mono">Contract lifespans</span>
              </div>
            </div>

            <p className="text-[10px] text-[#94A3B8]/90 leading-relaxed font-mono bg-[#161122]/40 p-2 rounded-lg border border-white/5">
              CLV Equation: Avg Value x Repeat Factor x Retention Tenure. Total active sandbox value portfolio evaluates as <strong className="text-white">${totalValue.toLocaleString()}</strong>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
