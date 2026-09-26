
import "leaflet/dist/leaflet.css";

import "./globals.css";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Aegis CityPulse | Command & Vision",
  description: "Next-Gen Autonomous Accident Detection and Dispatch Terminal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-cyber-bg text-slate-100 selection:bg-cyan-500 selection:text-black">
        {/* Persistent Top Navigation Bar */}
        <header className="border-b border-cyber-border bg-cyber-card/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <h1 className="text-lg font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400">
              Aegis CityPulse
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              SYS-NODE: ACTIVE
            </span>
          </div>

          <nav className="flex space-x-2">
            <Link
              href="/"
              className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors duration-150 hover:bg-slate-800 border border-transparent hover:border-slate-700 text-slate-300"
            >
              Surveillance Vision
            </Link>
            <Link
              href="/operator"
              className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors duration-150 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
            >
              911 Operator Station
            </Link>
          </nav>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}