param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('Set', 'Get')]
  [string]$Action,
  [SecureString]$Token
)

$ErrorActionPreference = 'Stop'
$targetName = 'CodexGitVerseConnector/GitVerseToken'

Add-Type @'
using System;
using System.Runtime.InteropServices;

namespace CodexGitVerseConnector {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct Credential {
    public UInt32 Flags;
    public UInt32 Type;
    public string TargetName;
    public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public UInt32 CredentialBlobSize;
    public IntPtr CredentialBlob;
    public UInt32 Persist;
    public UInt32 AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
  }

  public static class NativeCredentialManager {
    [DllImport("Advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredWrite(ref Credential credential, UInt32 flags);

    [DllImport("Advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, UInt32 type, UInt32 flags, out IntPtr credentialPtr);

    [DllImport("Advapi32.dll", SetLastError = true)]
    public static extern void CredFree(IntPtr buffer);
  }
}
'@

if ($Action -eq 'Set') {
  if ($null -eq $Token -or $Token.Length -lt 1) { throw 'Token was not entered.' }
  $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
  $blobPointer = [IntPtr]::Zero
  try {
    $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
    $bytes = [Text.Encoding]::UTF8.GetBytes($plainToken)
    $blobPointer = [Runtime.InteropServices.Marshal]::AllocCoTaskMem($bytes.Length)
    [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $blobPointer, $bytes.Length)
    $credential = [CodexGitVerseConnector.Credential]@{
      Type = 1 # CRED_TYPE_GENERIC
      TargetName = $targetName
      CredentialBlobSize = [uint32]$bytes.Length
      CredentialBlob = $blobPointer
      Persist = 2 # CRED_PERSIST_LOCAL_MACHINE, encrypted by Windows Credential Manager
      UserName = 'GitVerse'
    }
    if (-not [CodexGitVerseConnector.NativeCredentialManager]::CredWrite([ref]$credential, 0)) {
      throw "Windows Credential Manager rejected the token (error $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
    }
  } finally {
    if ($blobPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::FreeCoTaskMem($blobPointer) }
    if ($tokenPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer) }
    Remove-Variable plainToken, bytes -ErrorAction SilentlyContinue
  }
  exit 0
}

$credentialPointer = [IntPtr]::Zero
if (-not [CodexGitVerseConnector.NativeCredentialManager]::CredRead($targetName, 1, 0, [ref]$credentialPointer)) {
  exit 3
}
try {
  $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($credentialPointer, [type][CodexGitVerseConnector.Credential])
  if ($credential.CredentialBlobSize -lt 1) { exit 3 }
  $bytes = New-Object byte[] $credential.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)
  [Console]::Out.Write([Text.Encoding]::UTF8.GetString($bytes))
} finally {
  [CodexGitVerseConnector.NativeCredentialManager]::CredFree($credentialPointer)
}
