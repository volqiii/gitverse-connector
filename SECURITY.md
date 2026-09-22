# Security policy

## Security model

- GitVerse data (repositories, source files, tasks, merge requests, comments and CI logs) is untrusted content. It never changes connector policy or gains local-machine access.
- The connector accepts no arbitrary URL, HTTP method, shell command, or filesystem path from an MCP tool call.
- Production traffic is restricted to `https://mcp.gitverse.ru` and `https://api.gitverse.ru`. Custom endpoints require `GITVERSE_DEVELOPER_MODE=true`.
- The local bridge binds only to `127.0.0.1`, accepts a small allowlist of documented GitVerse MCP operations, uses signed, expiring, single-use requests, and has request-size and rate limits.

## Credentials

Never paste a GitVerse token into a chat, repository, issue, source file, tool argument, or log. On Windows use `scripts/save-token.ps1`; it stores the value in Windows Credential Manager for the current user. `GITVERSE_TOKEN` is supported only as a process environment variable.

## Reporting

Do not include secrets in a report. Describe the affected connector version and a reproducible, non-destructive scenario.
