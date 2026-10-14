@echo off
REM Starts the PC Voice Remote agent. Right-click > "Run as administrator"
REM if you want Bluetooth device connect/disconnect to work.
cd /d "%~dp0"
if not exist .venv (
  py -3 -m venv .venv || python -m venv .venv
  .venv\Scripts\python -m pip install -r requirements.txt
)
.venv\Scripts\python agent.py
pause
