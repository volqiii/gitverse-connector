import { BRIDGE_ALLOWED_TOOLS, CONFIRMATION_REQUIRED, localToolName } from './constants.js';
import { GitVerseConfirmationRequiredError, GitVerseNetworkError, GitVerseRegionalAccessError, GitVerseUnavailableError, GitVerseValidationError } from './errors.js';

const isNetworkFailure = (error) => error instanceof GitVerseNetworkError || error instanceof GitVerseRegionalAccessError || error instanceof GitVerseUnavailableError;

export class TransportManager {
  constructor({ mode = 'auto', mcp, rest, bridge }) { this.mode = mode; this.mcp = mcp; this.rest = rest; this.bridge = bridge; this.tools = []; this.activeTransport = undefined; }
  async listTools() {
    try {
      const tools = await this.#discover();
      this.tools = tools.filter((tool) => BRIDGE_ALLOWED_TOOLS.has(tool.name));
      return [statusTool(), listRepositoriesTool(), ...this.tools.map(toLocalTool)];
    } catch (error) { return [statusTool(error)]; }
  }
  async call(localName, args = {}) {
    if (localName === 'gitverse_connection_status') return this.status();
    if (localName === 'gitverse_list_repositories') return this.rest.call('list_repositories', args);
    const remote = this.tools.find((tool) => localToolName(tool.name) === localName);
    if (!remote) throw new GitVerseValidationError('GitVerse tool is unavailable. Configure authentication, then restart this Codex task to refresh tools.');
    if (CONFIRMATION_REQUIRED.has(remote.name) && args.confirm !== true) throw new GitVerseConfirmationRequiredError();
    const safeArgs = { ...args }; delete safeArgs.confirm;
    try { return await this.#callPrimary(remote.name, safeArgs); }
    catch (error) {
      if (!isNetworkFailure(error)) throw error;
      if (this.mode === 'auto' && this.rest.supports(remote.name)) return this.rest.call(remote.name, safeArgs);
      if (this.mode === 'auto' || this.mode === 'bridge') return this.bridge.callTool(remote.name, safeArgs);
      throw error;
    }
  }
  async status() {
    try { const tools = await this.#discover(); return asText({ status: 'connected', transport: this.activeTransport, discoveredTools: tools.length, message: 'GitVerse connection is ready.' }); }
    catch (error) { return asText({ status: error.code === 'GITVERSE_AUTHENTICATION' ? 'authentication_required' : 'unavailable', transport: this.activeTransport || this.mode, code: error.code || 'GITVERSE_NETWORK', message: error.message }); }
  }
  async #discover() {
    if (this.mode !== 'bridge') {
      try { const tools = await this.mcp.listTools(); this.activeTransport = 'direct-mcp'; return tools; }
      catch (error) { if (this.mode === 'direct' || !isNetworkFailure(error)) throw error; }
    }
    if (this.mode === 'auto' || this.mode === 'bridge') { const tools = await this.bridge.listTools(); this.activeTransport = 'local-bridge'; return tools; }
    throw new GitVerseUnavailableError();
  }
  async #callPrimary(name, args) {
    if (this.activeTransport === 'local-bridge' || this.mode === 'bridge') return this.bridge.callTool(name, args);
    this.activeTransport = 'direct-mcp'; return this.mcp.callTool(name, args);
  }
}
function toLocalTool(remote) {
  const schema = structuredClone(remote.inputSchema || { type: 'object', properties: {} }); schema.properties ||= {}; if (CONFIRMATION_REQUIRED.has(remote.name)) { schema.properties.confirm = { type: 'boolean', description: 'Set true only after the user confirms this exact high-impact target.' }; schema.required = [...new Set([...(schema.required || []), 'confirm'])]; }
  return { name: localToolName(remote.name), description: `GitVerse: ${remote.description || remote.name}`, inputSchema: schema, _meta: { gitverseRemoteTool: remote.name } };
}
function statusTool(error) { return { name: 'gitverse_connection_status', description: 'Safely check GitVerse transport and authentication readiness. It never returns tokens.', inputSchema: { type: 'object', properties: {} }, _meta: { availabilityError: error?.code } }; }
function listRepositoriesTool() { return { name: 'gitverse_list_repositories', description: 'List repositories available to the authenticated GitVerse user. Uses the official read-only Public API with pagination.', inputSchema: { type: 'object', properties: { page: { type: 'integer', minimum: 1 }, per_page: { type: 'integer', minimum: 1, maximum: 100 } } } }; }
function asText(value) { return { content: [{ type: 'text', text: JSON.stringify(value) }] }; }
