import { classifyHttpError, GitVerseNetworkError, GitVerseValidationError } from './errors.js';

export class McpGitVerseProvider {
  constructor({ endpoint, token, fetchImpl = fetch, timeoutMs = 12_000 }) { this.endpoint = endpoint; this.token = token; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; this.sessionId = undefined; this.requestId = 0; }
  async initialize() {
    if (this.sessionId) return;
    const response = await this.#post({ jsonrpc: '2.0', id: ++this.requestId, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'Codex GitVerse Connector', version: '0.1.0' } } });
    this.sessionId = response.headers.get('mcp-session-id') || response.headers.get('Mcp-Session-Id');
    await this.#post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
  }
  async listTools() { await this.initialize(); const response = await this.#rpc('tools/list', { cursor: null }); return response.tools ?? []; }
  async callTool(name, args) { await this.initialize(); return this.#rpc('tools/call', { name, arguments: args }); }
  async #rpc(method, params) { const response = await this.#post({ jsonrpc: '2.0', id: ++this.requestId, method, params }); const body = await response.json(); if (body.error) throw new GitVerseValidationError(body.error.message || 'GitVerse MCP rejected the request.'); return body.result ?? {}; }
  async #post(payload) {
    if (!this.token) throw new GitVerseValidationError('GitVerse token is not available. Save it locally before using GitVerse tools.');
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers = { Authorization: `Bearer ${this.token}`, Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' };
      if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
      const response = await this.fetch(this.endpoint, { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw classifyHttpError(response.status, response.headers.get('retry-after'));
      return response;
    } catch (error) {
      if (error?.code?.startsWith('GITVERSE_')) throw error;
      throw new GitVerseNetworkError(error?.name === 'AbortError' ? 'Timed out while contacting GitVerse MCP.' : 'Cannot reach GitVerse MCP from this network.', { cause: error });
    } finally { clearTimeout(timer); }
  }
}
