"""
Barge-in controller — cancels the current response when new speech arrives.
"""
import asyncio


class BargeInController:
    def __init__(self):
        self._event = asyncio.Event()

    def cancel(self):
        self._event.set()

    def reset(self):
        self._event.clear()

    @property
    def cancelled(self) -> bool:
        return self._event.is_set()
