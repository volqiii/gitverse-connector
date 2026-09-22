param([switch]$FromClipboard)

$ErrorActionPreference = 'Stop'

if ($FromClipboard) {
  $clipboardToken = Get-Clipboard -Raw
  if ([string]::IsNullOrWhiteSpace($clipboardToken)) { throw 'The clipboard is empty.' }
  $clipboardToken = $clipboardToken.Trim()
  if ($clipboardToken.Length -lt 20 -or $clipboardToken -match '\s' -or $clipboardToken -match 'save-token|FromClipboard|powershell') {
    throw 'The clipboard does not contain a GitVerse API token. Copy the token in GitVerse, then double-click the desktop launcher without copying any command afterwards.'
  }
  $token = ConvertTo-SecureString $clipboardToken -AsPlainText -Force
  Remove-Variable clipboardToken -ErrorAction SilentlyContinue
} else {
  $token = Read-Host 'GitVerse API token' -AsSecureString
}
if ($token.Length -lt 1) { throw 'Token was not entered.' }
& (Join-Path $PSScriptRoot 'windows-credential.ps1') -Action Set -Token $token
Write-Host 'Saved the token in Windows Credential Manager. Fully restart Codex to apply it.' -ForegroundColor Green
