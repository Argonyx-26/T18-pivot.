````markdown
#🛡️ Aegis CityPulse — AI-Powered Real-Time Crash Detection & Emergency Monitoring

**Team PIVOT**

Aegis CityPulse is an AI-powered intelligent city surveillance and emergency response system designed to detect road accidents in real time using live CCTV and video feeds.

The system combines **YOLO-based object detection, multi-object tracking, temporal crash analysis, and a real-time command-center dashboard** to identify potential crashes, reduce false positives, and provide emergency monitoring personnel with immediate visual alerts and incident evidence.

---

## 🎯 Project Objective

Traditional CCTV systems primarily record incidents and rely on human operators to continuously monitor multiple camera feeds.

Aegis CityPulse transforms existing camera infrastructure into an intelligent monitoring system capable of:

- 🚗 Detecting and tracking vehicles in real time
- 🧠 Understanding vehicle movement across multiple frames
- 💥 Detecting potential collisions and road crashes
- 🎯 Reducing false-positive accident alerts
- 📹 Streaming live CCTV feeds to a central dashboard
- 🚨 Generating real-time emergency alerts
- 📝 Recording crash evidence and timestamps
- 👮 Providing a centralized city monitoring interface

---

## 🧠 AI Architecture

```text
                    LIVE CCTV / VIDEO
                           │
                           ▼
                  ┌─────────────────┐
                  │   YOLO11 Model  │
                  │ Object Detection│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Vehicle Tracking│
                  │ ByteTrack /     │
                  │ DeepSORT        │
                  └────────┬────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   TEMPORAL ANALYSIS      │
              │                          │
              │ • Vehicle Speed          │
              │ • Relative Velocity      │
              │ • Direction Change       │
              │ • Bounding Box Overlap   │
              │ • Trajectory Intersection│
              │ • Sudden Deceleration    │
              │ • Post-Impact Stopping   │
              └────────────┬─────────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │  Crash Classifier │
                 │   / Crash Model   │
                 └─────────┬─────────┘
                           │
                           ▼
                  MULTI-FRAME VALIDATION
                           │
                           ▼
                    🚨 CRASH CONFIRMED
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       COMMAND CENTER             EVIDENCE STORAGE
              │                         │
              ▼                         ▼
       Live Alert + Feed        Video + Timestamp
````

---

# ✨ Key Features

## 🚗 Real-Time Object Detection

Aegis CityPulse uses YOLO-based computer vision to identify road users from live camera feeds.

Potentially detected objects include:

* 🚗 Cars
* 🏍️ Motorcycles
* 🚌 Buses
* 🚛 Trucks
* 🚲 Bicycles
* 🚶 Pedestrians
* 🚦 Traffic-related objects

---

## 🎯 Multi-Object Tracking

Each detected vehicle is assigned a unique tracking ID.

Example:

```text
Vehicle #12
Vehicle #27
Vehicle #31
Vehicle #42
```

The tracking system follows vehicles across consecutive frames, allowing Aegis CityPulse to analyze movement and behavior over time.

---

# 💥 Intelligent Crash Detection

Aegis CityPulse does **not** trigger an accident alert simply because two vehicles are close to each other.

Instead, the system combines multiple signals:

```text
Collision
   +
Relative Velocity
   +
Sudden Deceleration
   +
Trajectory Intersection
   +
Direction Change
   +
Post-Impact Vehicle Behavior
   +
Visual Crash Detection
   +
Temporal Consistency
```

Only when sufficient evidence is accumulated does the system classify an event as a confirmed crash.

---

# 🧠 Temporal Validation

Crash detection is performed across multiple frames instead of relying on a single image.

Example:

```text
Frame 01 → NORMAL
Frame 02 → NORMAL
Frame 03 → SUSPICIOUS
Frame 04 → SUSPICIOUS
Frame 05 → IMPACT
Frame 06 → IMPACT
Frame 07 → VEHICLE STOPS

             ↓

       🚨 CRASH CONFIRMED
