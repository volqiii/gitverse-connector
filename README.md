# GitVerse Connector for Codex

GitVerse Connector is a local MCP plugin that makes GitVerse feel native in Codex. It discovers the official GitVerse MCP tool catalog at runtime, presents concise typed tools to Codex, and uses the official Public API only as a read-only fallback when MCP is unavailable.

## What is implemented

- GitVerse MCP discovery and forwarding for supported repositories, files, branches, commits, releases, merge requests, tasks, CI/CD, users, teams and stars.
- A normalized `gitverse_connection_status` tool with safe diagnostics.
- REST read fallback for the current user, repositories, branches, repository contents, commits, tasks, merge requests, releases, workflows, runs, jobs and job logs.
- Direct, Bridge and automatic transport selection; pagination and limits remain part of the upstream GitVerse schemas.
- Confirmation gates for destructive or high-impact calls such as deleting a file, changing repository settings, publishing a release, updating a pull-request branch, or dispatching a workflow.

The connector intentionally does **not** create a generic `request(url, method, body)` tool.

## Install in Codex

This plugin is registered in the local personal marketplace. In a terminal run:

```powershell
codex plugin add gitverse-connector@personal
```

Start a **new Codex task** afterwards so the tool list is refreshed.

## Authentication

GitVerse MCP and the Public API use the same GitVerse API token. Create one in GitVerse token management, selecting only the entities and read/write access you need. The actual scope names are defined by GitVerse during token creation; this connector does not invent additional scopes.

### Windows: secure token storage

Run this locally. It prompts for the token without echoing it and stores it in the current Windows user's Credential Manager:

```powershell
Set-Location <path-to-gitverse-connector>
.\scripts\save-token.ps1
```

If Windows Terminal does not paste into the secure prompt, copy the token first and use the clipboard mode instead. The token is not displayed:

```powershell
Set-Location <path-to-gitverse-connector>
.\scripts\save-token.ps1 -FromClipboard
```

To avoid replacing the copied token with the command itself, double-click `scripts\\save-token-from-clipboard.cmd` after copying the token in GitVerse. The helper reads the clipboard only when you launch it.

Restart Codex after saving. The connector reads the encrypted value only in its local process and never returns it in an MCP result.

For a temporary development session only, set `GITVERSE_TOKEN` in the process environment; never place it in `.env` committed to Git.

## Transport modes

`GITVERSE_TRANSPORT=auto` is the default:

1. use `https://mcp.gitverse.ru`;
2. on a direct MCP network failure, use the GitVerse Public API for supported read-only operations;
3. if direct access is unavailable, use a local bridge when it is running and configured.

`direct` disables bridge fallback. `bridge` only uses the bridge. Authentication (`401`), permissions (`403`), rate limiting (`429`) and validation errors are never treated as a reason to ask for a new token or retry through another transport.

## Local Bridge

The bridge is for a local Codex/Desktop process that can reach `127.0.0.1`. It is not an Internet proxy and intentionally cannot expose a cloud-only Codex environment to a local machine without a separately deployed, authenticated relay.

Set a long random session secret in `GITVERSE_BRIDGE_SESSION_SECRET`, then run:

```powershell
& "$HOME\plugins\gitverse-connector\scripts\start-bridge.ps1"
```

The bridge listens only on `127.0.0.1:47831`, verifies a signed timestamp and nonce, rejects replays, limits requests, and permits only documented GitVerse MCP calls. The GitVerse token stays at the bridge; the connector sends only signed operation requests.

## Permissions and write safety

Use a read token for browsing repositories, code, history, tasks, merge requests and CI status. Use write access only when you intend to change those entities. The connector displays the owner/repository/branch parameters through the typed GitVerse tool schema and requires `confirm: true` for high-impact calls. It does not retry a create, merge, delete, release publish, or workflow dispatch when the outcome is unknown.

## Troubleshooting

- **GitVerse does not open / Russian IP restriction:** run `gitverse_connection_status`. A DNS, timeout or TLS failure is reported as a network or regional-access problem, not as an invalid token. In a local Desktop environment use Bridge mode.
- **401:** the token is absent, expired or invalid. Create a new token only after confirming this status.
- **403:** the token is valid but lacks access to this entity or repository.
- **429:** the connector respects `Retry-After` and backs off only safe read requests.
- **MCP unavailable:** supported reads use the official REST fallback automatically in `auto` mode.
- **Bridge unavailable:** start the bridge, verify the same session secret is present in the bridge and Codex process, and keep it bound to localhost.

## Development

```powershell
cd "$HOME\plugins\gitverse-connector"
npm test
node server/index.js
```

No dependency installation is required: the project uses Node.js built-ins. See [architecture](docs/architecture.md) and the [compatibility matrix](docs/compatibility-matrix.md).

