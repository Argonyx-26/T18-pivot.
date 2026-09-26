"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, Circle } from "react-leaflet";
import L from "leaflet";

interface Signal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: "RED" | "AMBER" | "GREEN";
}

interface Unit {
  unit: string;
  type: string;
  status: string;
  eta_minutes: number;
  distance_km: number;
  speed_kmh: number;
  current_pos: [number, number];
  route: [number, number][];
}

interface TacticalMapProps {
  incidentLoc: [number, number];
  signals: Signal[];
  units: Unit[];
  alertLevel: string;
  preemptionActive: boolean;
}

const createSignalIcon = (state: string) => {
  const color = state === "GREEN" ? "#00ff66" : state === "AMBER" ? "#ffb703" : "#ff003c";
  const glow = state === "GREEN" ? "0 0 10px #00ff66" : state === "AMBER" ? "0 0 10px #ffb703" : "0 0 10px #ff003c";
  return L.divIcon({
    className: "custom-sig",
    html: `
      <div style="background-color: #090e17; border: 1.5px solid ${color}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: ${glow};">
        <div style="background-color: ${color}; width: 8px; height: 8px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const createUnitIcon = (unitName: string, isEMS: boolean) => {
  const color = isEMS ? "#00f0ff" : "#f72585";
  return L.divIcon({
    className: "custom-unit",
    html: `
      <div style="background: rgba(9, 14, 23, 0.95); border: 1px solid ${color}; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 8px ${color}; font-family: monospace; font-size: 10px; color: ${color}; font-weight: bold; white-space: nowrap;">
        ▲ ${unitName}
      </div>
    `,
    iconSize: [60, 20],
    iconAnchor: [30, 10]
  });
};

export default function TacticalMap({ incidentLoc, signals, units, alertLevel, preemptionActive }: TacticalMapProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  const beaconColor = alertLevel === "CRITICAL" ? "#ff003c" : "#ffb703";

  return (
    <div className="w-full h-[460px] rounded-lg overflow-hidden border border-cyber-border relative">
      <div className="absolute top-3 right-3 z-[1000] bg-cyber-bg/90 backdrop-blur border border-cyber-border px-3 py-2 rounded text-[11px] font-mono space-y-1">
        <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Corridor Map Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ff003c]" /> Hold Phase
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#00ff66]" /> Preempted Green
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400" /> EMS Corridor Line
        </div>
      </div>

      <MapContainer
        center={incidentLoc}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Incident Ground Zero */}
        <Circle
          center={incidentLoc}
          radius={120}
          pathOptions={{ color: beaconColor, fillColor: beaconColor, fillOpacity: 0.25, weight: 2 }}
        />
        <Marker
          position={incidentLoc}
          icon={L.divIcon({
            className: "incident-beacon",
            html: `
              <div style="position: relative; width: 24px; height: 24px;">
                <div class="beacon-pulse" style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: ${beaconColor}; opacity: 0.6;"></div>
                <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: ${beaconColor}; border: 2px solid white; box-shadow: 0 0 10px ${beaconColor};"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}
        >
          <Tooltip permanent direction="top" offset={[0, -12]}>
            <span className="font-mono text-[10px] font-bold text-slate-100 bg-slate-900 px-1 py-0.5 border border-slate-700 rounded">
              {alertLevel === "CRITICAL" ? "CONFIRMED CRASH" : "ANALYZING ANOMALY"}
            </span>
          </Tooltip>
        </Marker>

        {/* Signal Lights */}
        {signals.map((sig) => (
          <Marker key={sig.id} position={[sig.lat, sig.lng]} icon={createSignalIcon(sig.state)}>
            <Tooltip direction="bottom" offset={[0, 10]}>
              <div className="font-mono text-[10px]">
                <div className="font-bold">{sig.name}</div>
                <div>Phase: <strong style={{ color: sig.state === "GREEN" ? "#00ff66" : sig.state === "AMBER" ? "#ffb703" : "#ff003c" }}>{sig.state}</strong></div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Emergency Responders & Route Vectors */}
        {units.map((unit) => {
          const isEMS = unit.unit.includes("EMS");
          const routeColor = isEMS ? "#00f0ff" : "#f72585";
          return (
            <div key={unit.unit}>
              <Polyline
                positions={unit.route}
                pathOptions={{
                  color: routeColor,
                  weight: isEMS ? 4 : 3,
                  opacity: 0.85,
                  dashArray: unit.status === "ON_SCENE" ? undefined : "6, 8"
                }}
              />
              <Marker position={unit.current_pos} icon={createUnitIcon(unit.unit, isEMS)}>
                <Tooltip direction="right" offset={[15, 0]}>
                  <div className="font-mono text-[10px]">
                    <div className="font-bold">{unit.unit} ({unit.type})</div>
                    <div>ETA: <strong>{unit.eta_minutes} min</strong> ({unit.distance_km} km)</div>
                    <div>Speed: {unit.speed_kmh} km/h</div>
                  </div>
                </Tooltip>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}