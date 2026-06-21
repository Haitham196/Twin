"""
Idle animation parameter generator for LivePortrait.
Produces natural-looking micro-movements when the twin is not speaking.
"""

import math
import random
import time
from dataclasses import dataclass


@dataclass
class AnimationParams:
    yaw: float = 0.0       # head left/right tilt (-ve = left)
    pitch: float = 0.0     # head up/down tilt
    roll: float = 0.0      # head tilt (ear to shoulder)
    gaze_x: float = 0.0    # eye gaze horizontal (-1 left, +1 right)
    gaze_y: float = 0.0    # eye gaze vertical
    blink: float = 0.0     # 0 = open, 1 = closed
    mouth_open: float = 0.0  # 0 = closed, 1 = fully open


class IdleAnimator:
    def __init__(self):
        self._start = time.time()
        self._next_blink = self._schedule_blink()
        self._next_glance = time.time() + random.uniform(12, 20)
        self._glance_target_x = 0.0
        self._glance_active_until = 0.0
        self._next_camera_check = time.time() + 30.0
        self._camera_check_until = 0.0
        self._phase_yaw = random.uniform(0, 2 * math.pi)
        self._phase_pitch = random.uniform(0, 2 * math.pi)

    def _schedule_blink(self) -> float:
        return time.time() + random.uniform(3.0, 6.0)

    def get_params(self) -> AnimationParams:
        now = time.time()
        t = now - self._start

        # Micro head drift
        yaw = 2.0 * math.sin(t * 0.25 + self._phase_yaw)
        pitch = 1.2 * math.sin(t * 0.18 + self._phase_pitch)

        # Blink
        blink = 0.0
        if now >= self._next_blink:
            blink = 1.0
            if now >= self._next_blink + 0.12:
                self._next_blink = self._schedule_blink()
                blink = 0.0

        # Periodic glance left/right
        gaze_x = 0.0
        if now >= self._next_glance and now < self._glance_active_until:
            gaze_x = self._glance_target_x
        elif now >= self._next_glance and now >= self._glance_active_until:
            self._glance_target_x = random.choice([-0.28, 0.28])
            self._glance_active_until = now + random.uniform(1.5, 3.0)
            self._next_glance = self._glance_active_until + random.uniform(15, 22)
            gaze_x = self._glance_target_x

        # Camera check override (look directly at camera)
        if now >= self._next_camera_check and now < self._camera_check_until:
            gaze_x = 0.0
            yaw = 0.0
            pitch = 0.0
        elif now >= self._next_camera_check and now >= self._camera_check_until:
            self._camera_check_until = now + 2.0
            self._next_camera_check = self._camera_check_until + 30.0

        return AnimationParams(
            yaw=yaw,
            pitch=pitch,
            gaze_x=gaze_x,
            blink=blink,
        )


class SpeakingAnimator:
    """Drives lip sync from audio amplitude."""

    def get_params(self, amplitude: float, base: AnimationParams) -> AnimationParams:
        mouth_open = min(1.0, amplitude * 3.0)
        return AnimationParams(
            yaw=base.yaw,
            pitch=base.pitch,
            gaze_x=base.gaze_x,
            gaze_y=base.gaze_y,
            blink=base.blink,
            mouth_open=mouth_open,
        )
