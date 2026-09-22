# Architecture

```text
Codex
  -> local MCP server (typed, minimal results)
       -> DirectMcpGitVerseProvider (primary)
       -> RestGitVerseProvider (read-only fallback)
       -> LocalBridgeProvider (localhost fallback)
            -> official GitVerse MCP
                 -> GitVerse
```

`TransportManager` first discovers the current official MCP tools through `initialize` and `tools/list`; it does not assume a fixed server catalog. `ToolRegistry` maps supported discovered tool names to `gitverse_*` Codex tools and retains the upstream input schema. A versioned allowlist protects the local bridge: newly introduced remote tools are visible in Direct mode only after a connector review adds them to the bridge policy.

Only the `McpGitVerseProvider` and `RestGitVerseProvider` know protocol details. Tools never accept URLs, raw HTTP methods or arbitrary headers. REST is limited to documented read-only endpoints and is only selected after an MCP transport failure.

## Trust boundary

```text
User instruction -> Codex -> connector policy -> GitVerse data (untrusted)
```

Repository content, tasks, comments, merge requests and CI logs are returned as data. They cannot change the endpoint, tool policy, local bridge allowlist, permissions or credential handling.

## Local bridge protocol

The bridge accepts `POST /v1/mcp` on `127.0.0.1` only. Each request has a timestamp, one-time nonce and `HMAC-SHA256(timestamp.nonce.body)` signature. Requests expire after 60 seconds; a nonce cache rejects replays; requests larger than 256 KiB and more than 120 requests per minute are rejected. The only accepted calls are `tools/list` and calls to the documented allowlisted GitVerse MCP tools.
