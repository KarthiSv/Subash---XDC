"""Turns a dictated sentence into a list of structured PC actions.

The mediator never sends raw text or shell commands to the PC. It sends a list
of actions from a fixed vocabulary (see ACTIONS), and the Windows agent only
executes actions it knows. That keeps a misheard phrase from doing anything
unexpected.

    >>> parse("open netflix in chrome")
    [{'action': 'open_url', 'args': {'url': 'https://www.netflix.com', 'browser': 'chrome'}}]
"""

from __future__ import annotations

import re
from typing import Iterable

# Every action the Windows agent understands, with the args it accepts.
ACTIONS: dict[str, str] = {
    "open_app": "name",
    "close_app": "name",
    "open_url": "url, browser?",
    "web_search": "query, site? (google|youtube|amazon|netflix|spotify), browser?",
    "volume_up": "steps? (1 step = 2%)",
    "volume_down": "steps?",
    "volume_set": "level (0-100)",
    "mute": "",
    "media_play_pause": "",
    "media_next": "",
    "media_previous": "",
    "media_stop": "",
    "brightness_set": "level (0-100)",
    "brightness_up": "",
    "brightness_down": "",
    "sleep": "",
    "hibernate": "",
    "shutdown": "delay? seconds",
    "restart": "delay? seconds",
    "cancel_shutdown": "",
    "lock": "",
    "sign_out": "",
    "radio": "kind (bluetooth|wifi), state (on|off)",
    "bt_disconnect": "device",
    "bt_connect": "device",
    "bt_list": "",
    "type_text": "text",
    "press_keys": "keys (e.g. 'ctrl+c', 'alt+tab', 'enter')",
    "scroll": "direction (up|down), amount?",
    "screenshot": "",
    "run_custom": "name",
}

SITES: dict[str, str] = {
    "netflix": "https://www.netflix.com",
    "youtube": "https://www.youtube.com",
    "youtube music": "https://music.youtube.com",
    "gmail": "https://mail.google.com",
    "google": "https://www.google.com",
    "google drive": "https://drive.google.com",
    "drive": "https://drive.google.com",
    "google maps": "https://maps.google.com",
    "maps": "https://maps.google.com",
    "amazon": "https://www.amazon.in",
    "prime video": "https://www.primevideo.com",
    "amazon prime": "https://www.primevideo.com",
    "hotstar": "https://www.hotstar.com",
    "disney hotstar": "https://www.hotstar.com",
    "jiohotstar": "https://www.hotstar.com",
    "facebook": "https://www.facebook.com",
    "instagram": "https://www.instagram.com",
    "twitter": "https://x.com",
    "linkedin": "https://www.linkedin.com",
    "whatsapp web": "https://web.whatsapp.com",
    "chatgpt": "https://chatgpt.com",
    "claude": "https://claude.ai",
    "github": "https://github.com",
    "outlook": "https://outlook.live.com",
    "reddit": "https://www.reddit.com",
    "wikipedia": "https://www.wikipedia.org",
}

BROWSERS = {
    "chrome": "chrome",
    "google chrome": "chrome",
    "edge": "edge",
    "microsoft edge": "edge",
    "firefox": "firefox",
    "brave": "brave",
    "opera": "opera",
}

SEARCH_SITES = {"google", "youtube", "amazon", "netflix", "spotify", "bing", "wikipedia"}

_FILLER_PREFIX = re.compile(
    r"^(?:(?:hey|ok|okay|hi)\s+)?(?:computer|pc|laptop|windows|jarvis|siri)?[,\s]*"
    r"(?:(?:can|could|would|will) you\s+)?(?:please\s+)?(?:just\s+)?(?:quickly\s+)?"
    r"(?:(?:i want to|i wanna|i'd like to|let's|lets)\s+)?"
)
_FILLER_SUFFIX = re.compile(r"\s+(?:please|for me|now please|on my (?:pc|computer|laptop)|on the (?:pc|computer))$")

_NUM_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
    "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100, "a hundred": 100,
    "one hundred": 100, "half": 50, "max": 100, "maximum": 100, "full": 100,
}
_TENS = r"(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)"
_UNITS = r"(one|two|three|four|five|six|seven|eight|nine)"


