# Aegis CityPulse: Intelligent Real-Time Situational Awareness & Tactical Dispatch Command

**Aegis CityPulse** is an edge-native, real-time smart city surveillance and emergency dispatch platform engineered for urban traffic corridors[cite: 11]. Built on a modular client-server architecture, the system combines high-throughput computer vision inference with an isolated 911 tactical dispatch workstation. The vision processing engine leverages an Ultralytics YOLO11x neural network fine-tuned on traffic accident telemetry, executing spatial coordinate tracking, temporal persistence checks, and adaptive kinematic drift analysis to eliminate false positives caused by crawling or decelerating transit vehicles[cite: 1]. Incoming video streams are analyzed at 1080p and broadcast with sub-second latency via non-blocking asynchronous MJPEG frame pipelines and real-time WebSockets. When a confirmed collision or anomaly is locked, telemetry instantly routes to the isolated `/operator` command node, where an interactive GIS tactical vector map renders real-time traffic signal light phases (Red, Amber, Green), preemptive corridor overrides ("Force Green Wave"), and dynamic routing polylines for emergency vehicles (EMS-12, Engine-4, Police-201) with live ETAs. 
# Aegis CityPulse: Autonomous Incident Vision & Tactical Dispatch Station

**Aegis CityPulse** is an edge-native smart city surveillance and 911 dispatch triage platform engineered for urban traffic corridors. It couples high-throughput edge computer vision (YOLO11x) with an isolated, dark-mode tactical command station (Next.js + Leaflet GIS + Llama 3)[cite: 1]. The platform features kinematic drift tracking to filter crawling vehicles, an automated pre-alert verification state, real-time arterial traffic light preemption ("Force-Green Wave"), and instant local tactical briefings synthesized via Ollama[cite: 1].

---

## System Flowchart

```mermaid
flowchart TD
    subgraph Edge Vision Ingestion & Filtering
        A[CCTV / 1080p Video Feed] --> B[YOLO11x Neural Detection]
        B --> C{Deformation / Crash Class?}
        C -- No --> D[Transit Vehicle Tracking & Cyan Bounding Boxes]
        C -- Yes --> E[Spatial & Kinematic Drift Tracker]
        E --> F{Recent Drift < 12 px & Persistence >= 4 frames?}
        F -- 2 to 3 frames --> G[Status: ANALYZING IMPACT - Amber Pre-Alert]
        F -- 4+ frames & at rest --> H[Status: COLLISION ALERT - Flashing Red]
    end

    subgraph Fast-Transport Telemetry Pipeline
        D --> I[Async MJPEG Streamer /stream]
        G --> J[Async WebSocket Broadcast /ws]
        H --> J
    end

    subgraph Command & Dispatch Workstation
        I --> K[Surveillance View: http://localhost:3000]
        J --> L[911 Operator Console: http://localhost:3000/operator]
        L --> M[Leaflet GIS Dark Vector Map]
        M --> N[Corridor Signals SIG-01 to SIG-04]
        M --> O[Inbound Units EMS-12, Engine-4, Police-201]
        L --> P[Preemption Engine: Toggle Force-Green Wave]
        P -->|Recalculate Speed & ETA| M
        H -->|Auto Trigger| Q[Local Ollama Llama 3 API]
        Q --> R[3-Bullet Dispatch Brief: Triage, Routing, Staging]
        L --> S[Interactive Tactical Copilot Terminal]
    end

## Quickstart & Execution Runbook

### 1. Prerequisites
- **Python 3.11+** with virtual environment support
- **Node.js 18+** & `npm`
- **Ollama** installed with the `llama3` model pulled (`ollama run llama3`)

### 2. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Download the YOLO11x fine-tuned weights
curl -L -o accident_yolo11.pt "[https://huggingface.co/Enos-123/traffic-accident-detection-yolo11x/resolve/main/weights/epoch61.pt](https://huggingface.co/Enos-123/traffic-accident-detection-yolo11x/resolve/main/weights/epoch61.pt)"

# Start the FastAPI engine (MJPEG stream & WebSockets)
python main.py

surveillance_feed.mp4 ──► [ YOLO11x Inference + Kinematic Drift Filter ]
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
             Async MJPEG Stream (/stream)   WebSocket Telemetry (/ws)
                         │                         │
                         ▼                         ▼
             Next.js Vision Dashboard      Isolated /operator Station
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
            Leaflet GIS Vector Map                              Local Llama 3 Agent (Ollama)
   (Signal Phases, Preemption & Unit ETAs)                  (Automated Triage Briefs & Copilot)
