"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface TelemetryPayload {
  is_accident: boolean;
  confidence: number;
  tracked_vehicles: number;
  current_time_sec: number;
  duration_sec: number;
  active_tracks_count: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "CRIT" | "INFO" | "WARN";
}

export default function VisionPage() {
  const [telemetry, setTelemetry] = useState<TelemetryPayload>({
    is_accident: false,
    confidence: 0,
    tracked_vehicles: 0,
    current_time_sec: 0,
    duration_sec: 1,
    active_tracks_count: 0,
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = (message: string, type: "CRIT" | "INFO" | "WARN") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ timestamp: time, message, type }, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    addLog("Vision Tracker pipeline initialised. YOLO11x loaded.", "INFO");
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "TELEMETRY_UPDATE") {
          const prev = telemetry.is_accident;
          setTelemetry(parsed.data);
          if (!prev && parsed.data.is_accident) {
            addLog(`IMPACT CONFIRMED: ${parsed.data.confidence}% confidence. Spatial lock engaged.`, "CRIT");
          }
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    ws.onclose = () => addLog("Telemetry WebSocket disconnected", "WARN");
    return () => ws.close();
  }, [telemetry.is_accident]);

  const togglePlayback = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    await fetch("http://localhost:8000/api/playback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_playing: nextState }),
    });
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    await fetch("http://localhost:8000/api/playback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seek_time_sec: newTime }),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {/* Stream & Interactive Controls */}
      <section className="lg:col-span-3 space-y-4">
        <div className="relative border border-cyber-border rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center shadow-2xl">
          {/* Top Camera Overlay */}
          <div className="absolute top-3 left-3 bg-cyber-bg/80 backdrop-blur px-3 py-1 rounded border border-cyber-border text-xs font-mono flex items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>CAM_04: ARTERIAL_INTERSECT</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">1080P @ 25FPS</span>
          </div>

          {/* Visual Indicator of Crash Status */}
          {telemetry.is_accident && (
            <div className="absolute top-3 right-3 bg-cyber-danger/90 text-white text-xs font-black font-mono tracking-widest px-3 py-1 rounded animate-pulse z-10 border border-red-400 shadow-[0_0_15px_#ff003c]">
              COLLISION DETECTED
            </div>
          )}

          {/* The Live MJPEG Stream */}
          <img
            src="http://localhost:8000/stream"
            alt="Surveillance Feed"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Video Scrubber & Playback HUD */}
        <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <button
                onClick={togglePlayback}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-600"
              >
                {isPlaying ? "PAUSE" : "PLAY"}
              </button>
              <span>TIMELINE SCRUBBER</span>
            </span>
            <span className="text-cyan-400">
              {telemetry.current_time_sec.toFixed(1)}s / {telemetry.duration_sec.toFixed(1)}s
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={telemetry.duration_sec || 100}
              step={0.1}
              value={telemetry.current_time_sec}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </section>

      {/* Metrics, Confidence, and Live Audit Log */}
      <section className="space-y-4">
        {/* Incident Gauges */}
        <div className="p-5 rounded-lg bg-cyber-card border border-cyber-border space-y-4">
          <h2 className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Vision Pipeline State
          </h2>

          <div>
            <div className="flex justify-between items-baseline text-sm mb-1 font-mono">
              <span className="text-slate-400">Collision Confidence</span>
              <span
                className={`font-black text-base ${
                  telemetry.confidence > 70
                    ? "text-cyber-danger"
                    : telemetry.confidence > 0
                    ? "text-cyber-warning"
                    : "text-slate-500"
                }`}
              >
                {telemetry.confidence.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  telemetry.confidence > 70
                    ? "bg-cyber-danger shadow-[0_0_10px_#ff003c]"
                    : "bg-cyan-400"
                }`}
                style={{ width: `${Math.min(100, telemetry.confidence)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-center pt-2 border-t border-slate-800">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <div className="text-xl font-bold text-cyan-400">{telemetry.tracked_vehicles}</div>
              <div className="text-[10px] text-slate-500 uppercase">Vehicles In Field</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <div className="text-xl font-bold text-slate-200">{telemetry.active_tracks_count}</div>
              <div className="text-[10px] text-slate-500 uppercase">Track Bins</div>
            </div>
          </div>

          <Link
            href="/operator"
            className="block text-center w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-[0_0_12px_rgba(0,240,255,0.3)]"
          >
            Open Dispatch Operator →
          </Link>
        </div>

        {/* Real-time Incident Audit Log */}
        <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border font-mono text-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400 uppercase tracking-wider">Incident Audit Log</span>
            <span className="text-[10px] text-cyan-400">REALTIME</span>
          </div>

          <div className="h-64 overflow-y-auto space-y-2 pr-1 text-[11px]">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-slate-900/60 border border-slate-800 flex flex-col gap-0.5"
              >
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>{log.timestamp}</span>
                  <span
                    className={
                      log.type === "CRIT"
                        ? "text-red-400 font-bold"
                        : log.type === "WARN"
                        ? "text-yellow-400"
                        : "text-slate-400"
                    }
                  >
                    [{log.type}]
                  </span>
                </div>
                <div className="text-slate-300 break-words">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}