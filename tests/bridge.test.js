import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyBridgeRequest } from '../server/bridge.js';
import { signBridgeRequest } from '../server/lib/security.js';

test('bridge accepts a fresh signed request once and blocks a replay', () => {
  const now = 1_700_000_000_000; const rawBody = '{"operation":"tools/list"}'; const secret = 's'.repeat(32); const headers = { 'x-gitverse-bridge-timestamp': String(now), 'x-gitverse-bridge-nonce': 'nonce-1' };
  headers['x-gitverse-bridge-signature'] = signBridgeRequest(secret, headers['x-gitverse-bridge-timestamp'], headers['x-gitverse-bridge-nonce'], rawBody);
  const cache = new Map();
  assert.equal(verifyBridgeRequest({ headers, rawBody, secret, nonceCache: cache, now }).ok, true);
  assert.equal(verifyBridgeRequest({ headers, rawBody, secret, nonceCache: cache, now }).status, 409);
});

test('bridge rejects an expired request', () => {
  const headers = { 'x-gitverse-bridge-timestamp': '1700000000000', 'x-gitverse-bridge-nonce': 'nonce-2', 'x-gitverse-bridge-signature': 'wrong' };
  assert.equal(verifyBridgeRequest({ headers, rawBody: '{}', secret: 's'.repeat(32), nonceCache: new Map(), now: 1_700_000_061_000 }).status, 401);
});
