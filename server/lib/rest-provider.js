import { classifyHttpError, GitVerseNetworkError, GitVerseValidationError } from './errors.js';

const READ_ENDPOINTS = {
  get_my_user_info: () => '/user',
  get_repository: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}`,
  list_branches: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}/branches`,
  get_repository_content: ({ owner, repo, path = '' }) => `/repos/${part(owner)}/${part(repo)}/contents/${path.split('/').filter(Boolean).map(part).join('/')}`,
  list_commits: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}/commits`,
  get_commit: ({ owner, repo, sha }) => `/repos/${part(owner)}/${part(repo)}/commits/${part(sha)}`,
  list_issues: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}/issues`,
  list_pull_requests: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}/pulls`,
  pull_request_read: ({ owner, repo, pull_number }) => `/repos/${part(owner)}/${part(repo)}/pulls/${part(pull_number)}`,
  list_pull_request_files: ({ owner, repo, pull_number }) => `/repos/${part(owner)}/${part(repo)}/pulls/${part(pull_number)}/files`,
  list_releases: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}/releases`,
  get_release: ({ owner, repo, release_id }) => `/repos/${part(owner)}/${part(repo)}/releases/${part(release_id)}`,
  get_release_by_tag: ({ owner, repo, tag }) => `/repos/${part(owner)}/${part(repo)}/releases/tags/${part(tag)}`,
  actions_list: ({ owner, repo }) => `/repos/${part(owner)}/${part(repo)}/actions/runs`,
  actions_get: ({ owner, repo, run_id }) => `/repos/${part(owner)}/${part(repo)}/actions/runs/${part(run_id)}`,
  get_job_logs: ({ owner, repo, job_id }) => `/repos/${part(owner)}/${part(repo)}/actions/jobs/${part(job_id)}/logs`,
  get_teams: ({ org }) => `/orgs/${part(org)}/teams`,
  get_user_by_username: ({ username }) => `/users/${part(username)}`
};
const part = (value) => encodeURIComponent(String(value));

export class RestGitVerseProvider {
  constructor({ baseUrl, token, fetchImpl = fetch, timeoutMs = 12_000 }) { this.baseUrl = baseUrl; this.token = token; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; }
  supports(operation) { return operation === 'list_repositories' || Object.hasOwn(READ_ENDPOINTS, operation); }
  async call(operation, args = {}) {
    if (!this.token) throw new GitVerseValidationError('GitVerse token is not available. Save it locally before using GitVerse tools.');
    const path = operation === 'list_repositories' ? '/user/repos' : READ_ENDPOINTS[operation]?.(args);
    if (!path) throw new GitVerseValidationError(`REST fallback is not available for ${operation}.`);
    const url = new URL(`${this.baseUrl}${path}`);
    for (const key of ['page', 'per_page', 'limit', 'ref', 'sha', 'path', 'state']) if (args[key] !== undefined) url.searchParams.set(key, String(args[key]));
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(url, { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.gitverse.object+json; version=1' }, signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw classifyHttpError(response.status, response.headers.get('retry-after'));
      const body = await response.text();
      return { content: [{ type: 'text', text: body.slice(0, 256_000) }], _meta: { transport: 'rest', nextPage: response.headers.get('link') || undefined } };
    } catch (error) {
      if (error?.code?.startsWith('GITVERSE_')) throw error;
      throw new GitVerseNetworkError(error?.name === 'AbortError' ? 'Timed out while contacting GitVerse Public API.' : 'Cannot reach GitVerse Public API from this network.', { cause: error });
    } finally { clearTimeout(timer); }
  }
}
