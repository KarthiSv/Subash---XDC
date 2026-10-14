# List, connect or disconnect a paired Bluetooth device by (part of) its name.
#   powershell -File bluetooth_device.ps1 -Action List
#   powershell -File bluetooth_device.ps1 -Action Disconnect -Name "the genius"
#
# Disconnect disables the device's Bluetooth service nodes, which drops the link
# (the same as unticking "Audio Sink"/"Handsfree" in the device's Services tab).
# Connect re-enables them, after which Windows reconnects when the device is on.
# Both need the agent to run as Administrator.
param(
    [ValidateSet('List', 'Connect', 'Disconnect')][string]$Action = 'List',
    [string]$Name = ''
)
$ErrorActionPreference = 'Stop'

function Fail($msg) { [Console]::Error.WriteLine($msg); exit 1 }

$all = Get-PnpDevice -ErrorAction SilentlyContinue |
    Where-Object { $_.InstanceId -match '^(BTHENUM|BTHLE|BTHLEDEVICE)\\' -and $_.FriendlyName }

# Top-level nodes are the paired devices themselves.
$paired = $all | Where-Object { $_.InstanceId -match '^(BTHENUM|BTHLE)\\DEV_' }

if ($Action -eq 'List') {
    $paired | ForEach-Object {
        $state = if ($_.Status -eq 'OK') { 'connected/enabled' } else { $_.Status.ToLower() }
        "$($_.FriendlyName) [$state]"
    } | Sort-Object -Unique
    exit 0
}

if (-not $Name) { Fail 'Say which device, e.g. "disconnect speaker named the genius"' }

function Find-Device([string]$query) {
    $q = $query.Trim()
    $hit = $paired | Where-Object { $_.FriendlyName -like "*$q*" }
    if (-not $hit -and $q -match '^(the|my|a)\s+(.+)$') {
        $q = $Matches[2]; $hit = $paired | Where-Object { $_.FriendlyName -like "*$q*" }
    }
    if (-not $hit) {
        # Speech-to-text may drop spaces or add them ("jbl flip" vs "JBLFlip").
        $squash = ($q -replace '\s', '')
        $hit = $paired | Where-Object { ($_.FriendlyName -replace '\s', '') -like "*$squash*" }
    }
    return $hit
}

$devices = @(Find-Device $Name)
if ($devices.Count -eq 0) {
    $names = ($paired | Select-Object -ExpandProperty FriendlyName -Unique) -join ', '
    Fail "No paired Bluetooth device matches '$Name'. Paired: $names"
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Fail 'Connecting/disconnecting devices needs the agent to run as Administrator (see README)' }

$deviceNames = $devices | Select-Object -ExpandProperty FriendlyName -Unique
# Every node (device + its services) whose instance id carries the same MAC address.
$macs = $devices | ForEach-Object { if ($_.InstanceId -match 'DEV_([0-9A-F]{12})') { $Matches[1] } }
$nodes = $all | Where-Object {
    $id = $_.InstanceId
    ($macs | Where-Object { $id -match $_ }) -and $id -notmatch '^(BTHENUM|BTHLE)\\DEV_'
}
if (-not $nodes) { $nodes = $devices }

if ($Action -eq 'Disconnect') {
    $nodes | Disable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue
    Write-Output "Disconnected $($deviceNames -join ', ')"
} else {
    $nodes | Enable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue
    $devices | Enable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue
    Write-Output "Enabled $($deviceNames -join ', ') - it will reconnect when it's switched on"
}
