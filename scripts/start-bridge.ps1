param([string]$PluginPath = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($env:GITVERSE_BRIDGE_SESSION_SECRET) -or $env:GITVERSE_BRIDGE_SESSION_SECRET.Length -lt 32) {
  throw 'Set GITVERSE_BRIDGE_SESSION_SECRET to a random value with at least 32 characters before starting the bridge.'
}
& node (Join-Path $PluginPath 'server\bridge.js')
