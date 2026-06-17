import numpy as np
import pandas as pd
from typing import Dict, List, Tuple


class TrackAnalyzer:
    """Analyzes tracking data to extract velocity and heading information."""

    def __init__(self, fps: float = 15.0):
        self.fps = fps
        self.dt = 1.0 / fps
        self.tracks: Dict[int, List[Tuple[float, float, float]]] = (
            {}
        )  # {id: [(frame, x, y)]}

    def add_observation(
        self, track_id: int, frame_idx: int, x: float, y: float
    ) -> None:
        if track_id not in self.tracks:
            self.tracks[track_id] = []
        self.tracks[track_id].append((frame_idx, x, y))

    def calculate_velocity(
        self, track_id: int, window: int = 5
    ) -> Tuple[float, float, float, float]:
        """Returns (vx, vy, speed, heading_deg)"""
        obs = self.tracks.get(track_id, [])
        if len(obs) < 2:
            return 0.0, 0.0, 0.0, 0.0

        # Use simple difference for now, could use Kalman or window smoothing
        p1 = obs[-2]
        p2 = obs[-1]

        dx = p2[1] - p1[1]
        dy = p2[2] - p1[2]
        df = p2[0] - p1[0]

        if df == 0:
            return 0.0, 0.0, 0.0, 0.0

        vx = dx / (df * self.dt)
        vy = dy / (df * self.dt)
        speed = np.sqrt(vx**2 + vy**2)
        heading = np.degrees(np.arctan2(vy, vx))

        return vx, vy, speed, heading

    def get_summary(self) -> pd.DataFrame:
        return pd.DataFrame()


if __name__ == "__main__":
    # Example usage
    analyzer = TrackAnalyzer(fps=15)
    analyzer.add_observation(1, 0, 100, 100)
    analyzer.add_observation(1, 1, 105, 102)
    vx, vy, speed, heading = analyzer.calculate_velocity(1)
    print(
        "ID 1: Velocity="
        f"({vx:.2f}, {vy:.2f}), Speed={speed:.2f}, "
        f"Heading={heading:.2f} deg"
    )