def _words_to_numbers(text: str) -> str:
    def compound(m: re.Match) -> str:
        return str(_NUM_WORDS[m.group(1)] + _NUM_WORDS[m.group(2)])

    text = re.sub(rf"\b{_TENS}[\s-]{_UNITS}\b", compound, text)
    for word in sorted(_NUM_WORDS, key=len, reverse=True):
        if word in ("max", "maximum", "full", "half"):
            continue
        text = re.sub(rf"\b{word}\b", str(_NUM_WORDS[word]), text)
    return text


def normalize(text: str) -> str:
    t = text.strip().lower()
    t = t.replace("’", "'")
    t = re.sub(r"\s+dot\s+(com|in|org|net|io|ai|co)\b", r".\1", t)
    t = re.sub(r"[!?;\"“”]", " ", t)
    t = re.sub(r"(?<!\d)[.,](?!\w)", " ", t)  # sentence punctuation, keep "netflix.com" and "2.5"
    t = re.sub(r"\s+", " ", t).strip()
    t = _FILLER_PREFIX.sub("", t, count=1).strip()
    t = _FILLER_SUFFIX.sub("", t).strip()
    t = re.sub(r"%|\s+percent\b", "", t)
    t = _words_to_numbers(t)
    return t


def _a(action: str, **args) -> dict:
    return {"action": action, "args": {k: v for k, v in args.items() if v is not None}}


def _clean_name(name: str) -> str:
    name = re.sub(r"^(?:the|my|a|an)\s+", "", name.strip())
    name = re.sub(r"\s+(?:app|application|program|window)$", "", name)
    return name.strip()


def _url_for(target: str) -> str | None:
    target = target.strip()
    if target in SITES:
        return SITES[target]
    bare = re.sub(r"\s+(?:website|site|dot com|web)$", "", target)
    if bare in SITES:
        return SITES[bare]
    if re.fullmatch(r"(https?://)?[\w-]+(\.[\w-]+)+(/\S*)?", target):
        return target if target.startswith("http") else f"https://{target}"
    return None


def _volume_steps(amount: str | None, default: int = 5) -> int:
    # Windows media keys move volume by 2% per press.
    if not amount:
        return default
    return max(1, round(int(amount) / 2))


_KEY_ALIASES = {
    "control": "ctrl", "escape": "esc", "return": "enter", "windows": "win", "window": "win",
    "start": "win", "page up": "pageup", "page down": "pagedown", "spacebar": "space",
    "back space": "backspace", "print screen": "printscreen", "delete": "delete",
    "arrow up": "up", "arrow down": "down", "arrow left": "left", "arrow right": "right",
    "up arrow": "up", "down arrow": "down", "left arrow": "left", "right arrow": "right",
}


def _keys(spoken: str) -> str:
    s = spoken.strip()
    for alias, key in sorted(_KEY_ALIASES.items(), key=lambda kv: -len(kv[0])):
        s = re.sub(rf"\b{alias}\b", key, s)
    parts = [p for p in re.split(r"\s*(?:\+|plus|and|then|\s)\s*", s) if p]
    return "+".join(parts)


