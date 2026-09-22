import readline from 'node:readline';
import { McpGitVerseProvider } from './lib/mcp-client.js';
import { RestGitVerseProvider } from './lib/rest-provider.js';
import { LocalBridgeProvider } from './lib/bridge-client.js';
import { TransportManager } from './lib/transport-manager.js';
import { loadToken } from './lib/token-store.js';
import { resolveEndpoints, safeError } from './lib/security.js';

const env = process.env; const endpoints = resolveEndpoints(env); const token = loadToken(env);
const manager = new TransportManager({ mode: env.GITVERSE_TRANSPORT || 'auto', mcp: new McpGitVerseProvider({ endpoint: endpoints.mcp, token }), rest: new RestGitVerseProvider({ baseUrl: endpoints.api, token }), bridge: new LocalBridgeProvider({ url: env.GITVERSE_BRIDGE_URL || 'http://127.0.0.1:47831', sessionSecret: env.GITVERSE_BRIDGE_SESSION_SECRET }) });
const io = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
io.on('line', async (line) => { let request; try { request = JSON.parse(line); const result = await handle(request); if (request.id !== undefined) send({ jsonrpc: '2.0', id: request.id, result }); } catch (error) { if (request?.id !== undefined) send({ jsonrpc: '2.0', id: request.id, error: { code: -32000, ...safeError(error) } }); } });
async function handle(request) {
  if (request.method === 'initialize') return { protocolVersion: '2024-11-05', capabilities: { tools: { listChanged: true } }, serverInfo: { name: 'GitVerse Connector', version: '0.1.0' } };
  if (request.method === 'notifications/initialized') return {};
  if (request.method === 'tools/list') return { tools: await manager.listTools() };
  if (request.method === 'tools/call') return manager.call(request.params?.name, request.params?.arguments || {});
  throw new Error('Unsupported MCP method.');
}
function send(value) { process.stdout.write(`${JSON.stringify(value)}\n`); }
