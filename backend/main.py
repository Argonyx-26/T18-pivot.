import os
import cv2
import json
import asyncio
import numpy as np
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from tracker import VisionTrackerPipeline
from operator_agent import operator_agent

app = FastAPI(title="Aegis CityPulse Backend", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VIDEO_PATH = os.path.join(os.path.dirname(__file__), "crash_sample.mp4")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "accident_yolo11.pt")

pipeline = VisionTrackerPipeline(model_path=MODEL_PATH)

latest_state = {
    "alert_level": "NORMAL",
    "is_accident": False,
    "is_analyzing": False,
    "confidence": 0.0,
    "tracked_vehicles": 0,
    "current_time_sec": 0.0,
    "duration_sec": 1.0,
    "active_bins": 0
}

playback = {"is_playing": True, "seek_frame": None}
connected_sockets: Set[WebSocket] = set()

async def broadcast_ws(payload: dict):
    if not connected_sockets:
        return
    msg = json.dumps(payload)
    dead = set()
    for ws in list(connected_sockets):
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    for d in dead:
        connected_sockets.discard(d)

async def stream_frames():
    global latest_state

    if not os.path.exists(VIDEO_PATH):
        while True:
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "crash_sample.mp4 not found in /backend", (40, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 1)
            _, enc = cv2.imencode('.jpg', blank)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + enc.tobytes() + b'\r\n')
            await asyncio.sleep(0.04)

    cap = cv2.VideoCapture(VIDEO_PATH)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    latest_state["duration_sec"] = round(total_frames / fps, 2)
    frame_delay = 1.0 / fps

    while True:
        if not playback["is_playing"]:
            await asyncio.sleep(0.05)
            continue

        if playback["seek_frame"] is not None:
            cap.set(cv2.CAP_PROP_POS_FRAMES, playback["seek_frame"])
            playback["seek_frame"] = None

        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            await asyncio.sleep(0.01)
            continue

        cur_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
        annotated, meta = pipeline.process_frame(frame)

        prev_level = latest_state["alert_level"]
        latest_state.update({
            "alert_level": meta["alert_level"],
            "is_accident": meta["is_accident"],
            "is_analyzing": meta["is_analyzing"],
            "confidence": meta["confidence"],
            "tracked_vehicles": meta["tracked_vehicles"],
            "current_time_sec": round(cur_frame / fps, 2),
            "active_bins": meta["active_bins"]
        })

        # Broadcast immediately if alert level changed
        if prev_level != meta["alert_level"]:
            asyncio.create_task(broadcast_ws({
                "type": "INCIDENT_ALERT",
                "data": latest_state
            }))

        ret_enc, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ret_enc:
            await asyncio.sleep(0.01)
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        await asyncio.sleep(frame_delay * 0.4)

@app.get("/stream")
async def video_stream():
    return StreamingResponse(stream_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    connected_sockets.add(ws)
    try:
        while True:
            await ws.send_text(json.dumps({
                "type": "TELEMETRY_UPDATE",
                "data": latest_state
            }))
            await asyncio.sleep(0.12)
    except WebSocketDisconnect:
        connected_sockets.discard(ws)
    except Exception:
        connected_sockets.discard(ws)

class PlaybackBody(BaseModel):
    is_playing: bool | None = None
    seek_time_sec: float | None = None

@app.post("/api/playback")
def set_playback(body: PlaybackBody):
    if body.is_playing is not None:
        playback["is_playing"] = body.is_playing
    if body.seek_time_sec is not None:
        cap = cv2.VideoCapture(VIDEO_PATH)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        cap.release()
        playback["seek_frame"] = int(body.seek_time_sec * fps)
    return {"status": "ok"}

@app.get("/api/operator/telemetry")
def get_op_telemetry():
    return operator_agent.get_tactical_telemetry(latest_state["alert_level"])

class SignalBody(BaseModel):
    enabled: bool

@app.post("/api/operator/signal_preemption")
def toggle_sig(b: SignalBody):
    state = operator_agent.set_signal_preemption(b.enabled)
    return {"success": True, "force_green_active": state}

@app.get("/api/operator/brief")
async def get_brief():
    brief = await operator_agent.generate_incident_brief(latest_state)
    return {"brief": brief}

class ChatBody(BaseModel):
    message: str

@app.post("/api/operator/copilot")
async def chat_copilot(b: ChatBody):
    reply = await operator_agent.chat_copilot(b.message, latest_state)
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)