# Fixed shortcuts: phrase regex -> action. Checked in order, first match wins.
_SIMPLE: list[tuple[str, dict]] = [
    (r"(?:cancel|abort|stop) (?:the )?(?:shutdown|shut down|restart|reboot)", _a("cancel_shutdown")),
    (r"(?:go to |put (?:the )?(?:pc|computer|laptop|system) (?:to |in )?)?sleep(?: mode)?(?: now)?|sleep (?:the )?(?:pc|computer|laptop|system)", _a("sleep")),
    (r"hibernate(?: (?:the )?(?:pc|computer|laptop))?", _a("hibernate")),
    (r"lock(?: the| my)?(?: (?:pc|computer|laptop|screen|system|windows))?", _a("lock")),
    (r"(?:sign|log) (?:out|off)", _a("sign_out")),
    (r"mute|unmute|silence|toggle mute|(?:mute|unmute) (?:the )?(?:sound|audio|volume|pc|computer)", _a("mute")),
    (r"(?:max|maximum|full) volume|volume (?:to )?(?:max|maximum|full)", _a("volume_set", level=100)),
    (r"louder|turn it up", _a("volume_up")),
    (r"quieter|softer|turn it down", _a("volume_down")),
    (r"(?:play|pause|resume|play pause|play/pause)(?: (?:the )?(?:music|video|song|movie|media|it))?", _a("media_play_pause")),
    (r"(?:stop (?:the )?(?:music|video|media|playback))", _a("media_stop")),
    (r"(?:next|skip)(?: (?:the )?(?:track|song|video|episode))?", _a("media_next")),
    (r"(?:previous|last|go back a) (?:track|song|video)|previous", _a("media_previous")),
    (r"(?:take a |take )?screen ?shot", _a("screenshot")),
    (r"(?:minimi[sz]e (?:all|everything)(?: windows)?|show (?:the )?desktop|go to (?:the )?desktop)", _a("press_keys", keys="win+d")),
    (r"(?:switch|change) (?:the )?(?:window|app|apps|windows)", _a("press_keys", keys="alt+tab")),
    (r"close (?:this|the|current)? ?(?:window|app)|close it", _a("press_keys", keys="alt+f4")),
    (r"(?:close|shut) (?:this |the |current )?tab", _a("press_keys", keys="ctrl+w")),
    (r"(?:open |new )(?:a )?(?:new )?tab", _a("press_keys", keys="ctrl+t")),
    (r"(?:go )?full ?screen|(?:make it|enter) full ?screen", _a("press_keys", keys="f")),
    (r"exit full ?screen", _a("press_keys", keys="esc")),
    (r"(?:refresh|reload)(?: (?:the )?page)?", _a("press_keys", keys="f5")),
    (r"go back|back", _a("press_keys", keys="alt+left")),
    (r"go forward|forward", _a("press_keys", keys="alt+right")),
    (r"(?:hit |press )?enter", _a("press_keys", keys="enter")),
    (r"maximi[sz]e(?: (?:this|the))?(?: window)?", _a("press_keys", keys="win+up")),
    (r"minimi[sz]e(?: (?:this|the))?(?: window)?", _a("press_keys", keys="win+down")),
    (r"(?:list|show)(?: (?:my|the|all))? (?:paired )?bluetooth devices", _a("bt_list")),
    (r"brightness up|(?:increase|raise) (?:the )?brightness|brighter", _a("brightness_up")),
    (r"brightness down|(?:decrease|lower|reduce|dim) (?:the )?brightness|dimmer|darker", _a("brightness_down")),
]
_SIMPLE_COMPILED = [(re.compile(rf"^(?:{p})$"), a) for p, a in _SIMPLE]

_BROWSER_RE = "|".join(sorted(map(re.escape, BROWSERS), key=len, reverse=True))
_POWER_TARGET = r"(?: (?:the|my))?(?: (?:pc|computer|laptop|system|windows|desktop|machine))?"
_DELAY = r"(?: (?:in|after) (\d+) (second|seconds|sec|secs|minute|minutes|min|mins))?(?: now)?"


def _delay(n: str | None, unit: str | None) -> int | None:
    if not n:
        return None
    return int(n) * (60 if unit and unit.startswith("min") else 1)


