import asyncio
import sys
from pathlib import Path

import pytest
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mediator import build_app  # noqa: E402

TOKEN = "test-token"
AUTH = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
async def client():
    app = build_app({"token": TOKEN, "macros": {}, "llm_fallback": False})
    async with TestClient(TestServer(app)) as c:
        yield c


async def fake_agent(client, received):
    ws = await client.ws_connect("/ws/agent?name=test-pc", headers=AUTH)
    await ws.send_json({"type": "hello", "hostname": "TEST-PC", "custom_commands": ["start backup"]})
    async def loop():
        async for msg in ws:
            data = msg.json()
            received.append(data["actions"])
            await ws.send_json({"type": "result", "id": data["id"],
                                "results": [{"ok": True, "message": f"did {a['action']}"} for a in data["actions"]]})
    task = asyncio.create_task(loop())
    await asyncio.sleep(0.05)
    return ws, task


async def test_rejects_missing_token(client):
    res = await client.post("/api/command", json={"text": "volume up"})
    assert res.status == 401
    res = await client.get("/ws/agent")
    assert res.status == 401


async def test_offline_pc(client):
    res = await client.post("/api/command", json={"text": "volume up"}, headers=AUTH)
    data = await res.json()
    assert data["ok"] is False and "offline" in data["message"]


async def test_round_trip(client):
    received = []
    ws, task = await fake_agent(client, received)
    res = await client.post("/api/command", json={"text": "open netflix in chrome and volume up"}, headers=AUTH)
    data = await res.json()
    assert data["ok"], data
    assert [a["action"] for a in received[0]] == ["open_url", "volume_up"]
    assert data["message"] == "did open_url; did volume_up"

    res = await client.post("/api/command", json={"text": "start backup"}, headers=AUTH)
    assert (await res.json())["actions"] == [{"action": "run_custom", "args": {"name": "start backup"}}]

    status = await (await client.get("/api/status", headers=AUTH)).json()
    assert status["agents"][0]["hostname"] == "TEST-PC"
    await ws.close()
    task.cancel()


async def test_not_understood(client):
    res = await client.post("/api/command", json={"text": "the quick brown"}, headers=AUTH)
    assert res.status == 422


async def test_serves_web_app(client):
    res = await client.get("/")
    assert res.status == 200 and "PC Remote" in await res.text()
    assert (await client.get("/manifest.json")).status == 200
