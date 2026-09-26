import cv2
import numpy as np
import math
from typing import List, Dict, Any, Tuple
from ultralytics import YOLO

class SpatialTrack:
    def __init__(self, track_id: int, bbox: List[float], conf: float, label: str):
        self.track_id = track_id
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.conf = conf
        self.label = label
        self.history = [self._center(bbox)]
        self.frames_active = 1
        self.confirmed = False
        self.frames_missing = 0
        self.stationary_frames = 0

    @staticmethod
    def _center(b: List[float]) -> Tuple[float, float]:
        return ((b[0] + b[2]) / 2.0, (b[1] + b[3]) / 2.0)

    def update(self, bbox: List[float], conf: float, label: str):
        self.bbox = bbox
        self.conf = conf
        self.label = label
        new_center = self._center(bbox)
        
        # Check instantaneous displacement (last frame vs current)
        last_center = self.history[-1]
        instant_drift = math.hypot(new_center[0] - last_center[0], new_center[1] - last_center[1])
        
        # If moving less than 6px between frames, count towards stationary rest
        if instant_drift < 6.0:
            self.stationary_frames += 1
        else:
            self.stationary_frames = max(0, self.stationary_frames - 1)

        self.history.append(new_center)
        if len(self.history) > 20:
            self.history.pop(0)
            
        self.frames_active += 1
        self.frames_missing = 0

    def recent_drift_velocity(self, window: int = 5) -> float:
        """Calculates displacement only over the recent window to allow skidding entry."""
        sub_hist = self.history[-window:]
        if len(sub_hist) < 2:
            return 0.0
        dist = 0.0
        for i in range(1, len(sub_hist)):
            dist += math.hypot(sub_hist[i][0] - sub_hist[i - 1][0], sub_hist[i][1] - sub_hist[i - 1][1])
        return dist / (len(sub_hist) - 1)


class VisionTrackerPipeline:
    def __init__(self, model_path: str = "accident_yolo11.pt"):
        self.model = YOLO(model_path)
        self.tracks: Dict[int, SpatialTrack] = {}
        self.next_track_id = 1
        self.min_persistence = 4       # Lowered frame threshold for faster locking
        self.max_drift_threshold = 12.0 # Generous ceiling to allow skids/spins
        self.iou_threshold = 0.30

    def _iou(self, boxA: List[float], boxB: List[float]) -> float:
        xA, yA = max(boxA[0], boxB[0]), max(boxA[1], boxB[1])
        xB, yB = min(boxA[2], boxB[2]), min(boxA[3], boxB[3])
        inter = max(0, xB - xA) * max(0, yB - yA)
        areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        return inter / float(areaA + areaB - inter + 1e-6)

    def _draw_bold_box(
        self, 
        img: np.ndarray, 
        x1: int, 
        y1: int, 
        x2: int, 
        y2: int, 
        label: str, 
        color: Tuple[int, int, int], 
        thickness: int = 3
    ):
        # Perimeter bounding box
        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

        # High-contrast Corner brackets
        corner_len = min(18, max(8, int((x2 - x1) * 0.15)))
        bracket_color = (255, 255, 255)
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            cv2.line(img, (cx, cy), (cx + dx * corner_len, cy), bracket_color, thickness + 1)
            cv2.line(img, (cx, cy), (cx, cy + dy * corner_len), bracket_color, thickness + 1)

        # Header Pill
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.48
        font_thick = 2
        (tw, th), _ = cv2.getTextSize(label, font, font_scale, font_thick)

        label_y1 = max(0, y1 - th - 10)
        label_y2 = y1
        label_x2 = min(img.shape[1], x1 + tw + 12)

        cv2.rectangle(img, (x1, label_y1), (label_x2, label_y2), color, -1)
        text_color = (255, 255, 255) if color == (0, 0, 240) else (10, 10, 15)
        cv2.putText(img, label, (x1 + 6, label_y2 - 5), font, font_scale, text_color, font_thick, cv2.LINE_AA)

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        results = self.model(frame, verbose=False, conf=0.28)[0]
        accident_candidates = []
        vehicles_count = 0

        for box in results.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            coords = box.xyxy[0].tolist()
            cls_name = results.names[cls_id].upper()

            # Catch accident class directly
            if "ACCIDENT" in cls_name or "CRASH" in cls_name or cls_id == 0:
                accident_candidates.append((coords, conf, cls_name))
            else:
                vehicles_count += 1
                x1, y1, x2, y2 = map(int, coords)
                self._draw_bold_box(frame, x1, y1, x2, y2, f"VEHICLE [{conf*100:.0f}%]", color=(220, 180, 0), thickness=2)

        matched = set()
        unmatched = []
        for det_box, conf, label in accident_candidates:
            best_id, best_iou = None, self.iou_threshold
            for tid, trk in self.tracks.items():
                if tid in matched:
                    continue
                iou = self._iou(det_box, trk.bbox)
                if iou > best_iou:
                    best_iou, best_id = iou, tid
            if best_id is not None:
                self.tracks[best_id].update(det_box, conf, label)
                matched.add(best_id)
            else:
                unmatched.append((det_box, conf, label))

        # Drop tracks if missing for more than 10 frames
        for tid in list(self.tracks.keys()):
            if tid not in matched:
                self.tracks[tid].frames_missing += 1
                if self.tracks[tid].frames_missing > 10:
                    del self.tracks[tid]

        for det_box, conf, label in unmatched:
            self.tracks[self.next_track_id] = SpatialTrack(self.next_track_id, det_box, conf, label)
            self.next_track_id += 1

        is_confirmed = False
        is_analyzing = False
        highest_conf = 0.0

        for tid, trk in self.tracks.items():
            recent_drift = trk.recent_drift_velocity(window=5)
            x1, y1, x2, y2 = map(int, trk.bbox)

            # Once confirmed, it remains confirmed (never drops back to transit)
            if trk.confirmed or (trk.frames_active >= self.min_persistence and recent_drift < self.max_drift_threshold):
                trk.confirmed = True
                is_confirmed = True
                highest_conf = max(highest_conf, trk.conf)

                alert_text = f"COLLISION ALERT #{tid} [{trk.conf*100:.0f}%]"
                self._draw_bold_box(frame, x1, y1, x2, y2, alert_text, color=(0, 0, 240), thickness=4)

            elif trk.frames_active >= 2:
                is_analyzing = True
                highest_conf = max(highest_conf, trk.conf)

                analyzing_text = f"ANALYZING IMPACT #{tid} ({trk.frames_active}/{self.min_persistence})"
                self._draw_bold_box(frame, x1, y1, x2, y2, analyzing_text, color=(0, 175, 255), thickness=3)

        alert_level = "CRITICAL" if is_confirmed else ("ANALYZING" if is_analyzing else "NORMAL")

        metadata = {
            "alert_level": alert_level,
            "is_accident": is_confirmed,
            "is_analyzing": is_analyzing,
            "confidence": round(highest_conf * 100, 1),
            "tracked_vehicles": vehicles_count,
            "active_bins": len(self.tracks)
        }
        return frame, metadata