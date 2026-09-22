import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function defaultStorePath(env) {
  const appData = env.APPDATA || env.LOCALAPPDATA;
  return appData ? path.join(appData, 'CodexGitVerseConnector', 'token.dat') : undefined;
}

function loadWindowsCredential(env) {
  const scriptPath = fileURLToPath(new URL('../../scripts/windows-credential.ps1', import.meta.url));
  const result = spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Action', 'Get'], { encoding: 'utf8', env, windowsHide: true, timeout: 5_000 });
  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
}

export function loadToken(env = process.env) {
  if (env.GITVERSE_TOKEN) return env.GITVERSE_TOKEN;
  if (process.platform !== 'win32') return undefined;
  const credentialToken = loadWindowsCredential(env);
  if (credentialToken) return credentialToken;
  const tokenPath = env.GITVERSE_TOKEN_STORE || defaultStorePath(env);
  if (!tokenPath || !existsSync(tokenPath)) return undefined;
  // Static PowerShell only decrypts the current user's DPAPI-protected blob.
  const script = "$p=$env:GITVERSE_TOKEN_STORE; if(-not $p){$p=Join-Path $env:APPDATA 'CodexGitVerseConnector\\token.dat'}; $s=Get-Content -Raw -LiteralPath $p | ConvertTo-SecureString; [System.Net.NetworkCredential]::new('', $s).Password";
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { encoding: 'utf8', env: { ...env, GITVERSE_TOKEN_STORE: tokenPath }, windowsHide: true, timeout: 5_000 });
  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
}
