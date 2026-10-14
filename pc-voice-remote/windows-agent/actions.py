"""Windows implementations of every action the mediator can send.

Each handler takes the action's args dict and returns a short message. Raise
ActionError with a friendly message when something can't be done.

Most actions only use the Python standard library (ctypes + built-in Windows
tools). Two optional extras make some actions nicer:
  pip install pycaw comtypes   -> exact "set volume to 40"
"""

from __future__ import annotations

import ctypes
import difflib
import json
import os
import subprocess
import threading
import time
import webbrowser
from ctypes import wintypes
from pathlib import Path
from urllib.parse import quote_plus

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE / "scripts"
CREATE_NO_WINDOW = 0x08000000


class ActionError(Exception):
    pass


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def powershell(script: str | None = None, file: Path | None = None, args: list[str] | None = None,
               timeout: int = 30) -> str:
    """Run Windows PowerShell 5.1 (needed for the WinRT radio APIs) hidden."""
    cmd = ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass"]
    cmd += ["-File", str(file), *(args or [])] if file else ["-Command", script or ""]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, creationflags=CREATE_NO_WINDOW)
    out = (proc.stdout or "").strip()
    if proc.returncode != 0:
        err = (proc.stderr or out or "PowerShell failed").strip().splitlines()
        raise ActionError(err[-1] if err else "PowerShell failed")
    return out


def later(seconds: float, fn, *args) -> None:
    """Run fn after a short delay so the agent can report back first (sleep, lock...)."""
    def run():
        time.sleep(seconds)
        fn(*args)
    threading.Thread(target=run, daemon=True).start()


def _start(target: str, *args: str) -> None:
    # `start` resolves App Paths (chrome, msedge, winword...) the same way the Run dialog does.
    subprocess.Popen(["cmd", "/c", "start", "", target, *args], creationflags=CREATE_NO_WINDOW)


# --------------------------------------------------------------------------
# Keyboard (SendInput)
# --------------------------------------------------------------------------

user32 = ctypes.WinDLL("user32", use_last_error=True) if os.name == "nt" else None

INPUT_KEYBOARD, INPUT_MOUSE = 1, 0
KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE = 0x1, 0x2, 0x4
MOUSEEVENTF_WHEEL = 0x0800
ULONG_PTR = ctypes.c_size_t


class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx", wintypes.LONG), ("dy", wintypes.LONG), ("mouseData", wintypes.DWORD),
                ("dwFlags", wintypes.DWORD), ("time", wintypes.DWORD), ("dwExtraInfo", ULONG_PTR)]


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", wintypes.WORD), ("wScan", wintypes.WORD), ("dwFlags", wintypes.DWORD),
                ("time", wintypes.DWORD), ("dwExtraInfo", ULONG_PTR)]


class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [("uMsg", wintypes.DWORD), ("wParamL", wintypes.WORD), ("wParamH", wintypes.WORD)]


class _INPUTUNION(ctypes.Union):
    _fields_ = [("mi", MOUSEINPUT), ("ki", KEYBDINPUT), ("hi", HARDWAREINPUT)]


class INPUT(ctypes.Structure):
    _fields_ = [("type", wintypes.DWORD), ("u", _INPUTUNION)]


def _send(*inputs: INPUT) -> None:
    arr = (INPUT * len(inputs))(*inputs)
    if user32.SendInput(len(inputs), arr, ctypes.sizeof(INPUT)) != len(inputs):
        raise ActionError("Windows blocked the key press (is a password/UAC prompt open?)")


def _key(vk: int, up: bool = False) -> INPUT:
    flags = KEYEVENTF_KEYUP if up else 0
    if vk in EXTENDED:
        flags |= KEYEVENTF_EXTENDEDKEY
    return INPUT(type=INPUT_KEYBOARD, u=_INPUTUNION(ki=KEYBDINPUT(wVk=vk, wScan=0, dwFlags=flags, time=0, dwExtraInfo=0)))


