"""PC Voice Remote mediator.

Sits between the phone and the Windows PC:

    iPhone (web app / Siri Shortcut / native app)
        --HTTPS POST /api/command {"text": "..."}-->  mediator  --WebSocket-->  Windows agent

The phone sends what you said. The mediator turns it into structured actions
(parser.py, with an optional Claude fallback in llm.py), forwards them to the
connected PC agent, waits for the result and replies with something short the
phone can show or speak.

Run:  python mediator.py            (listens on 0.0.0.0:8765)
"""

from __future__ import annotations

import argparse
import asyncio
import hmac
import json
import logging
import os
import secrets
import socket
import ssl
import time
import uuid
from collections import deque
from pathlib import Path

from aiohttp import WSMsgType, web

from parser import ACTIONS, describe, parse

HERE = Path(__file__).resolve().parent
STATIC = HERE / "static"
CONFIG_PATH = HERE / "config.json"
AGENT_TIMEOUT = 20  # seconds to wait for the PC to report back

log = logging.getLogger("mediator")


def load_config() -> dict:
    cfg: dict = {}
    example = HERE / "config.example.json"
    if not CONFIG_PATH.exists() and example.exists():
        CONFIG_PATH.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    token = os.environ.get("PCREMOTE_TOKEN") or cfg.get("token")
    if not token:
        token = secrets.token_urlsafe(18)
        cfg["token"] = token
        CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
        log.info("Generated a new access token and saved it to %s", CONFIG_PATH.name)
    cfg["token"] = token
    cfg.setdefault("macros", {})
    cfg.setdefault("llm_fallback", "auto")
    return cfg


class AgentHub:
    """Tracks connected PC agents and matches results to requests."""

    def __init__(self) -> None:
        self.agents: dict[str, dict] = {}  # name -> {"ws", "custom", "since", "info"}
        self.pending: dict[str, asyncio.Future] = {}

    def pick(self, name: str | None) -> tuple[str, dict] | None:
        if name and name in self.agents:
            return name, self.agents[name]
        if self.agents:
            # Most recently connected agent wins when no name is given.
            name = max(self.agents, key=lambda n: self.agents[n]["since"])
            return name, self.agents[name]
        return None

    async def run(self, agent_name: str | None, actions: list[dict]) -> dict:
        picked = self.pick(agent_name)
        if not picked:
            return {"ok": False, "message": "Your PC is offline. Start the agent on Windows."}
        name, agent = picked
        req_id = uuid.uuid4().hex
        fut = asyncio.get_running_loop().create_future()
        self.pending[req_id] = fut
        try:
            await agent["ws"].send_json({"type": "run", "id": req_id, "actions": actions})
            results = await asyncio.wait_for(fut, AGENT_TIMEOUT)
        except asyncio.TimeoutError:
            return {"ok": False, "agent": name, "message": "The PC didn't answer in time."}
        except ConnectionError:
            return {"ok": False, "agent": name, "message": "Lost connection to the PC."}
        finally:
            self.pending.pop(req_id, None)
        ok = all(r.get("ok") for r in results)
        message = "; ".join(r.get("message", "") for r in results if r.get("message"))
        return {"ok": ok, "agent": name, "results": results, "message": message or ("Done" if ok else "Failed")}

    def resolve(self, req_id: str, results: list[dict]) -> None:
        fut = self.pending.get(req_id)
        if fut and not fut.done():
            fut.set_result(results)


CONFIG = web.AppKey("config", dict)
HUB = web.AppKey("hub", AgentHub)
HISTORY = web.AppKey("history", deque)
LLM = web.AppKey("llm", object)


def _authorized(request: web.Request, token: str) -> bool:
    supplied = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    supplied = supplied or request.query.get("token", "") or request.headers.get("X-Token", "")
    return bool(supplied) and hmac.compare_digest(supplied.encode(), token.encode())


@web.middleware
async def auth_middleware(request: web.Request, handler):
    if request.path.startswith("/api/") or request.path.startswith("/ws/"):
        if not _authorized(request, request.app[CONFIG]["token"]):
            return web.json_response({"ok": False, "message": "Wrong or missing access token."}, status=401)
    return await handler(request)