```

This helps reduce false positives caused by:

* Dense traffic
* Vehicles driving closely
* Lane changes
* Overtaking
* Bounding-box overlap
* Camera movement
* Occlusion
* Sudden but normal braking

---

# 🚨 Real-Time Alert System

When a crash is confirmed, Aegis CityPulse generates an emergency incident.

Example:

```text
╔══════════════════════════════════╗
║        🚨 CRASH DETECTED        ║
╠══════════════════════════════════╣
║ Camera: CAM-04                  ║
║ Time: 14:32:18                  ║
║ Confidence: 92%                 ║
║                                  ║
║ Vehicles Involved:              ║
║ • Vehicle #12                   ║
║ • Vehicle #27                   ║
║                                  ║
║ Status: CRASH CONFIRMED         ║
║                                  ║
║ Evidence: SAVED                 ║
╚══════════════════════════════════╝
```

The alert is immediately displayed on the monitoring dashboard.

---

# 👮 Aegis CityPulse Command Center

The web interface acts as a centralized monitoring system for city surveillance personnel.

### Dashboard Components

```text
┌────────────────────────────────────────────────────┐
│              AEGIS CITYPULSE                      │
│              CITY COMMAND CENTER                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ 🚨 ACTIVE ALERTS       🚗 ACTIVE VEHICLES         │
│       02                     47                    │
│                                                    │
├───────────────────────────┬────────────────────────┤
│                           │                        │
│                           │    🚨 CRASH ALERT     │
│       LIVE CCTV           │                        │
│                           │    Camera: CAM-04     │
│                           │    Confidence: 92%    │
│                           │                        │
│                           │    [VIEW EVIDENCE]    │
│                           │                        │
├───────────────────────────┴────────────────────────┤
│                                                    │
│                  INCIDENT TIMELINE                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

# 📹 Live CCTV Streaming

The backend processes the camera feed while simultaneously streaming the processed video to the web dashboard.

The live feed can display:

* Vehicle bounding boxes
* Tracking IDs
* Vehicle trajectories
* Crash confidence
* Detection status
* AI processing status
* Emergency alerts
* Camera information

---

# 🛠️ Technology Stack

## AI / Computer Vision

* Python
* OpenCV
* YOLO11
* ByteTrack / DeepSORT
* PyTorch
* NumPy

## Backend

* Python
* FastAPI / Flask
* WebSockets
* REST APIs

## Frontend

* HTML
* CSS
* JavaScript
* Canvas
* WebSocket-based live updates

## Storage

* Local video evidence
* JSON incident logs
* Crash snapshots
* Timestamped recordings

---

# 📁 Project Structure

```text
Aegis-CityPulse/
│
├── backend/
│   ├── main.py
│   ├── detector.py
│   ├── tracker.py
│   ├── crash_detector.py
│   ├── video_stream.py
│   └── alerts.py
│
├── models/
│   ├── yolo11m.pt
│   └── crash_model.pt
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── evidence/
│   ├── crashes/
│   ├── snapshots/
│   └── recordings/
│
├── data/
│   └── incidents.json
│
├── requirements.txt
├── config.py
└── README.md
```

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Aegis-CityPulse.git
cd Aegis-CityPulse
```

Create a virtual environment:

```bash
python -m venv venv
```

### macOS / Linux

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 📦 Dependencies

Example:

```text
ultralytics
opencv-python
numpy
torch
torchvision
fastapi
uvicorn
websockets
python-multipart
```

Install:

```bash
pip install -r requirements.txt
```

---

# 🤖 AI Model Setup

Place the required model weights inside:

```text
models/
```

Example:

```text
models/
├── yolo11m.pt
└── crash_model.pt
```

The object-detection model identifies and tracks road users.

The crash model provides an additional visual signal for accident detection.

---

# ▶️ Running Aegis CityPulse

Start the backend:

```bash
python backend/main.py
```

Or with FastAPI:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Open the monitoring dashboard:

```text
http://localhost:8000
```

---

# 📷 Camera Sources

Aegis CityPulse can process multiple types of video sources.

### Webcam

```python
SOURCE = 0
```

### Video File

```python
SOURCE = "data/test_video.mp4"
```

### IP Camera / CCTV

```python
SOURCE = "rtsp://username:password@camera-ip/stream"
```

---

# 🚨 Crash Confidence Engine

The system calculates a combined crash score rather than relying on a single detection.

Example:

```text
Collision Score          25%
Relative Velocity        20%
Sudden Deceleration      20%
Trajectory Analysis      15%
Post-Impact Stop         10%
Visual Crash Detection   10%
```

The resulting score determines the system state:

```text
0.00 ───────── 0.40
       NORMAL

