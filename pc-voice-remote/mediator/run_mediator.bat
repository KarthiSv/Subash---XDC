@echo off
REM Starts the mediator on this Windows PC (port 8765).
cd /d "%~dp0"
if not exist .venv (
  py -3 -m venv .venv || python -m venv .venv
  .venv\Scripts\python -m pip install -r requirements.txt
)
if not exist config.json copy config.example.json config.json >nul
.venv\Scripts\python mediator.py
pause