VK = {
    "backspace": 0x08, "tab": 0x09, "enter": 0x0D, "shift": 0x10, "ctrl": 0x11, "alt": 0x12,
    "pause": 0x13, "capslock": 0x14, "esc": 0x1B, "space": 0x20, "pageup": 0x21, "pagedown": 0x22,
    "end": 0x23, "home": 0x24, "left": 0x25, "up": 0x26, "right": 0x27, "down": 0x28,
    "printscreen": 0x2C, "insert": 0x2D, "delete": 0x2E, "win": 0x5B,
    "volumemute": 0xAD, "volumedown": 0xAE, "volumeup": 0xAF,
    "nexttrack": 0xB0, "prevtrack": 0xB1, "stop": 0xB2, "playpause": 0xB3,
    "browserback": 0xA6, "browserforward": 0xA7,
    **{f"f{i}": 0x6F + i for i in range(1, 13)},
    **{chr(c): c for c in range(ord("0"), ord("9") + 1)},
    **{chr(c).lower(): c for c in range(ord("A"), ord("Z") + 1)},
    ",": 0xBC, "comma": 0xBC, ".": 0xBE, "period": 0xBE, "dot": 0xBE, "-": 0xBD, "minus": 0xBD,
    "=": 0xBB, "plus": 0xBB, "/": 0xBF, "slash": 0xBF, ";": 0xBA, "'": 0xDE, "[": 0xDB, "]": 0xDD,
}
VK.update({"control": VK["ctrl"], "escape": VK["esc"], "return": VK["enter"], "del": VK["delete"],
           "windows": VK["win"], "command": VK["win"], "prtsc": VK["printscreen"]})
EXTENDED = {VK[k] for k in ("left", "up", "right", "down", "insert", "delete", "home", "end",
                            "pageup", "pagedown", "win", "volumemute", "volumedown", "volumeup",
                            "nexttrack", "prevtrack", "stop", "playpause")}


def tap(*names: str, times: int = 1) -> None:
    codes = []
    for n in names:
        if n.lower() not in VK:
            raise ActionError(f"Unknown key '{n}'")
        codes.append(VK[n.lower()])
    for _ in range(times):
        _send(*[_key(c) for c in codes], *[_key(c, up=True) for c in reversed(codes)])
        if times > 1:
            time.sleep(0.01)


def type_unicode(text: str) -> None:
    events = []
    for ch in text:
        for unit in _utf16_units(ch):
            for up in (False, True):
                flags = KEYEVENTF_UNICODE | (KEYEVENTF_KEYUP if up else 0)
                events.append(INPUT(type=INPUT_KEYBOARD,
                                    u=_INPUTUNION(ki=KEYBDINPUT(wVk=0, wScan=unit, dwFlags=flags, time=0, dwExtraInfo=0))))
    for i in range(0, len(events), 200):
        _send(*events[i:i + 200])


def _utf16_units(ch: str) -> list[int]:
    data = ch.encode("utf-16-le")
    return [int.from_bytes(data[i:i + 2], "little") for i in range(0, len(data), 2)]


# --------------------------------------------------------------------------
# Apps
# --------------------------------------------------------------------------

def _start_menu_shortcuts() -> dict[str, Path]:
    found: dict[str, Path] = {}
    roots = [Path(os.environ.get("ProgramData", r"C:\ProgramData")) / r"Microsoft\Windows\Start Menu\Programs",
             Path(os.environ.get("APPDATA", "")) / r"Microsoft\Windows\Start Menu\Programs",
             Path(os.environ.get("USERPROFILE", "")) / "Desktop",
             Path(os.environ.get("PUBLIC", r"C:\Users\Public")) / "Desktop"]
    for root in roots:
        if root.exists():
            for lnk in root.rglob("*.lnk"):
                found.setdefault(lnk.stem.lower(), lnk)
    return found


_store_apps_cache: tuple[float, dict[str, str]] = (0.0, {})


def _store_apps() -> dict[str, str]:
    """Microsoft Store / UWP apps (Netflix app, Spotify from Store, Settings...): name -> AppID."""
    global _store_apps_cache
    if time.time() - _store_apps_cache[0] < 600:
        return _store_apps_cache[1]
    try:
        out = powershell("Get-StartApps | ConvertTo-Json -Compress", timeout=20)
        items = json.loads(out) if out else []
        if isinstance(items, dict):
            items = [items]
        apps = {i["Name"].lower(): i["AppID"] for i in items if i.get("Name") and i.get("AppID")}
    except Exception:
        apps = {}
    _store_apps_cache = (time.time(), apps)
    return apps


