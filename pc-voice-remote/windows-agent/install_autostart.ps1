# Registers the agent to start hidden, as Administrator, every time you sign in.
# Run once from an elevated PowerShell:  powershell -ExecutionPolicy Bypass -File install_autostart.ps1
# Add -WithMediator to also start the mediator on this PC at sign-in.
# Remove with:  Unregister-ScheduledTask -TaskName "PC Voice Remote*" -Confirm:$false
param([switch]$WithMediator)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$here\.venv")) {
    py -3 -m venv "$here\.venv"
    & "$here\.venv\Scripts\python.exe" -m pip install -r "$here\requirements.txt"
}
if (-not (Test-Path "$here\config.json")) {
    Copy-Item "$here\config.example.json" "$here\config.json"
    Write-Warning "Created config.json - paste the mediator token into it before signing in again."
}

$pythonw = "$here\.venv\Scripts\pythonw.exe"
$action = New-ScheduledTaskAction -Execute $pythonw -Argument "`"$here\agent.py`"" -WorkingDirectory $here
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "PC Voice Remote Agent" -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings -Force | Out-Null

if ($WithMediator) {
    $med = Join-Path (Split-Path -Parent $here) 'mediator'
    if (-not (Test-Path "$med\.venv")) {
        py -3 -m venv "$med\.venv"
        & "$med\.venv\Scripts\python.exe" -m pip install -r "$med\requirements.txt"
    }
    $medAction = New-ScheduledTaskAction -Execute "$med\.venv\Scripts\pythonw.exe" -Argument "`"$med\mediator.py`"" -WorkingDirectory $med
    $medPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName "PC Voice Remote Mediator" -Action $medAction -Trigger $trigger `
        -Principal $medPrincipal -Settings $settings -Force | Out-Null
    Start-ScheduledTask -TaskName "PC Voice Remote Mediator"
    Write-Host "Mediator installed and started."
}

Start-ScheduledTask -TaskName "PC Voice Remote Agent"
Write-Host "Agent installed and started. Logs: $here\agent.log"
