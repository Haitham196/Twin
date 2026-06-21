"""
Voice Activity Detection.
Uses energy threshold by default; Silero VAD if torch is available.
"""
import numpy as np

try:
    import torch
    _TORCH = True
except ImportError:
    _TORCH = False

_silero_model = None


def _load_silero():
    global _silero_model
    if _silero_model is None and _TORCH:
        try:
            _silero_model, _ = torch.hub.load(
                repo_or_dir="snakers4/silero-vad",
                model="silero_vad",
                force_reload=False,
            )
        except Exception:
            pass
    return _silero_model


def is_speech(audio_bytes: bytes, sample_rate: int = 16000, threshold: float = 0.5) -> bool:
    """Return True if the audio chunk likely contains speech."""
    arr = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    model = _load_silero()
    if model is not None:
        try:
            tensor = torch.FloatTensor(arr).unsqueeze(0)
            with torch.no_grad():
                score = model(tensor, sample_rate).item()
            return score >= threshold
        except Exception:
            pass

    # Energy fallback
    rms = float(np.sqrt(np.mean(arr ** 2)))
    return rms > 0.008