def _best_match(name: str, options: list[str]) -> str | None:
    name = name.lower()
    if name in options:
        return name
    starts = [o for o in options if o.startswith(name)]
    if starts:
        return min(starts, key=len)
    contains = [o for o in options if name in o]
    if contains:
        return min(contains, key=len)
    close = difflib.get_close_matches(name, options, n=1, cutoff=0.75)
    return close[0] if close else None


class Actions:
    def __init__(self, config: dict):
        self.config = config
        self.apps: dict[str, str] = {k.lower(): v for k, v in config.get("apps", {}).items()}
        self.processes: dict[str, str] = {k.lower(): v for k, v in config.get("process_names", {}).items()}
        self.browsers: dict[str, str] = config.get("browsers", {})
        self.custom: dict[str, str] = config.get("custom_commands", {})
        self.shutdown_delay = int(config.get("shutdown_delay_seconds", 10))
        self.allow_power = bool(config.get("allow_power_actions", True))

    def run(self, action: str, args: dict) -> str:
        handler = getattr(self, "do_" + action, None)
        if not handler:
            raise ActionError(f"This agent doesn't support '{action}' yet")
        return handler(**args)

    # ---- apps & web --------------------------------------------------------
    def do_open_app(self, name: str) -> str:
        key = name.lower().strip()
        if key in {c.lower() for c in self.custom}:
            return self.do_run_custom(name)
        if key in self.apps:
            target = os.path.expandvars(self.apps[key])
            if Path(target).exists():
                os.startfile(target)
            else:
                _start(target)  # App Paths name (chrome, winword), URI (ms-settings:) or command
            return f"Opened {name}"

        shortcuts = _start_menu_shortcuts()
        match = _best_match(key, list(shortcuts))
        if match:
            os.startfile(str(shortcuts[match]))
            return f"Opened {shortcuts[match].stem}"

        store = _store_apps()
        match = _best_match(key, list(store))
        if match:
            subprocess.Popen(["explorer.exe", f"shell:AppsFolder\\{store[match]}"])
            return f"Opened {match.title()}"

        raise ActionError(f"Couldn't find an app called '{name}'. Add it under \"apps\" in config.json.")

    def do_close_app(self, name: str) -> str:
        key = name.lower().strip()
        exe = self.processes.get(key) or (key if key.endswith(".exe") else key.replace(" ", "") + ".exe")
        proc = subprocess.run(["taskkill", "/IM", exe, "/F"], capture_output=True, text=True,
                              creationflags=CREATE_NO_WINDOW)
        if proc.returncode != 0:
            # Fall back to a fuzzy match on window titles / process names.
            ps = ("Get-Process | Where-Object { $_.MainWindowTitle -like '*%s*' -or $_.ProcessName -like '*%s*' } "
                  "| ForEach-Object { $_.ProcessName; Stop-Process -Id $_.Id -Force }") % (key.replace("'", ""), key.replace(" ", "").replace("'", ""))
            out = powershell(ps)
            if not out:
                raise ActionError(f"{name} doesn't seem to be running")
            return f"Closed {', '.join(sorted(set(out.split())))}"
        return f"Closed {name}"

    def _open_in_browser(self, url: str, browser: str | None) -> None:
        if not browser:
            browser = self.config.get("default_browser")
        if browser:
            exe = self.browsers.get(browser, browser)
            _start(exe, url)
        else:
            webbrowser.open(url)

    def do_open_url(self, url: str, browser: str | None = None) -> str:
        self._open_in_browser(url, browser)
        return f"Opened {url.split('//')[-1].split('/')[0]}" + (f" in {browser.title()}" if browser else "")

    def do_web_search(self, query: str, site: str = "google", browser: str | None = None) -> str:
        q = quote_plus(query)
        urls = {
            "google": f"https://www.google.com/search?q={q}",
            "bing": f"https://www.bing.com/search?q={q}",
            "youtube": f"https://www.youtube.com/results?search_query={q}",
            "amazon": f"https://www.amazon.in/s?k={q}",
            "netflix": f"https://www.netflix.com/search?q={q}",
            "spotify": f"https://open.spotify.com/search/{quote_plus(query).replace('+', '%20')}",
            "wikipedia": f"https://en.wikipedia.org/w/index.php?search={q}",
        }
        self._open_in_browser(urls.get(site, urls["google"]), browser)
        return f"Searching {site.title()} for {query}"

    # ---- sound & media -----------------------------------------------------
    def do_volume_up(self, steps: int = 5) -> str:
        tap("volumeup", times=max(1, min(int(steps), 50)))
        return f"Volume up{self._volume_suffix()}"

    def do_volume_down(self, steps: int = 5) -> str:
        tap("volumedown", times=max(1, min(int(steps), 50)))
        return f"Volume down{self._volume_suffix()}"

    def do_volume_set(self, level: int) -> str:
        level = max(0, min(int(level), 100))
        endpoint = _pycaw_endpoint()
        if endpoint:
            endpoint.SetMute(0, None)
            endpoint.SetMasterVolumeLevelScalar(level / 100, None)
        else:
            tap("volumedown", times=50)  # 0%
            tap("volumeup", times=round(level / 2))
        return f"Volume set to {level}%"

    def _volume_suffix(self) -> str:
        endpoint = _pycaw_endpoint()
        if endpoint:
            return f" ({round(endpoint.GetMasterVolumeLevelScalar() * 100)}%)"
        return ""

    def do_mute(self) -> str:
        tap("volumemute")
        return "Toggled mute"

    def do_media_play_pause(self) -> str:
        tap("playpause")
        return "Play/pause"

    def do_media_next(self) -> str:
        tap("nexttrack")
        return "Next track"

    def do_media_previous(self) -> str:
        tap("prevtrack")
        return "Previous track"

    def do_media_stop(self) -> str:
        tap("stop")
        return "Stopped"

    # ---- display -----------------------------------------------------------
    def _brightness(self) -> int:
        out = powershell("(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness).CurrentBrightness")
        try:
            return int(out.splitlines()[0])
        except (ValueError, IndexError):
            raise ActionError("This screen doesn't support brightness control (external monitors usually don't)")

    def do_brightness_set(self, level: int) -> str:
        level = max(0, min(int(level), 100))
        try:
            powershell(f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {level}) | Out-Null")
        except ActionError:
            raise ActionError("This screen doesn't support brightness control (external monitors usually don't)")
        return f"Brightness {level}%"

    def do_brightness_up(self) -> str:
        return self.do_brightness_set(min(100, self._brightness() + 15))

    def do_brightness_down(self) -> str:
        return self.do_brightness_set(max(0, self._brightness() - 15))

    def do_screenshot(self) -> str:
        tap("win", "printscreen")
        return "Screenshot saved to Pictures\\Screenshots"

    # ---- power -------------------------------------------------------------
    def _power_check(self) -> None:
        if not self.allow_power:
            raise ActionError("Power actions are disabled in config.json")

    def do_sleep(self) -> str:
        self._power_check()
        # SetSuspendState(hibernate=False, force=False, disableWakeEvents=False)
        later(1.5, lambda: ctypes.windll.powrprof.SetSuspendState(False, False, False))
        return "Going to sleep"

    def do_hibernate(self) -> str:
        self._power_check()
        later(1.5, lambda: subprocess.run(["shutdown", "/h"], creationflags=CREATE_NO_WINDOW))
        return "Hibernating"

    def do_shutdown(self, delay: int | None = None) -> str:
        self._power_check()
        delay = self.shutdown_delay if delay is None else int(delay)
        subprocess.run(["shutdown", "/s", "/t", str(delay), "/c", "Shutdown requested from your phone"],
                       creationflags=CREATE_NO_WINDOW)
        return f"Shutting down in {delay}s (say \"cancel shutdown\" to stop)"

    def do_restart(self, delay: int | None = None) -> str:
        self._power_check()
        delay = self.shutdown_delay if delay is None else int(delay)
        subprocess.run(["shutdown", "/r", "/t", str(delay), "/c", "Restart requested from your phone"],
                       creationflags=CREATE_NO_WINDOW)
        return f"Restarting in {delay}s (say \"cancel shutdown\" to stop)"

    def do_cancel_shutdown(self) -> str:
        proc = subprocess.run(["shutdown", "/a"], capture_output=True, creationflags=CREATE_NO_WINDOW)
        return "Shutdown cancelled" if proc.returncode == 0 else "Nothing to cancel"

    def do_lock(self) -> str:
        later(0.5, ctypes.windll.user32.LockWorkStation)
        return "Locked"

    def do_sign_out(self) -> str:
        self._power_check()
        later(1.5, lambda: subprocess.run(["shutdown", "/l"], creationflags=CREATE_NO_WINDOW))
        return "Signing out"

    # ---- radios & bluetooth ------------------------------------------------
    def do_radio(self, kind: str, state: str) -> str:
        kind_arg = {"bluetooth": "Bluetooth", "wifi": "WiFi"}.get(kind.lower())
        state_arg = "On" if state.lower() == "on" else "Off"
        if not kind_arg:
            raise ActionError(f"Unknown radio '{kind}'")
        out = powershell(file=SCRIPTS / "radio.ps1", args=["-Kind", kind_arg, "-State", state_arg])
        label = "Bluetooth" if kind_arg == "Bluetooth" else "Wi-Fi"
        if "Allowed" not in out and out:
            raise ActionError(f"Windows refused to change {label}: {out}")
        return f"{label} {state_arg.lower()}"

    def do_bt_list(self) -> str:
        out = powershell(file=SCRIPTS / "bluetooth_device.ps1", args=["-Action", "List"])
        return "Paired: " + (", ".join(out.splitlines()) if out else "none")

    def do_bt_disconnect(self, device: str) -> str:
        out = powershell(file=SCRIPTS / "bluetooth_device.ps1", args=["-Action", "Disconnect", "-Name", device], timeout=45)
        return out or f"Disconnected {device}"

    def do_bt_connect(self, device: str) -> str:
        out = powershell(file=SCRIPTS / "bluetooth_device.ps1", args=["-Action", "Connect", "-Name", device], timeout=45)
        return out or f"Connecting {device}"

    # ---- keyboard & mouse --------------------------------------------------
    def do_type_text(self, text: str) -> str:
        type_unicode(text)
        return f"Typed \"{text[:40]}\""

    def do_press_keys(self, keys: str) -> str:
        names = [k for k in keys.replace(" ", "+").split("+") if k]
        tap(*names)
        return f"Pressed {'+'.join(names)}"

    def do_scroll(self, direction: str = "down", amount: int | None = None) -> str:
        notches = int(amount or 5) * (120 if direction == "up" else -120)
        _send(INPUT(type=INPUT_MOUSE, u=_INPUTUNION(mi=MOUSEINPUT(dx=0, dy=0, mouseData=ctypes.c_ulong(notches & 0xFFFFFFFF).value,
                                                                   dwFlags=MOUSEEVENTF_WHEEL, time=0, dwExtraInfo=0))))
        return f"Scrolled {direction}"

    # ---- your own commands -------------------------------------------------
    def do_run_custom(self, name: str) -> str:
        match = next((k for k in self.custom if k.lower() == name.lower()), None)
        if not match:
            raise ActionError(f"No custom command called '{name}'")
        subprocess.Popen(self.custom[match], shell=True, creationflags=CREATE_NO_WINDOW)
        return f"Ran {match}"


def _pycaw_endpoint():
    try:
        import comtypes
        comtypes.CoInitialize()  # actions run on a worker thread
        from pycaw.pycaw import AudioUtilities
        speakers = AudioUtilities.GetSpeakers()
        return getattr(speakers, "EndpointVolume", None) or _legacy_pycaw(speakers)
    except Exception:
        return None


def _legacy_pycaw(speakers):
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import IAudioEndpointVolume
    iface = speakers.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    return ctypes.cast(iface, ctypes.POINTER(IAudioEndpointVolume))
