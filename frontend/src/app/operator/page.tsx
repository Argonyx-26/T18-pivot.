"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const TacticalMap = dynamic(() => import("./TacticalMap"), { ssr: false });

interface Signal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: "RED" | "AMBER" | "GREEN";
}

interface UnitStatus {
  unit: string;
  type: string;
  status: string;
  eta_minutes: number;
  distance_km: number;
  speed_kmh: number;
  current_pos: [number, number];
  route: [number, number][];
}

interface TelemetryData {
  incident_loc: [number, number];
  alert_level: "NORMAL" | "ANALYZING" | "CRITICAL";
  sector: string;
  signal_override_active: boolean;
  signals: Signal[];
  dispatch_units: UnitStatus[];
}

export default function OperatorPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alertLevel, setAlertLevel] = useState<string>("NORMAL");
  const [brief, setBrief] = useState<string>("Synthesizing tactical brief from Ollama Llama 3...");
  const [chatLog, setChatLog] = useState<{ role: "copilot" | "operator"; text: string }[]>([
    { role: "copilot", text: "Tactical Copilot online. Monitoring corridor telemetry." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isPreempted, setIsPreempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevAlertRef = useRef("NORMAL");

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/operator/telemetry");
      const data: TelemetryData = await res.json();
      setTelemetry(data);
      setAlertLevel(data.alert_level);
      setIsPreempted(data.signal_override_active);

      // Auto trigger AI summary on state change
      if (prevAlertRef.current !== data.alert_level && data.alert_level !== "NORMAL") {
        fetchBrief();
      }
      prevAlertRef.current = data.alert_level;
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBrief = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/operator/brief");
      const data = await res.json();
      setBrief(data.brief);
    } catch {
      setBrief("Briefing generation failed or local Ollama engine offline.");
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchBrief();

    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "INCIDENT_ALERT") {
          fetchTelemetry();
        }
      } catch (err) {}
    };

    const interval = setInterval(fetchTelemetry, 2500);
    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  const handleTogglePreemption = async () => {
    const nextState = !isPreempted;
    setIsPreempted(nextState);
    await fetch("http://localhost:8000/api/operator/signal_preemption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: nextState })
    });
    fetchTelemetry();
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSubmitting) return;

    const userText = chatInput.trim();
    setChatLog((prev) => [...prev, { role: "operator", text: userText }]);
    setChatInput("");
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/operator/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setChatLog((prev) => [...prev, { role: "copilot", text: data.reply }]);
    } catch {
      setChatLog((prev) => [...prev, { role: "copilot", text: "Error connecting to AI Copilot." }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* High-Visibility Alert Banner */}
      {alertLevel === "CRITICAL" && (
        <div className="bg-red-950/80 border-2 border-red-500 p-4 rounded-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_12px_#ff003c]" />
            <span className="font-mono font-black text-sm text-red-100 uppercase tracking-widest">
              [CRITICAL ALERT] COLLISION VERIFIED IN SECTOR 04 — IMMEDIATE UNITS DISPATCHED
            </span>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 bg-red-900 border border-red-400 text-white rounded">
            LEVEL 1 EMERGENCY
          </span>
        </div>
      )}

      {alertLevel === "ANALYZING" && (
        <div className="bg-yellow-950/70 border border-yellow-500 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
            <span className="font-mono font-bold text-xs text-yellow-200 uppercase tracking-wider">
              [EARLY WARNING] POTENTIAL INCIDENT UNDER SPATIAL EVALUATION (TEMPORAL BIN LOCKING...)
            </span>
          </div>
          <span className="font-mono text-[11px] text-yellow-300">PRE-ALERT STAGE</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyber-border pb-4">
        <div>
          <h1 className="text-xl font-mono font-black text-cyan-400 tracking-wider">
            911 TACTICAL DISPATCH & TRAFFIC CORRIDOR CONTROL
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Active Corridor Node: {telemetry?.sector || "Resolving sector..."}
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-mono text-slate-400 hover:text-cyan-300 border border-slate-800 px-3 py-1.5 rounded bg-slate-900"
        >
          ← Return to Surveillance Vision
        </Link>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Map & Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border space-y-3">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-bold">
                GIS Corridor Vector Feed & Intersections
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isPreempted ? "bg-green-500/20 text-green-300 border border-green-500/40" : "bg-slate-800 text-slate-400"
              }`}>
                {isPreempted ? "GREEN-WAVE ENGAGED" : "STANDARD SIGNAL CYCLING"}
              </span>
            </div>

            {telemetry && (
              <TacticalMap
                incidentLoc={telemetry.incident_loc}
                signals={telemetry.signals}
                units={telemetry.dispatch_units}
                alertLevel={alertLevel}
                preemptionActive={isPreempted}
              />
            )}
          </div>

          {/* AI Situation Summary */}
          <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-2 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs uppercase text-slate-400 tracking-wider font-bold">
                Automated Llama 3 Tactical Situation Summary
              </span>
              <button
                onClick={fetchBrief}
                className="text-[10px] text-cyan-400 hover:underline uppercase"
              >
                Regenerate Brief
              </button>
            </div>
            <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950 p-4 rounded border border-slate-900">
              {brief}
            </div>
          </div>
        </div>

        {/* Right Col: Signals, ETAs, Copilot Chat */}
        <div className="space-y-4">
          {/* Signal Control */}
          <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-4 font-mono">
            <div className="flex justify-between items-center">
              <h2 className="text-xs uppercase text-slate-400 tracking-wider font-bold">
                Corridor Signals ({telemetry?.signals.length || 0})
              </h2>
              <span className="text-[10px] text-cyan-400">CORRIDOR 9</span>
            </div>

            <div className="space-y-2 text-xs">
              {telemetry?.signals.map((sig) => (
                <div key={sig.id} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-200">{sig.name}</div>
                    <div className="text-[10px] text-slate-500">{sig.id}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        sig.state === "GREEN"
                          ? "bg-green-400 shadow-[0_0_8px_#00ff66]"
                          : sig.state === "AMBER"
                          ? "bg-yellow-400 shadow-[0_0_8px_#ffb703]"
                          : "bg-red-500 shadow-[0_0_8px_#ff003c]"
                      }`}
                    />
                    <span className="font-bold text-[11px] text-slate-300">{sig.state}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleTogglePreemption}
              className={`w-full py-2.5 text-xs uppercase font-bold rounded transition-colors tracking-wider border ${
                isPreempted
                  ? "bg-red-600/20 text-red-400 border-red-500 hover:bg-red-600/30"
                  : "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400"
              }`}
            >
              {isPreempted ? "DISENGAGE GREEN WAVE" : "ENGAGE FORCE-GREEN WAVE"}
            </button>
          </div>

          {/* Emergency Vehicle ETAs */}
          <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-3 font-mono">
            <h2 className="text-xs uppercase text-slate-400 tracking-wider font-bold">
              Emergency Unit ETAs
            </h2>

            <div className="space-y-2">
              {telemetry?.dispatch_units.map((unit) => (
                <div
                  key={unit.unit}
                  className="p-3 rounded bg-slate-900/90 border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">{unit.unit}</div>
                    <div className="text-[10px] text-slate-400">
                      {unit.distance_km} km | {unit.speed_kmh} km/h
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-sm ${unit.unit.includes("EMS") ? "text-cyan-400" : "text-slate-300"}`}>
                      {unit.eta_minutes} MIN
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">{unit.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Copilot Terminal */}
          <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border flex flex-col h-[280px] font-mono">
            <div className="text-xs uppercase text-slate-400 tracking-wider pb-2 border-b border-slate-800 mb-2">
              Tactical Copilot
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {chatLog.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    chat.role === "operator" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded max-w-[90%] text-[11px] ${
                      chat.role === "operator"
                        ? "bg-cyan-600 text-slate-950 font-medium"
                        : "bg-slate-900 border border-slate-800 text-slate-200"
                    }`}
                  >
                    {chat.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask tactical copilot..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded uppercase"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}