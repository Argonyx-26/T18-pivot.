# Aegis CityPulse: Intelligent Real-Time Situational Awareness & Tactical Dispatch Command

**Aegis CityPulse** is an edge-native, real-time smart city surveillance and emergency dispatch platform engineered for urban traffic corridors[cite: 11]. Built on a modular client-server architecture, the system combines high-throughput computer vision inference with an isolated 911 tactical dispatch workstation. The vision processing engine leverages an Ultralytics YOLO11x neural network fine-tuned on traffic accident telemetry, executing spatial coordinate tracking, temporal persistence checks, and adaptive kinematic drift analysis to eliminate false positives caused by crawling or decelerating transit vehicles[cite: 1]. Incoming video streams are analyzed at 1080p and broadcast with sub-second latency via non-blocking asynchronous MJPEG frame pipelines and real-time WebSockets. When a confirmed collision or anomaly is locked, telemetry instantly routes to the isolated `/operator` command node, where an interactive GIS tactical vector map renders real-time traffic signal light phases (Red, Amber, Green), preemptive corridor overrides ("Force Green Wave"), and dynamic routing polylines for emergency vehicles (EMS-12, Engine-4, Police-201) with live ETAs. An integrated local Llama 3 LLM agent powered by Ollama automatically generates structured 3-bullet triage briefs—evaluating casualty risk, corridor signal preemption, and unit staging—while serving as an unconstrained interactive copilot for emergency dispatch directors. Designed with Next.js (App Router), TypeScript, and Tailwind CSS, Aegis CityPulse delivers an executive-grade, dark-mode command center interface that unifies real-time edge intelligence, automated triage, and active municipal infrastructure control into a single unified dashboard[cite: 11].

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