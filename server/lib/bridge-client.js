import { randomNonce, signBridgeRequest } from './security.js';
import { classifyHttpError, GitVerseNetworkError, GitVerseValidationError } from './errors.js';

export class LocalBridgeProvider {
  constructor({ url, sessionSecret, fetchImpl = fetch, timeoutMs = 8_000 }) { this.url = url; this.sessionSecret = sessionSecret; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; }
  async listTools() { return this.#send({ operation: 'tools/list' }); }
  async callTool(name, args) { return this.#send({ operation: 'tools/call', name, arguments: args }); }
  async #send(payload) {
    if (!this.sessionSecret || this.sessionSecret.length < 32) throw new GitVerseValidationError('Bridge session secret is missing or too short. Use at least 32 characters.');
    const raw = JSON.stringify(payload); const timestamp = String(Date.now()); const nonce = randomNonce();
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(new URL('/v1/mcp', this.url), { method: 'POST', redirect: 'error', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'X-GitVerse-Bridge-Timestamp': timestamp, 'X-GitVerse-Bridge-Nonce': nonce, 'X-GitVerse-Bridge-Signature': signBridgeRequest(this.sessionSecret, timestamp, nonce, raw) }, body: raw });
      if (!response.ok) throw classifyHttpError(response.status, response.headers.get('retry-after'));
      const body = await response.json(); if (!body.ok) throw new GitVerseValidationError(body.error?.message || 'Bridge rejected the operation.'); return body.result;
    } catch (error) { if (error?.code?.startsWith('GITVERSE_')) throw error; throw new GitVerseNetworkError(error?.name === 'AbortError' ? 'Timed out while contacting the local GitVerse bridge.' : 'Local GitVerse bridge is unavailable.', { cause: error }); } finally { clearTimeout(timer); }
  }
}