def parse_one(t: str, custom: Iterable[str] = ()) -> list[dict] | None:
    """Parse a single normalized clause. Returns None if not understood."""
    if not t:
        return None

    custom_map = {c.lower(): c for c in custom}
    if t in custom_map:
        return [_a("run_custom", name=custom_map[t])]
    m = re.fullmatch(r"(?:run|execute|do) (?:the )?(?:custom )?(?:command |script |macro )?(.+)", t)
    if m and m.group(1) in custom_map:
        return [_a("run_custom", name=custom_map[m.group(1)])]

    for rx, action in _SIMPLE_COMPILED:
        if rx.match(t):
            return [{"action": action["action"], "args": dict(action["args"])}]

    # --- Bluetooth / Wi-Fi radios ------------------------------------------
    m = re.fullmatch(r"(?:switch|turn|toggle|put) (on|off) (?:the )?(bluetooth|wi-?fi|wireless)|"
                     r"(?:switch|turn|put) (?:the )?(bluetooth|wi-?fi|wireless) (on|off)|"
                     r"(bluetooth|wi-?fi) (on|off)|(enable|disable|start|stop) (?:the )?(bluetooth|wi-?fi)", t)
    if m:
        g = [x for x in m.groups() if x]
        kind = next(x for x in g if x.startswith(("blue", "wi", "wire")))
        state_word = next(x for x in g if x not in (kind,))
        state = "on" if state_word in ("on", "enable", "start") else "off"
        return [_a("radio", kind="bluetooth" if kind.startswith("blue") else "wifi", state=state)]

    # --- Bluetooth devices --------------------------------------------------
    m = re.fullmatch(
        r"(disconnect|unpair|connect|reconnect|pair)(?: (?:from|to|with))?(?: (?:the|my))?"
        r"(?: bluetooth)?(?: (?:speaker|speakers|headphones?|headset|earbuds|earphones|buds|device|soundbar|mouse|keyboard))?"
        r"(?: (?:named|called))? (.+?)(?: (?:speaker|speakers|headphones|headset|earbuds|device))?", t)
    if m and not re.fullmatch(r"(?:to )?(?:the )?(?:wi-?fi|internet|network)", m.group(2)):
        verb, device = m.group(1), m.group(2).strip()
        action = "bt_disconnect" if verb in ("disconnect", "unpair") else "bt_connect"
        return [_a(action, device=device)]

    # --- Power --------------------------------------------------------------
    m = re.fullmatch(rf"(?:shut ?down|shut it down|turn off|power off|switch off|power down){_POWER_TARGET}{_DELAY}", t)
    if m:
        return [_a("shutdown", delay=_delay(m.group(1), m.group(2)))]
    m = re.fullmatch(rf"(?:restart|reboot){_POWER_TARGET}{_DELAY}", t)
    if m:
        return [_a("restart", delay=_delay(m.group(1), m.group(2)))]

    # --- Volume -------------------------------------------------------------
    m = re.fullmatch(r"(?:set |change |put |make )?(?:the )?(?:volume|sound)(?: level)? (?:to |at )?(\d{1,3})|volume (\d{1,3})", t)
    if m:
        return [_a("volume_set", level=min(100, int(m.group(1) or m.group(2))))]
    m = re.fullmatch(r"(?:(?:turn|crank|pump) (?:the )?(?:volume|sound|music) up|(?:volume|sound) up|"
                     r"(?:increase|raise|boost) (?:the )?(?:volume|sound))(?: (?:by )?(\d{1,3}))?", t)
    if m:
        return [_a("volume_up", steps=_volume_steps(m.group(1)))]
    m = re.fullmatch(r"(?:turn (?:the )?(?:volume|sound|music) down|(?:volume|sound) down|"
                     r"(?:decrease|lower|reduce) (?:the )?(?:volume|sound))(?: (?:by )?(\d{1,3}))?", t)
    if m:
        return [_a("volume_down", steps=_volume_steps(m.group(1)))]

    # --- Brightness ---------------------------------------------------------
    m = re.fullmatch(r"(?:set |change |make )?(?:the )?(?:screen )?brightness (?:to |at )?(\d{1,3})", t)
    if m:
        return [_a("brightness_set", level=min(100, int(m.group(1))))]

    # --- Keyboard -----------------------------------------------------------
    m = re.fullmatch(r"(?:type|write|enter text|dictate)(?: in| out)? (.+)", t)
    if m:
        return [_a("type_text", text=m.group(1))]
    m = re.fullmatch(r"(?:press|hit|push)(?: the)? (.+?)(?: key| keys| button)?", t)
    if m:
        return [_a("press_keys", keys=_keys(m.group(1)))]
    m = re.fullmatch(r"scroll (up|down)(?: (?:by )?(\d+))?", t)
    if m:
        return [_a("scroll", direction=m.group(1), amount=int(m.group(2)) if m.group(2) else None)]

    # --- Search -------------------------------------------------------------
    m = re.fullmatch(rf"(?:play|watch|search|find|look up|search for|find me)(?: for)? (.+?) on ({'|'.join(SEARCH_SITES)})(?: (?:in|on|using|with) ({_BROWSER_RE}))?", t)
    if m:
        return [_a("web_search", query=m.group(1), site=m.group(2), browser=BROWSERS.get(m.group(3) or "", None))]
    m = re.fullmatch(rf"(?:search|look up|find) ({'|'.join(SEARCH_SITES)}) for (.+?)(?: (?:in|on|using|with) ({_BROWSER_RE}))?", t)
    if m:
        return [_a("web_search", query=m.group(2), site=m.group(1), browser=BROWSERS.get(m.group(3) or "", None))]
    m = re.fullmatch(rf"(google|youtube) (.+)", t)
    if m and not _url_for(t):
        return [_a("web_search", query=m.group(2), site=m.group(1))]
    m = re.fullmatch(r"(?:play|watch|put on) (.+)", t)
    if m:
        return [_a("web_search", query=m.group(1), site="youtube")]
    m = re.fullmatch(r"(?:search for|search|look up|google|what is|what's|who is|how to) (.+)", t)
    if m:
        q = m.group(1) if t.startswith(("search", "look", "google")) else t
        return [_a("web_search", query=q, site="google")]

    # --- Open / close -------------------------------------------------------
    m = re.fullmatch(rf"(?:open|launch|start|run|go to|load|show|bring up|pull up|visit)(?: up)? (.+?) (?:in|on|using|with|from|inside) ({_BROWSER_RE})(?: browser)?", t)
    if m:
        target, browser = _clean_name(m.group(1)), BROWSERS[m.group(2)]
        url = _url_for(target)
        if not url and " " not in target and "." not in target:
            url = _url_for(target + ".com")
        if not url:
            return [_a("web_search", query=target, site="google", browser=browser)]
        return [_a("open_url", url=url, browser=browser)]
    m = re.fullmatch(r"(?:go to|visit|browse to|navigate to|open website|open the website|open site)(?: the)? (.+)", t)
    if m:
        target = _clean_name(m.group(1))
        url = _url_for(target) or f"https://{target.replace(' ', '')}.com"
        return [_a("open_url", url=url)]
    m = re.fullmatch(r"(?:open|launch|start|run|fire up|bring up|pull up|load)(?: up)? (.+)", t)
    if m:
        target = _clean_name(m.group(1))
        if target in BROWSERS:
            return [_a("open_app", name=BROWSERS[target])]
        url = _url_for(target)
        if url:
            return [_a("open_url", url=url)]
        return [_a("open_app", name=target)]
    m = re.fullmatch(r"(?:close|quit|exit|kill|end|stop|terminate)(?: the)? (.+)", t)
    if m:
        return [_a("close_app", name=_clean_name(m.group(1)))]

    return None