async def handle_command(request: web.Request) -> web.Response:
    app = request.app
    try:
        body = await request.json()
    except Exception:
        body = {"text": await request.text()}
    text = str(body.get("text", "")).strip()
    agent_name = body.get("agent")
    if not text:
        return web.json_response({"ok": False, "message": "Say something first."}, status=400)

    hub: AgentHub = app[HUB]
    picked = hub.pick(agent_name)
    custom = picked[1]["custom"] if picked else []

    actions = parse(text, custom=custom, macros=app[CONFIG]["macros"])
    source, reply = "rules", ""
    if not actions and app[LLM] is not None:
        interpreted = await app[LLM].interpret(text, custom)
        if interpreted:
            actions, reply = interpreted
            source = "claude"
    if not actions:
        result = {"ok": False, "heard": text, "message": reply or f"Sorry, I don't know how to \"{text}\" yet."}
        app[HISTORY].appendleft({**result, "time": time.time()})
        return web.json_response(result, status=422)

    actions = [a for a in actions if a.get("action") in ACTIONS]
    result = await hub.run(agent_name, actions)
    result.update({"heard": text, "actions": actions, "understood": describe(actions), "source": source})
    if reply and result["ok"]:
        result["message"] = reply
    app[HISTORY].appendleft({k: result[k] for k in ("ok", "heard", "understood", "message")} | {"time": time.time()})
    log.info("%r -> %s -> %s", text, result["understood"], result["message"])
    return web.json_response(result)


async def handle_status(request: web.Request) -> web.Response:
    hub: AgentHub = request.app[HUB]
    return web.json_response({
        "ok": True,
        "agents": [{"name": n, "connected_for": int(time.time() - a["since"]), **a["info"]} for n, a in hub.agents.items()],
        "claude_fallback": request.app[LLM] is not None,
        "history": list(request.app[HISTORY])[:20],
    })


async def handle_agent_ws(request: web.Request) -> web.WebSocketResponse:
    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(request)
    hub: AgentHub = request.app[HUB]
    name = request.query.get("name") or "pc"
    hub.agents[name] = {"ws": ws, "custom": [], "since": time.time(), "info": {}}
    log.info("Agent '%s' connected from %s", name, request.remote)
    try:
        async for msg in ws:
            if msg.type != WSMsgType.TEXT:
                continue
            data = json.loads(msg.data)
            if data.get("type") == "hello":
                hub.agents[name]["custom"] = data.get("custom_commands", [])
                hub.agents[name]["info"] = {k: data.get(k) for k in ("hostname", "version")}
            elif data.get("type") == "result":
                hub.resolve(data.get("id", ""), data.get("results", []))
    finally:
        if hub.agents.get(name, {}).get("ws") is ws:
            del hub.agents[name]
        log.info("Agent '%s' disconnected", name)
    return ws


async def handle_index(request: web.Request) -> web.FileResponse:
    return web.FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})


def lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def build_app(config: dict) -> web.Application:
    app = web.Application(middlewares=[auth_middleware])
    app[CONFIG] = config
    app[HUB] = AgentHub()
    app[HISTORY] = deque(maxlen=50)
    app[LLM] = None

    use_llm = config.get("llm_fallback")
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))
    if use_llm is True or (use_llm == "auto" and has_key):
        from llm import LLMFallback
        fallback = LLMFallback()
        app[LLM] = fallback if fallback.enabled else None

    app.router.add_get("/", handle_index)
    app.router.add_post("/api/command", handle_command)
    app.router.add_get("/api/status", handle_status)
    app.router.add_get("/ws/agent", handle_agent_ws)
    app.router.add_static("/", STATIC, show_index=False)
    return app


def main() -> None:
    ap = argparse.ArgumentParser(description="PC Voice Remote mediator")
    ap.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8765)))
    ap.add_argument("--cert", help="TLS certificate (PEM) to serve HTTPS directly")
    ap.add_argument("--key", help="TLS private key (PEM)")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s", datefmt="%H:%M:%S")
    config = load_config()
    app = build_app(config)

    ssl_ctx = None
    if args.cert and args.key:
        ssl_ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ssl_ctx.load_cert_chain(args.cert, args.key)

    scheme = "https" if ssl_ctx else "http"
    phone_url = f"{scheme}://{lan_ip()}:{args.port}/?token={config['token']}"
    print("\n  PC Voice Remote mediator")
    print(f"  Access token : {config['token']}")
    print(f"  Phone URL    : {phone_url}")
    print(f"  Agent URL    : ws://127.0.0.1:{args.port}/ws/agent  (same token)")
    print(f"  Claude fallback: {'on' if app[LLM] else 'off'}\n")
    try:
        import qrcode  # optional: pip install qrcode
        qr = qrcode.QRCode(border=1)
        qr.add_data(phone_url)
        qr.print_ascii(invert=True)
        print("  Scan with the iPhone camera to open the remote.\n")
    except ImportError:
        pass

    web.run_app(app, host=args.host, port=args.port, ssl_context=ssl_ctx, print=None)


if __name__ == "__main__":
    main()
