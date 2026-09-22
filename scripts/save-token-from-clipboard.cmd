@echo off
setlocal

REM Copy the GitVerse token first, then double-click this file. It does not
REM print the token or replace the clipboard contents.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0save-token.ps1" -FromClipboard
if errorlevel 1 (
  echo.
  echo Token was not saved. Keep the GitVerse token copied and try again.
) else (
  echo.
  echo Token saved. Fully restart Codex before using GitVerse.
)
pause
