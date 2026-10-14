import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from parser import parse  # noqa: E402


def one(text, **kw):
    result = parse(text, **kw)
    assert result is not None, f"not understood: {text!r}"
    assert len(result) == 1, result
    return result[0]["action"], result[0]["args"]


@pytest.mark.parametrize("text,action,args", [
    ("Open Chrome", "open_app", {"name": "chrome"}),
    ("open netflix in chrome", "open_url", {"url": "https://www.netflix.com", "browser": "chrome"}),
    ("Hey computer, please open Netflix on Google Chrome.", "open_url", {"url": "https://www.netflix.com", "browser": "chrome"}),
    ("open youtube", "open_url", {"url": "https://www.youtube.com"}),
    ("go to netflix dot com", "open_url", {"url": "https://netflix.com"}),
    ("open spotify", "open_app", {"name": "spotify"}),
    ("launch the file explorer", "open_app", {"name": "file explorer"}),
    ("close chrome", "close_app", {"name": "chrome"}),
    ("volume up", "volume_up", {"steps": 5}),
    ("Volume down.", "volume_down", {"steps": 5}),
    ("increase the volume by 20", "volume_up", {"steps": 10}),
    ("set volume to fifty", "volume_set", {"level": 50}),
    ("set the volume to 35%", "volume_set", {"level": 35}),
    ("mute", "mute", {}),
    ("sleep", "sleep", {}),
    ("put the computer to sleep", "sleep", {}),
    ("shutdown", "shutdown", {}),
    ("shut down the pc in 5 minutes", "shutdown", {"delay": 300}),
    ("turn off the computer", "shutdown", {}),
    ("restart", "restart", {}),
    ("cancel shutdown", "cancel_shutdown", {}),
    ("lock the pc", "lock", {}),
    ("switch on bluetooth", "radio", {"kind": "bluetooth", "state": "on"}),
    ("Turn Bluetooth off", "radio", {"kind": "bluetooth", "state": "off"}),
    ("turn off wifi", "radio", {"kind": "wifi", "state": "off"}),
    ("disconnect speaker named “the genius”", "bt_disconnect", {"device": "the genius"}),
    ("disconnect the genius speaker", "bt_disconnect", {"device": "genius"}),
    ("connect to my speaker called the genius", "bt_connect", {"device": "the genius"}),
    ("pause", "media_play_pause", {}),
    ("next song", "media_next", {}),
    ("play arijit singh songs on youtube", "web_search", {"query": "arijit singh songs", "site": "youtube"}),
    ("search for weather in chennai", "web_search", {"query": "weather in chennai", "site": "google"}),
    ("type hello world", "type_text", {"text": "hello world"}),
    ("press control c", "press_keys", {"keys": "ctrl+c"}),
    ("press alt tab", "press_keys", {"keys": "alt+tab"}),
    ("full screen", "press_keys", {"keys": "f"}),
    ("brightness 70", "brightness_set", {"level": 70}),
    ("take a screenshot", "screenshot", {}),
])
def test_single_commands(text, action, args):
    assert one(text) == (action, args)


def test_chained_commands():
    actions = parse("open chrome and then open netflix and volume up")
    assert [a["action"] for a in actions] == ["open_app", "open_url", "volume_up"]


def test_and_inside_search_is_not_split():
    action, args = one("search youtube for tom and jerry")
    assert action == "web_search" and args["query"] == "tom and jerry"


def test_macros_expand():
    macros = {"movie mode": ["open netflix in chrome", "set volume to 60"]}
    actions = parse("Movie mode", macros=macros)
    assert [a["action"] for a in actions] == ["open_url", "volume_set"]


def test_custom_commands():
    assert one("start backup", custom=["Start Backup"]) == ("run_custom", {"name": "Start Backup"})


def test_gibberish_is_not_understood():
    assert parse("") is None
    assert parse("the quick brown") is None
