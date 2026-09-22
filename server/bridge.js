import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { McpGitVerseProvider } from './lib/mcp-client.js';
import { BRIDGE_ALLOWED_TOOLS } from './lib/constants.js';
import { loadToken } from './lib/token-store.js';
import { resolveEndpoints, signBridgeRequest, timingSafeEqual } from './lib/security.js';

const MAX_BODY_BYTES = 256 * 1024;
const MAX_AGE_MS = 60_000;
const RATE_LIMIT = 120;

export function verifyBridgeRequest({ headers, rawBody, secret, nonceCache, now = Date.now() }) {
  const timestamp = headers['x-gitverse-bridge-timestamp']; const nonce = headers['x-gitverse-bridge-nonce']; const signature = headers['x-gitverse-bridge-signature'];
  if (!timestamp || !nonce || !signature || !secret) return { ok: false, status: 401, message: 'Bridge authentication is required.' };
  if (!/^\d{13}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > MAX_AGE_MS) return { ok: false, status: 401, message: 'Bridge request expired.' };
  if (nonceCache.has(nonce)) return { ok: false, status: 409, message: 'Bridge replay rejected.' };
  if (!timingSafeEqual(signature, signBridgeRequest(secret, timestamp, nonce, rawBody))) return { ok: false, status: 401, message: 'Bridge signature is invalid.' };
  nonceCache.set(nonce, now + MAX_AGE_MS); return { ok: true };
}

export function createBridgeServer({ env = process.env, provider, now = () => Date.now() } = {}) {
  const endpoints = resolveEndpoints(env); const gitverse = provider || new McpGitVerseProvider({ endpoint: endpoints.mcp, token: loadToken(env) });
  const secret = env.GITVERSE_BRIDGE_SESSION_SECRET; const nonceCache = new Map(); const requestTimes = [];
  if (!secret || secret.length < 32) throw new Error('GITVERSE_BRIDGE_SESSION_SECRET must contain at least 32 characters.');
  return http.createServer(async (request, response) => {
    if (request.socket.remoteAddress !== '127.0.0.1' && request.socket.remoteAddress !== '::ffff:127.0.0.1' && request.socket.remoteAddress !== '::1') return reply(response, 403, { ok: false, error: { message: 'Bridge only accepts localhost.' } });
    if (request.method !== 'POST' || request.url !== '/v1/mcp') return reply(response, 404, { ok: false, error: { message: 'Not found.' } });
    try {
      const rawBody = await readBody(request); const verified = verifyBridgeRequest({ headers: request.headers, rawBody, secret, nonceCache, now: now() });
      if (!verified.ok) return reply(response, verified.status, { ok: false, error: { message: verified.message } });
      for (const [nonce, expiresAt] of nonceCache) if (expiresAt < now()) nonceCache.delete(nonce);
      while (requestTimes[0] && requestTimes[0] < now() - 60_000) requestTimes.shift(); if (requestTimes.length >= RATE_LIMIT) return reply(response, 429, { ok: false, error: { message: 'Bridge rate limit reached.' } }); requestTimes.push(now());
      const payload = JSON.parse(rawBody); let result;
      if (payload.operation === 'tools/list') result = (await gitverse.listTools()).filter((tool) => BRIDGE_ALLOWED_TOOLS.has(tool.name));
      else if (payload.operation === 'tools/call' && BRIDGE_ALLOWED_TOOLS.has(payload.name) && payload.arguments && typeof payload.arguments === 'object') result = await gitverse.callTool(payload.name, payload.arguments);
      else return reply(response, 400, { ok: false, error: { message: 'Bridge operation is not allowed.' } });
      reply(response, 200, { ok: true, result });
    } catch { reply(response, 502, { ok: false, error: { message: 'GitVerse bridge could not complete the allowed operation.' } }); }
  });
}
function readBody(request) { return new Promise((resolve, reject) => { let size = 0; const chunks = []; request.on('data', (chunk) => { size += chunk.length; if (size > MAX_BODY_BYTES) { reject(new Error('too large')); request.destroy(); } else chunks.push(chunk); }); request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); request.on('error', reject); }); }
function reply(response, status, body) { response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); response.end(JSON.stringify(body)); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { const server = createBridgeServer(); server.listen(47831, '127.0.0.1', () => console.error('GitVerse bridge listening on 127.0.0.1:47831')); }
