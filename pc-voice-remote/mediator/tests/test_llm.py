import json
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from llm import ARG_NAMES, LLMFallback  # noqa: E402


class FakeMessages:
    def __init__(self, payload):
        self.payload = payload
        self.kwargs = None

    async def create(self, **kwargs):
        self.kwargs = kwargs
        return SimpleNamespace(stop_reason="end_turn",
                               content=[SimpleNamespace(type="text", text=json.dumps(self.payload))])


async def test_interpret_validates_and_converts():
    blank = {k: "" for k in ARG_NAMES}
    payload = {
        "actions": [
            {"action": "volume_set", "args": {**blank, "level": "30"}},
            {"action": "format_c_drive", "args": blank},  # not a real action: dropped
            {"action": "open_app", "args": {**blank, "name": "spotify"}},
        ],
        "reply": "Quiet music time",
    }
    fb = LLMFallback()
    fake = FakeMessages(payload)
    fb.client = SimpleNamespace(beta=SimpleNamespace(messages=fake))
    actions, reply = await fb.interpret("make it quieter and put on some spotify", ["backup"])
    assert actions == [{"action": "volume_set", "args": {"level": 30}},
                       {"action": "open_app", "args": {"name": "spotify"}}]
    assert reply == "Quiet music time"
    assert fake.kwargs["model"] == "claude-opus-5-5"
    assert fake.kwargs["output_config"]["format"]["type"] == "json_schema"
