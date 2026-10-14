"""Optional: ask Claude to map phrases the rule parser didn't understand.

Enabled only when an Anthropic credential is available (ANTHROPIC_API_KEY, or an
`ant auth login` profile) and `llm_fallback` is true in config.json. Claude can
only pick from the same fixed action list the rule parser uses, and every
action it returns is re-validated before it reaches the PC.
"""

from __future__ import annotations

import json
import logging
import os

from parser import ACTIONS, SITES

log = logging.getLogger("mediator.llm")

MODEL = os.environ.get("PCREMOTE_MODEL", "claude-opus-5-5")

ARG_NAMES = ["name", "url", "browser", "query", "site", "steps", "level", "kind",
             "state", "device", "text", "keys", "direction", "amount", "delay"]
INT_ARGS = {"steps", "level", "amount", "delay"}

SCHEMA = {
    "type": "object",
    "properties": {
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": list(ACTIONS)},
                    # Every arg is a string so the schema stays strict; "" means unused.
                    "args": {
                        "type": "object",
                        "properties": {k: {"type": "string"} for k in ARG_NAMES},
                        "required": ARG_NAMES,
                        "additionalProperties": False,
                    },
                },
                "required": ["action", "args"],
                "additionalProperties": False,
            },
        },
        "reply": {"type": "string"},
    },
    "required": ["actions", "reply"],
    "additionalProperties": False,
}


def _system_prompt(custom: list[str]) -> str:
    actions = "\n".join(f"- {name}: {args or 'no args'}" for name, args in ACTIONS.items())
    sites = ", ".join(f"{k}={v}" for k, v in SITES.items())
    return f"""You translate a voice command, dictated on a phone, into actions on the user's Windows PC.

Available actions and their args:
{actions}

Known websites: {sites}
User-defined custom commands (use run_custom with the exact name): {", ".join(custom) or "none"}

Rules:
- Return the smallest list of actions that does what the user asked, in order. Use [] if nothing fits, and say why in "reply".
- Fill only the args an action uses; leave every other arg as "".
- Numbers go in as digit strings. Volume steps are 2% each ("volume up a lot" is about 10 steps).
- For "open X" prefer open_url when X is a website and open_app when X is a desktop program.
- Speech-to-text makes mistakes; read through obvious mis-hearings ("crow" -> "chrome", "net flicks" -> "netflix").
- "reply" is one short sentence that will be spoken back to the user."""


class LLMFallback:
    def __init__(self) -> None:
        self.client = None
        try:
            import anthropic
            self.client = anthropic.AsyncAnthropic()
            self._errors = anthropic
        except Exception as exc:  # SDK missing or no credentials
            log.info("Claude fallback disabled: %s", exc)

    @property
    def enabled(self) -> bool:
        return self.client is not None

    async def interpret(self, text: str, custom: list[str]) -> tuple[list[dict], str] | None:
        if not self.client:
            return None
        anthropic = self._errors
        try:
            response = await self.client.beta.messages.create(
                model=MODEL,
                max_tokens=4096,
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
                output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
                system=_system_prompt(custom),
                messages=[{"role": "user", "content": text}],
            )
        except anthropic.AuthenticationError:
            log.warning("Claude fallback: invalid API key")
            return None
        except anthropic.RateLimitError:
            log.warning("Claude fallback: rate limited")
            return None
        except anthropic.APIStatusError as exc:
            log.warning("Claude fallback: API error %s", exc.status_code)
            return None
        except anthropic.APIConnectionError:
            log.warning("Claude fallback: network error")
            return None
        except Exception as exc:  # e.g. no credentials could be resolved
            log.warning("Claude fallback failed: %s", exc)
            return None

        if response.stop_reason in ("refusal", "max_tokens"):
            return None
        raw = next((b.text for b in response.content if b.type == "text"), "")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None

        actions = []
        for item in data.get("actions", []):
            if item.get("action") not in ACTIONS:
                continue
            args = {}
            for k, v in (item.get("args") or {}).items():
                if k not in ARG_NAMES or v in ("", None):
                    continue
                if k in INT_ARGS:
                    try:
                        v = int(float(v))
                    except ValueError:
                        continue
                args[k] = v
            actions.append({"action": item["action"], "args": args})
        return actions, data.get("reply", "")
