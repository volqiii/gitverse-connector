export const OFFICIAL_MCP_ENDPOINT = 'https://mcp.gitverse.ru';
export const OFFICIAL_API_BASE = 'https://api.gitverse.ru';

// This allowlist is deliberately narrower than a generic HTTP proxy. It tracks
// the official MCP catalog documented by GitVerse and is enforced by Bridge mode.
export const BRIDGE_ALLOWED_TOOLS = new Set([
  'list_branches', 'create_repository', 'get_repository', 'update_repository', 'fork_repository',
  'create_branch', 'create_tag', 'get_repository_tree', 'get_repository_content',
  'create_or_update_file', 'delete_file', 'list_commits', 'get_commit', 'list_releases',
  'create_release', 'get_release_by_tag', 'get_release', 'update_release',
  'create_pull_request', 'list_pull_request_files', 'update_pull_request', 'list_pull_requests',
  'pull_request_read', 'update_pull_request_branch', 'list_issues', 'issue_read', 'issue_write',
  'add_issue_comment', 'get_workflow_dispatch_inputs', 'trigger_workflow_dispatch', 'actions_get',
  'actions_list', 'get_job_logs', 'get_job_failure_context', 'get_my_user_info',
  'get_user_by_username', 'search_users', 'get_teams', 'get_team_members',
  'list_starred_repositories', 'star_repository', 'unstar_repository'
]);

export const TOOL_ALIASES = new Map([
  ['get_my_user_info', 'gitverse_get_current_user'], ['get_user_by_username', 'gitverse_get_user'],
  ['get_repository_content', 'gitverse_get_content'], ['create_or_update_file', 'gitverse_write_file'],
  ['pull_request_read', 'gitverse_get_merge_request'], ['list_pull_requests', 'gitverse_list_merge_requests'],
  ['create_pull_request', 'gitverse_create_merge_request'], ['update_pull_request', 'gitverse_update_merge_request'],
  ['list_pull_request_files', 'gitverse_get_merge_request_files'], ['issue_read', 'gitverse_get_task'],
  ['issue_write', 'gitverse_write_task'], ['add_issue_comment', 'gitverse_comment_task'],
  ['actions_get', 'gitverse_get_ci'], ['actions_list', 'gitverse_list_ci'],
  ['trigger_workflow_dispatch', 'gitverse_run_workflow']
]);

export const CONFIRMATION_REQUIRED = new Set([
  'delete_file', 'update_repository', 'create_release', 'update_pull_request_branch',
  'trigger_workflow_dispatch', 'unstar_repository'
]);

export function localToolName(remoteName) { return TOOL_ALIASES.get(remoteName) ?? `gitverse_${remoteName}`; }
