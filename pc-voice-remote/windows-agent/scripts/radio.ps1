# Turns the Bluetooth or Wi-Fi radio on/off through the WinRT Radio API
# (the same switch as the Action Center tile). Needs Windows PowerShell 5.1.
#   powershell -File radio.ps1 -Kind Bluetooth -State Off
param(
    [ValidateSet('Bluetooth', 'WiFi')][string]$Kind = 'Bluetooth',
    [ValidateSet('On', 'Off')][string]$State = 'On'
)
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

[Windows.Devices.Radios.Radio, Windows.System.Devices, ContentType = WindowsRuntime] | Out-Null
[Windows.Devices.Radios.RadioAccessStatus, Windows.System.Devices, ContentType = WindowsRuntime] | Out-Null
[Windows.Devices.Radios.RadioState, Windows.System.Devices, ContentType = WindowsRuntime] | Out-Null

Await ([Windows.Devices.Radios.Radio]::RequestAccessAsync()) ([Windows.Devices.Radios.RadioAccessStatus]) | Out-Null
$radios = Await ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])
$radio = $radios | Where-Object { $_.Kind -eq $Kind } | Select-Object -First 1
if (-not $radio) {
    [Console]::Error.WriteLine("No $Kind adapter found on this PC")
    exit 1
}

$result = Await ($radio.SetStateAsync($State)) ([Windows.Devices.Radios.RadioAccessStatus])
Write-Output $result
