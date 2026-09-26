import httpx
import logging
import math
from typing import Dict, Any, List

logger = logging.getLogger("AegisOperatorAgent")
OLLAMA_BASE_URL = "http://127.0.0.1:11434"

class OperatorAgent:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name
        self.signal_preempted = False

        # Spokane St corridor ground zero
        self.incident_loc = [47.5715, -122.3550]

        self.signals = [
            {"id": "SIG-01", "name": "4th Ave & Spokane St", "lat": 47.5718, "lng": -122.3400, "state": "RED", "preemptable": True},
            {"id": "SIG-02", "name": "4th Ave & Industrial Way", "lat": 47.5716, "lng": -122.3475, "state": "RED", "preemptable": True},
            {"id": "SIG-03", "name": "Cross-Town Bypass Jct", "lat": 47.5714, "lng": -122.3565, "state": "AMBER", "preemptable": True},
            {"id": "SIG-04", "name": "Marginal Arterial", "lat": 47.5709, "lng": -122.3650, "state": "GREEN", "preemptable": False},
        ]

        self.units = [
            {
                "unit": "EMS-12",
                "type": "Ambulance",
                "status": "EN_ROUTE",
                "speed_kmh": 68,
                "current_pos": [47.5721, -122.3280],
                "route": [
                    [47.5721, -122.3280],
                    [47.5718, -122.3400],
                    [47.5716, -122.3475],
                    [47.5715, -122.3550]
                ]
            },
            {
                "unit": "ENGINE-4",
                "type": "Fire Extrication",
                "status": "EN_ROUTE",
                "speed_kmh": 50,
                "current_pos": [47.5810, -122.3552],
                "route": [
                    [47.5810, -122.3552],
                    [47.5760, -122.3551],
                    [47.5715, -122.3550]
                ]
            },
            {
                "unit": "POLICE-201",
                "type": "Patrol Cordon",
                "status": "ON_SCENE",
                "speed_kmh": 0,
                "current_pos": [47.5714, -122.3546],
                "route": [
                    [47.5714, -122.3546],
                    [47.5715, -122.3550]
                ]
            }
        ]

    def _calc_distance_km(self, p1: List[float], p2: List[float]) -> float:
        lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
        lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        return 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def get_tactical_telemetry(self, alert_level: str) -> Dict[str, Any]:
        active_signals = []
        for sig in self.signals:
            state = sig["state"]
            if self.signal_preempted and sig["preemptable"]:
                state = "GREEN"
            elif alert_level in ["CRITICAL", "ANALYZING"] and sig["preemptable"]:
                state = "RED"
            active_signals.append({**sig, "state": state})

        dispatched_units = []
        for u in self.units:
            dist = self._calc_distance_km(u["current_pos"], self.incident_loc)
            if u["status"] == "ON_SCENE":
                eta = 0.0
            else:
                speed = max(20.0, u["speed_kmh"] * (1.3 if self.signal_preempted else 0.85))
                eta = round((dist / speed) * 60, 1)

            dispatched_units.append({
                "unit": u["unit"],
                "type": u["type"],
                "status": u["status"],
                "distance_km": round(dist, 2),
                "eta_minutes": eta,
                "speed_kmh": u["speed_kmh"],
                "current_pos": u["current_pos"],
                "route": u["route"]
            })

        return {
            "incident_loc": self.incident_loc,
            "alert_level": alert_level,
            "sector": "Sector 04 - Spokane St & 4th Ave Corridor",
            "signal_override_active": self.signal_preempted,
            "signals": active_signals,
            "dispatch_units": dispatched_units
        }

    def set_signal_preemption(self, state: bool) -> bool:
        self.signal_preempted = state
        return self.signal_preempted

    async def generate_incident_brief(self, state: Dict[str, Any]) -> str:
        prompt = (
            f"You are the Aegis CityPulse AI Dispatch Controller. An incident state '{state.get('alert_level')}' "
            f"was detected with {state.get('confidence', 0)}% confidence in Sector 04. "
            f"Active vehicles in scene: {state.get('tracked_vehicles', 0)}. "
            f"Provide an immediate 3-bullet military/911 tactical dispatch brief covering: "
            f"1) Hazard assessment and casualty triage, 2) Route preemption recommendation, 3) Unit staging orders. "
            f"Only 3 bullets. No preamble."
        )
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={"model": self.model_name, "prompt": prompt, "stream": False}
                )
                if res.status_code == 200:
                    return res.json().get("response", "Telemetry verified. Standby for dispatch command.")
        except Exception:
            pass

        return (
            "• SEVERITY 1: Stationary collision verified with high kinetic impact. Potential occupant entrapment.\n"
            "• TRAFFIC CORRIDOR: Preempt SIG-01 & SIG-02 to Force-Green for inbound EMS-12 along 4th Ave.\n"
            "• UNIT ORDERS: Engine-4 deploy heavy hydraulic cutting gear; Police-201 divert traffic at Spokane ramp."
        )

    async def chat_copilot(self, query: str, state: Dict[str, Any]) -> str:
        prompt = (
            f"System: You are Aegis 911 Dispatch Copilot. Active state: {state.get('alert_level')}, "
            f"Confidence: {state.get('confidence', 0)}%. Signal preemption: {self.signal_preempted}. "
            f"Operator query: '{query}'. Provide direct, tactical instructions."
        )
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={"model": self.model_name, "prompt": prompt, "stream": False}
                )
                if res.status_code == 200:
                    return res.json().get("response", "")
        except Exception:
            pass
        return f"[COPILOT] Route guidance confirmed. Signal preemption is {'ACTIVE' if self.signal_preempted else 'OFF'}."

operator_agent = OperatorAgent()