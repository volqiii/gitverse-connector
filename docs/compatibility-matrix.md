# GitHub to GitVerse compatibility matrix

| GitHub-style capability | GitVerse equivalent | Connector path | Status |
| --- | --- | --- | --- |
| Current user / user lookup | `get_my_user_info`, `get_user_by_username`, `search_users` | MCP primary; REST for user reads | Supported |
| Repository list, get, create, update, fork | GitVerse repository tools | MCP primary; REST fallback for list/get | Supported |
| File and directory read/write/delete | `get_repository_content`, `create_or_update_file`, `delete_file` | MCP primary; REST fallback for reads | Supported |
| Branches, tags, tree | `list_branches`, `create_branch`, `create_tag`, `get_repository_tree` | MCP primary; REST branches/tree reads | Supported / partial |
| Commit history / commit | `list_commits`, `get_commit` | MCP primary; REST fallback | Supported |
| Issues / tasks / comments | `list_issues`, `issue_read`, `issue_write`, `add_issue_comment` | MCP primary; REST fallback for lists | Supported |
| Pull requests / merge requests | `list_pull_requests`, `pull_request_read`, `create_pull_request`, `update_pull_request`, `list_pull_request_files` | MCP primary; REST fallback for reads | Supported |
| Merge a pull request | No merge operation in current official MCP catalog | Not exposed | Unavailable |
| Releases | `list_releases`, `get_release`, `get_release_by_tag`, `create_release`, `update_release` | MCP primary; REST fallback for reads | Supported |
| CI/CD workflows, runs, jobs, logs, dispatch | `actions_get`, `actions_list`, `get_job_logs`, `get_job_failure_context`, `trigger_workflow_dispatch` | MCP primary; REST fallback for reads | Supported |
| Code or repository search | No dedicated GitVerse MCP tool in the current official catalog | Targeted tree/content retrieval | Unavailable |
| Teams | `get_teams`, `get_team_members` | MCP primary; REST team reads | Supported |
| Review threads, reactions, artifact download, rerun job | No equivalent documented MCP tool | Not exposed | Unavailable / partial |
