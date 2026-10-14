# PC Voice Remote

Speak to your iPhone, and your Windows PC does it.

> "open netflix in chrome" · "volume up" · "set volume to 40" · "sleep" · "shutdown" ·
> "switch on bluetooth" · "disconnect speaker named the genius" · "play lofi on youtube" ·
> "type hello world" · "open chrome and then open netflix and volume up"

```
 iPhone                         Mediator                          Windows PC
┌──────────────────┐  HTTPS/HTTP ┌─────────────────────────┐ WebSocket ┌────────────────────┐
│ Web app (Safari) │──POST text─▶│ understands the command │──actions─▶│ agent.py           │
│ Siri Shortcut    │             │  • rule parser          │           │  • volume, media   │
│ Native iOS app   │◀──reply─────│  • Claude fallback (opt)│◀─results──│  • apps, websites  │
└──────────────────┘             │  • token auth           │           │  • power, Bluetooth│
                                 └─────────────────────────┘           └────────────────────┘
```

* **`mediator/`**: a small Python server between the phone and the PC. It turns your sentence
  into structured actions (e.g. `{"action": "open_url", "args": {"url": "https://www.netflix.com", "browser": "chrome"}}`),
  sends them to the PC and returns the result. It also serves the phone web app.
* **`windows-agent/`**: runs on the PC and carries out the actions. It connects *out* to the
  mediator, so the PC needs no open ports and works whether the mediator is on the PC, on
  your LAN or in the cloud.
* **Phone**: three ways to use it, from the quickest to set up to the most polished:
  1. **Web app**: open a link in Safari and add it to your Home Screen. Works in 2 minutes.
  2. **Siri Shortcut**: "Hey Siri, PC" and then say your command. Hands-free, no install.
  3. **Native app** (`ios-app/`): SwiftUI app with live transcription and Siri. Needs a Mac with Xcode.

The PC only ever gets actions from a fixed list. Raw text and shell commands never reach it,
so a misheard sentence can't do anything outside that list.

---

## 1. Set up the PC (10 minutes)

You need **Python 3.10+** on Windows (`winget install Python.Python.3.12`, or from python.org with
"Add to PATH" ticked).

Copy this `pc-voice-remote` folder to the PC, e.g. `C:\pc-voice-remote`.

### Start the mediator

Double-click **`mediator\run_mediator.bat`**. The first run installs what it needs and then prints:

```
  PC Voice Remote mediator
  Access token : Xy3...          <- keep this secret
  Phone URL    : http://192.168.1.20:8765/?token=Xy3...
  Agent URL    : ws://127.0.0.1:8765/ws/agent  (same token)
```

When Windows Firewall asks, allow access on **Private networks**.

### Start the agent

1. Copy `windows-agent\config.example.json` to `windows-agent\config.json` and paste the
   token into `"token"`.
2. Right-click **`windows-agent\run_agent.bat`** and choose **Run as administrator**.
   Administrator rights are only needed to connect or disconnect individual Bluetooth
   devices. Everything else works without them.
3. The mediator window should now show `Agent '<your-pc>' connected`.

**Start everything automatically at sign-in** (recommended). In an *Administrator* PowerShell, run:

```powershell
cd C:\pc-voice-remote\windows-agent
powershell -ExecutionPolicy Bypass -File install_autostart.ps1 -WithMediator
```

This runs both in the background (no windows) every time you sign in. Logs go to `windows-agent\agent.log`.

---

## 2. Set up the iPhone