0.40 ───────── 0.75
      SUSPICIOUS
          ↓
    Keep Monitoring

0.75 ───────── 1.00
     🚨 CONFIRMED
```

The threshold and temporal confirmation window can be configured according to the deployment environment.

---

# 🧪 Testing

Aegis CityPulse should be evaluated against a variety of real-world scenarios:

```text
✓ Normal traffic
✓ Heavy traffic
✓ Vehicles overtaking
✓ Lane changes
✓ Sudden braking
✓ Motorcycle passing cars
✓ Vehicle collisions
✓ Multi-vehicle collisions
✓ Night footage
✓ Low-quality CCTV
✓ Occluded vehicles
✓ Camera vibration
```

The system should be evaluated using both:

* Crash detection rate
* False-positive rate

---

# 📊 Incident Evidence

For every confirmed incident, Aegis CityPulse can store:

```text
Incident ID
Camera ID
Timestamp
Crash Confidence
Vehicle IDs
Crash Frame
Snapshot
Video Clip
Detection Metadata
```

Example:

```json
{
  "incident_id": "ACP-2026-0042",
  "camera_id": "CAM-04",
  "timestamp": "2026-09-26T14:32:18",
  "confidence": 0.92,
  "vehicles": [12, 27],
  "status": "CONFIRMED"
}
```

---

# 🔐 Privacy & Local Processing

Aegis CityPulse is designed to support **local AI inference**, allowing video processing to happen directly on the deployment machine without requiring a cloud AI API.

This can reduce:

* Cloud dependency
* API costs
* Network latency
* Continuous video transmission

Deployment should comply with applicable privacy, surveillance, data-retention, and local regulatory requirements.

---

# 🚀 Future Development

* [ ] Multi-camera monitoring
* [ ] City-wide incident map
* [ ] GPS-based incident visualization
* [ ] Crash severity estimation
* [ ] Automatic emergency response integration
* [ ] Number plate recognition
* [ ] Fire/smoke detection
* [ ] Pedestrian incident detection
* [ ] Automatic incident video extraction
* [ ] SMS / Email alerts
* [ ] Emergency services integration
* [ ] Edge-device deployment
* [ ] NVIDIA Jetson optimization
* [ ] Raspberry Pi optimization
* [ ] Indian-road-specific dataset
* [ ] Custom crash-model fine-tuning
* [ ] Historical incident analytics

---

# 🌆 Vision

Aegis CityPulse aims to transform conventional CCTV infrastructure into an intelligent urban safety network.

Instead of simply recording incidents, the system continuously analyzes city traffic, identifies abnormal events, confirms potential crashes using temporal AI, and brings critical incidents to the attention of monitoring personnel.

```text
             👁️ SEE
               ↓
          🧠 ANALYZE
               ↓
          🎯 CONFIRM
               ↓
          🚨 ALERT
               ↓
          👮 RESPOND
               ↓
          🏙️ PROTECT
```

---

# 👥 Team

## PIVOT

### Project: Aegis CityPulse

**AI-Powered Real-Time Crash Detection & Intelligent City Monitoring**

---

## 📜 License

This project is intended for research, educational, hackathon, and prototype development purposes.

Individual AI models, datasets, libraries, and third-party components used by Aegis CityPulse may have their own licenses. Check the respective licenses before commercial deployment.

---

# 🛡️ Aegis CityPulse

### *See the City. Understand the Event. Enable the Response.*

**Built by Team PIVOT**

```
```
