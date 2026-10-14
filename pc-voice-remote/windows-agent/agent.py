"""PC Voice Remote — Windows agent.

Keeps an outgoing WebSocket open to the mediator and runs the actions it sends.
Because the connection is outgoing, the PC needs no open ports and works the
same whether the mediator is on this PC, on your LAN or in the cloud.

Run:  python agent.py            (reads config.json next to this file)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import platform
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import aiohttp

from actions import ActionError, Actions

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
CONFIG_PATH = HERE / "config.json"

log = logging.getLogger("agent")


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        shutil.copy(HERE / "config.example.json", CONFIG_PATH)
        print(f"Created {CONFIG_PATH}. Put the mediator's token in it, then run again.")
        sys.exit(1)
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    cfg["token"] = os.environ.get("PCREMOTE_TOKEN") or cfg.get("token", "")
    cfg["mediator_url"] = os.environ.get("PCREMOTE_MEDIATOR") or cfg.get("mediator_url", "ws://127.0.0.1:8765/ws/agent")
    if not cfg["token"] or cfg["token"].startswith("PASTE"):
        print("Set \"token\" in config.json to the token the mediator prints at startup.")
        sys.exit(1)
    return cfg


async def run_actions(actions: Actions, pool: ThreadPoolExecutor, items: list[dict]) -> list[dict]:
    loop = asyncio.get_running_loop()
    results = []
    for item in items:
        name, args = item.get("action", ""), item.get("args") or {}
        try:
            message = await loop.run_in_executor(pool, actions.run, name, args)
            results.append({"action": name, "ok": True, "message": message})
        except ActionError as exc:
            results.append({"action": name, "ok": False, "message": str(exc)})
        except TypeError as exc:
            results.append({"action": name, "ok": False, "message": f"Bad arguments for {name}: {exc}"})
        except Exception as exc:  # keep the agent alive whatever happens
            log.exception("Action %s failed", name)
            results.append({"action": name, "ok": False, "message": f"{name} failed: {exc}"})
        log.info("%s %s -> %s", name, args, results[-1]["message"])
        if len(items) > 1:
            await asyncio.sleep(float(item.get("pause", 0.8)))  # let apps open before the next step
    return results


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S",
                        handlers=[logging.StreamHandler(), logging.FileHandler(HERE / "agent.log", encoding="utf-8")])
    cfg = load_config()
    actions = Actions(cfg)
    pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="action")  # one action at a time, in order
    name = cfg.get("agent_name") or platform.node() or "pc"
    url = cfg["mediator_url"]
    headers = {"Authorization": f"Bearer {cfg['token']}"}
    backoff = 1

    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(url, params={"name": name}, headers=headers, heartbeat=20,
                                              ssl=cfg.get("verify_tls", True)) as ws:
                    log.info("Connected to mediator at %s as '%s'", url, name)
                    backoff = 1
                    await ws.send_json({"type": "hello", "hostname": platform.node(), "version": VERSION,
                                        "custom_commands": list(cfg.get("custom_commands", {}))})
                    async for msg in ws:
                        if msg.type != aiohttp.WSMsgType.TEXT:
                            continue
                        data = json.loads(msg.data)
                        if data.get("type") == "run":
                            results = await run_actions(actions, pool, data.get("actions", []))
                            await ws.send_json({"type": "result", "id": data.get("id"), "results": results})
                    log.warning("Mediator closed the connection")
        except aiohttp.WSServerHandshakeError as exc:
            if exc.status == 401:
                log.error("Mediator rejected the token. Check \"token\" in config.json.")
            else:
                log.warning("Handshake failed: %s", exc)
        except (aiohttp.ClientError, OSError) as exc:
            log.warning("Can't reach mediator at %s (%s)", url, exc)
        await asyncio.sleep(backoff)
        backoff = min(backoff * 2, 30)


if __name__ == "__main__":
    if os.name != "nt":
        print("Note: the agent's actions only work on Windows.")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