_SPLIT_RE = re.compile(r"\s*(?:,\s*and then|,\s*then|\band then\b|\bthen\b|\balso\b|\band\b|,)\s*")


def parse(text: str, custom: Iterable[str] = (), macros: dict[str, list[str]] | None = None,
          _depth: int = 0) -> list[dict] | None:
    """Parse a whole utterance, which may chain several commands with "and"/"then"."""
    t = normalize(text)
    if not t:
        return None
    custom = list(custom)
    macros = {k.lower(): v for k, v in (macros or {}).items()}

    if t in macros and _depth < 3:
        out: list[dict] = []
        for step in macros[t]:
            sub = parse(step, custom, macros, _depth + 1)
            if sub:
                out.extend(sub)
        return out or None

    # Prefer splitting into several commands only when every piece is understood,
    # so "search youtube for tom and jerry" stays one search.
    parts = [p for p in _SPLIT_RE.split(t) if p]
    if len(parts) > 1:
        chained: list[dict] = []
        for p in parts:
            sub = parse(p, custom, macros, _depth + 1) if p in macros else parse_one(p, custom)
            if not sub:
                break
            chained.extend(sub)
        else:
            return chained

    return parse_one(t, custom)


def describe(actions: list[dict]) -> str:
    """Short human-readable summary, spoken back to the user."""
    words = []
    for a in actions:
        name, args = a["action"], a.get("args", {})
        detail = ", ".join(f"{v}" for v in args.values())
        words.append(name.replace("_", " ") + (f" ({detail})" if detail else ""))
    return "; ".join(words)