The phone and PC must be on the same Wi-Fi network. To use it from anywhere, see [Use it away from home](#use-it-away-from-home).

### Option A: Web app (fastest)

1. On the iPhone, open the **Phone URL** from the mediator window in Safari. You can also
   type it in, or run `pip install qrcode` once so the mediator prints a QR code you can scan
   with the Camera app.
2. Tap **Share → Add to Home Screen**. You now have a "PC Remote" app icon.
3. Tap the big mic, then tap the 🎤 on the keyboard and speak. Or use the quick-action buttons.

> Live, hands-free speech in the web page needs HTTPS (an iOS rule). Over plain
> `http://` on your LAN the page uses the keyboard's dictation mic instead, which works just as
> well. With the HTTPS setup below, the big button listens directly.

### Option B: Siri Shortcut ("Hey Siri, PC")

In the **Shortcuts** app, tap **+** and add these actions in order:

| # | Action | Settings |
|---|--------|----------|
| 1 | **Dictate Text** | Stop Listening: *After Pause* |
| 2 | **Get Contents of URL** | URL: `http://192.168.1.20:8765/api/command` (your Phone URL without `/?token=…`)<br>Method: **POST**<br>Headers: `Authorization` = `Bearer YOUR_TOKEN`<br>Request Body: **JSON**, add field `text` (Text) = *Dictated Text* |
| 3 | **Get Dictionary Value** | Get *Value* for `message` in *Contents of URL* |
| 4 | **Speak Text** (or Show Result) | *Dictionary Value* |

Name it **"PC"**. Then say *"Hey Siri, PC"*, wait for the beep and say *"open netflix in chrome"*.
You can also put it on the Lock Screen, the Action Button (iPhone 15 Pro and later) or Back Tap
(Settings › Accessibility › Touch › Back Tap).

For one-tap buttons, duplicate the shortcut, delete step 1 and type a fixed `text` such as `volume up`.

### Option C: Native iOS app

`ios-app/` has a SwiftUI app with live speech recognition that sends as soon as you stop
talking, quick actions, spoken replies and a Siri intent (*"Hey Siri, Command my PC with PC
Remote"*).

On a Mac with Xcode 15 or later:

```bash
brew install xcodegen
cd ios-app
xcodegen                     # creates PCVoiceRemote.xcodeproj
open PCVoiceRemote.xcodeproj
```

In Xcode, select the **PCVoiceRemote** target › *Signing & Capabilities*, choose your Apple ID
team and change the bundle id to something unique. Then plug in your iPhone and press **Run**.
On first launch, enter the mediator address (e.g. `http://192.168.1.20:8765`) and the token.

With a free Apple ID the app has to be reinstalled from Xcode every 7 days. A paid developer
account ($99/year) removes that limit and lets you use TestFlight.

---

## What you can say

| Area | Examples |
|------|----------|
| Apps | open chrome · launch spotify · open file explorer · open settings · close chrome |
| Websites | open netflix in chrome · open youtube · go to amazon.in · open hotstar in edge |
| Search | play arijit singh on youtube · search for weather in chennai · search amazon for earbuds |
| Volume | volume up · volume down · increase the volume by 20 · set volume to 40 · mute · max volume |
| Media | play · pause · next song · previous track · full screen |
| Power | sleep · hibernate · shutdown · shut down in 30 minutes · restart · **cancel shutdown** · lock the pc · sign out |
| Bluetooth / Wi-Fi | switch on bluetooth · turn off bluetooth · turn wifi off · list bluetooth devices |
| Bluetooth devices | disconnect speaker named the genius · connect the genius · disconnect my jbl headphones |
| Display | brightness 70 · brightness up · take a screenshot · show desktop · switch window |
| Keyboard | type hello world · press enter · press ctrl c · press alt tab · scroll down · new tab · close tab |
| Chains | open chrome and then open netflix · pause and turn off bluetooth |
| Your own | anything in `macros` (mediator) or `custom_commands` (agent), see below |

Shutdown and restart wait 10 seconds by default (`shutdown_delay_seconds`), so you can say *"cancel shutdown"*.

### Add your own commands

**Macros** (`mediator\config.json`) chain several built-in commands under one phrase:

```json
"macros": {
  "movie mode": ["open netflix in chrome", "set volume to 60", "brightness 80"],
  "good night": ["pause", "set volume to 10", "turn off bluetooth", "sleep"]
}
```

**Custom commands** (`windows-agent\config.json`) run anything on the PC: a script, a program, a
PowerShell one-liner. You write them yourself, and the phone can only trigger them by name:

```json
"custom_commands": {
  "start backup": "C:\\scripts\\backup.bat",
  "open downloads": "explorer %USERPROFILE%\\Downloads"
}
```

**Apps.** "open X" first checks `apps` in the agent config, then your Start Menu and desktop
shortcuts, then Microsoft Store apps. Most installed apps work with no setup. Add an entry when
a spoken name doesn't match the app's real name.

### Understand anything (optional Claude fallback)

The built-in rules cover the commands above. To also handle free-form requests such as *"it's too
loud, and put the netflix thing on"*, give the mediator an Anthropic API key:

```bat
pip install anthropic
set ANTHROPIC_API_KEY=sk-ant-...
run_mediator.bat
```

Only phrases the rules don't understand go to Claude. Claude must answer with actions from the
same fixed list, and the mediator checks them again before sending. It uses
`claude-opus-5-5` at low effort, with refusal fallback (`fallbacks: "default"`) turned on. Set
`PCREMOTE_MODEL` to use a different model, or `"llm_fallback": false` in `config.json` to turn
it off.

---

## Use it away from home

The agent only needs to reach the mediator, so the mediator can live anywhere:

* **Tailscale** (easiest, private): install Tailscale on the PC and iPhone, then use the PC's
  Tailscale address in place of the LAN IP. `tailscale serve --bg 8765` also gives you HTTPS, so
  the web app's mic button listens directly.
* **Cloudflare Tunnel** (HTTPS URL, no router changes):
  `cloudflared tunnel --url http://localhost:8765` prints an `https://….trycloudflare.com` address
  to use on the phone.
* **Cloud mediator**: deploy `mediator/` (there's a `Dockerfile`) to Render, Fly.io or a VPS
  with `PCREMOTE_TOKEN` set as a secret. On the PC, set
  `"mediator_url": "wss://your-app.example.com/ws/agent"` in the agent config.

Don't expose the plain-HTTP port directly to the internet. Use one of the options above so the
token travels over HTTPS.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Phone says "PC offline" | The agent isn't connected. Check that `agent.log` and the token match the mediator's. |
| Phone can't reach the mediator | Same Wi-Fi? Allow Python through Windows Firewall on *Private* networks. Use the IP the mediator prints. |
| Bluetooth device commands fail | The agent must run as Administrator (`run_agent.bat` › Run as administrator, or `install_autostart.ps1`). Say "list bluetooth devices" to hear the exact names. |
| "Bluetooth on/off" does nothing | The PC needs a built-in or USB Bluetooth adapter. Check that the Bluetooth tile in Action Center works. |
| Sleep hibernates instead | Turn hibernation off with `powercfg /h off` (Administrator). |
| Brightness fails | Windows can only change brightness on laptop screens, not on most external monitors. |
| "Set volume to 40" overshoots | Install the optional extras on the PC with `pip install pycaw comtypes` for exact volume. |
| Keys/typing don't work in some apps | Windows blocks simulated input into apps running as Administrator unless the agent is also elevated. |

## Development

```bash
cd mediator
pip install -r requirements.txt pytest pytest-asyncio
pytest                       # parser, mediator round-trip and Claude-fallback tests
python mediator.py --port 8765
```

The HTTP API is `POST /api/command` with body `{"text": "..."}` and header
`Authorization: Bearer <token>`. It replies with `{ok, message, understood, actions, results}`.
`GET /api/status` lists connected PCs.
