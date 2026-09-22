import test from 'node:test';
import assert from 'node:assert/strict';
import { redact, requireOfficialEndpoint, signBridgeRequest } from '../server/lib/security.js';
import { classifyHttpError, GitVerseAuthenticationError, GitVerseRateLimitError } from '../server/lib/errors.js';

test('redacts bearer tokens and OAuth-like fields', () => {
  const input = 'Authorization: Bearer abc.def-123 access_token=secret refresh_token: another';
  assert.equal(redact(input).includes('abc.def-123'), false);
  assert.equal(redact(input).includes('secret'), false);
  assert.equal(redact(input).includes('another'), false);
});

test('production endpoints reject SSRF-style overrides', () => {
  assert.throws(() => requireOfficialEndpoint('http://127.0.0.1:8080', 'https://mcp.gitverse.ru'), /Custom endpoint/);
  assert.throws(() => requireOfficialEndpoint('https://169.254.169.254/latest', 'https://mcp.gitverse.ru'), /Custom endpoint/);
  assert.equal(requireOfficialEndpoint(undefined, 'https://mcp.gitverse.ru'), 'https://mcp.gitverse.ru');
});

test('normalizes authentication and rate-limit failures', () => {
  assert.ok(classifyHttpError(401) instanceof GitVerseAuthenticationError);
  const error = classifyHttpError(429, '30');
  assert.ok(error instanceof GitVerseRateLimitError);
  assert.equal(error.retryAfter, '30');
});

test('bridge signatures are deterministic for the same request', () => {
  assert.equal(signBridgeRequest('x'.repeat(32), '1234567890123', 'nonce', '{"operation":"tools/list"}'), signBridgeRequest('x'.repeat(32), '1234567890123', 'nonce', '{"operation":"tools/list"}'));
});
