# Aegis CityPulse: Autonomous Incident Vision & Tactical Dispatch Station

**Aegis CityPulse** is an edge-native smart city surveillance and 911 dispatch triage platform engineered for urban traffic corridors. It couples high-throughput edge computer vision (YOLO11x) with an isolated, dark-mode tactical command station (Next.js + Leaflet GIS + Llama 3). The platform features kinematic drift tracking to filter crawling vehicles, an automated pre-alert verification state, real-time arterial traffic light preemption ("Force-Green Wave"), and instant local tactical briefings synthesized via Ollama.

---

## System Flowchart

```mermaid
flowchart TD
    subgraph VisionPipeline["Edge Vision Ingestion & Filtering"]
        A["CCTV / 1080p Video Feed"] --> B["YOLO11x Neural Detection"]
        B --> C{"Deformation / Crash Class?"}
        C -- "No" --> D["Transit Vehicle Tracking & Cyan Bounding Boxes"]
        C -- "Yes" --> E["Spatial & Kinematic Drift Tracker"]
        E --> F{"Recent Drift < 12 px & Frames >= 4?"}
        F -- "2-3 frames" --> G["Status: ANALYZING IMPACT (Amber Pre-Alert)"]
        F -- ">= 4 frames & at rest" --> H["Status: COLLISION ALERT (Flashing Red)"]
    end

    subgraph FastTransport["Fast-Transport Telemetry Pipeline"]
        D --> I["Async MJPEG Streamer (/stream)"]
        G --> J["Async WebSocket Broadcast (/ws)"]
        H --> J
    end

    subgraph CommandStation["Command & Dispatch Workstation"]
        I --> K["Surveillance View (:3000)"]
        J --> L["911 Operator Console (:3000/operator)"]
        L --> M["Leaflet GIS Dark Vector Map"]
        M --> N["Corridor Signals (SIG-01 to SIG-04)"]
        M --> O["Inbound Units (EMS-12, Engine-4, Police-201)"]
        L --> P["Preemption: Engage Force-Green Wave"]
        P -->|Recalculate Speed & ETA| M
        H -->|Auto Trigger| Q["Local Ollama Llama 3 API"]
        Q --> R["3-Bullet Dispatch Brief: Triage, Routing, Staging"]
        L --> S["Interactive Tactical Copilot Terminal"]
    end
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

citypulse/
├── .gitignore                          # Excludes heavy weights (.pt), video assets (.mp4), .venv, and node_modules
├── README.md                           # Documentation, operational specifications, and deployment runbook
├── backend/
│   ├── .venv/                          # Python isolated virtual environment
│   ├── accident_yolo11.pt              # Fine-tuned YOLO11x weights for accident detection (Git-ignored)
│   ├── crash_sample.mp4                # Local test surveillance footage (Git-ignored)
│   ├── requirements.txt                # FastAPI, Uvicorn, Ultralytics, OpenCV-Python, HTTPX, NumPy
│   ├── main.py                         # FastAPI server: MJPEG video streaming, WebSocket broker, API routes
│   ├── tracker.py                      # SpatialTrack, IOU matching, kinematic drift suppression, bold OpenCV overlays
│   └── operator_agent.py               # Tactical dispatch state, GIS signal preemption, Ollama Llama 3 summaries
└── frontend/
    ├── package.json                    # Next.js 14, React 18, Leaflet, React-Leaflet, Lucide, Tailwind CSS
    ├── tsconfig.json                   # TypeScript configuration
    ├── tailwind.config.ts              # Custom cyber dark-mode palette (#06090e, cyan, red, amber)
    ├── postcss.config.mjs              # PostCSS plugin configurations
    └── src/
        └── app/
            ├── globals.css             # Tailwind base layers, dark OSM tile filters, radar animations
            ├── layout.tsx              # Root shell, status indicator, global Leaflet CSS imports, top navigation
            ├── page.tsx                # Surveillance Vision Node: MJPEG live canvas, scrubber, telemetry logs
            └── operator/
                ├── page.tsx            # 911 Station: Warning banners, signal toggles, ETAs, Copilot terminal
                └── TacticalMap.tsx     # Client-side Leaflet GIS component with custom signal lights and dynamic routes

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start FastAPI and Vision Pipeline
python main.py
