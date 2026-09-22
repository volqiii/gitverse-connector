import crypto from 'node:crypto';
import { GitVerseValidationError } from './errors.js';
import { OFFICIAL_API_BASE, OFFICIAL_MCP_ENDPOINT } from './constants.js';
const SECRET_PATTERNS = [/(authorization\s*:\s*bearer\s+)[^\s"']+/gi, /(bearer\s+)[a-z0-9._~-]+/gi, /((?:gitverse_)?token\s*[=:]\s*)[^\s"']+/gi, /((?:access|refresh)[_-]?token\s*[=:]\s*)[^\s"']+/gi, /(client_secret\s*[=:]\s*)[^\s"']+/gi];
export function redact(value) { let text = String(value ?? ''); for (const pattern of SECRET_PATTERNS) text = text.replace(pattern, '$1[REDACTED]'); return text; }
export function safeError(error) { return { code: error?.code ?? 'GITVERSE_ERROR', message: redact(error?.message ?? 'GitVerse operation failed.'), status: error?.status }; }
export function requireOfficialEndpoint(value, official, developerMode = false) { const candidate = value || official; const parsed = new URL(candidate); if (developerMode) return parsed.toString().replace(/\/$/, ''); if (parsed.protocol !== 'https:' || parsed.origin !== official) throw new GitVerseValidationError('Custom endpoint is disabled. Use official GitVerse endpoints or enable developer mode locally.'); return parsed.toString().replace(/\/$/, ''); }
export function resolveEndpoints(env = process.env) { const developerMode = env.GITVERSE_DEVELOPER_MODE === 'true'; return { mcp: requireOfficialEndpoint(env.GITVERSE_MCP_ENDPOINT, OFFICIAL_MCP_ENDPOINT, developerMode), api: requireOfficialEndpoint(env.GITVERSE_API_BASE, OFFICIAL_API_BASE, developerMode) }; }
export function randomNonce() { return crypto.randomBytes(24).toString('base64url'); }
export function signBridgeRequest(secret, timestamp, nonce, rawBody) { return crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${rawBody}`).digest('base64url'); }
export function timingSafeEqual(left, right) { const a = Buffer.from(left || ''); const b = Buffer.from(right || ''); return a.length === b.length && crypto.timingSafeEqual(a, b); }
