export class GitVerseError extends Error {
  constructor(message, { code = 'GITVERSE_ERROR', status, retryAfter, cause } = {}) { super(message, { cause }); this.name = this.constructor.name; this.code = code; this.status = status; this.retryAfter = retryAfter; }
}
export class GitVerseAuthenticationError extends GitVerseError { constructor(message = 'GitVerse rejected authentication.', options = {}) { super(message, { ...options, code: 'GITVERSE_AUTHENTICATION' }); } }
export class GitVersePermissionError extends GitVerseError { constructor(message = 'GitVerse denied permission for this operation.', options = {}) { super(message, { ...options, code: 'GITVERSE_PERMISSION' }); } }
export class GitVerseNotFoundError extends GitVerseError { constructor(message = 'The requested GitVerse resource was not found.', options = {}) { super(message, { ...options, code: 'GITVERSE_NOT_FOUND' }); } }
export class GitVerseRateLimitError extends GitVerseError { constructor(message = 'GitVerse rate limit reached. Try again later.', options = {}) { super(message, { ...options, code: 'GITVERSE_RATE_LIMIT' }); } }
export class GitVerseNetworkError extends GitVerseError { constructor(message = 'Cannot reach GitVerse from this network.', options = {}) { super(message, { ...options, code: 'GITVERSE_NETWORK' }); } }
export class GitVerseRegionalAccessError extends GitVerseError { constructor(message = 'GitVerse may be unavailable from this network or region.', options = {}) { super(message, { ...options, code: 'GITVERSE_REGIONAL_ACCESS' }); } }
export class GitVerseUnavailableError extends GitVerseError { constructor(message = 'GitVerse is temporarily unavailable.', options = {}) { super(message, { ...options, code: 'GITVERSE_UNAVAILABLE' }); } }
export class GitVerseConflictError extends GitVerseError { constructor(message = 'GitVerse rejected the change because the resource changed.', options = {}) { super(message, { ...options, code: 'GITVERSE_CONFLICT' }); } }
export class GitVerseValidationError extends GitVerseError { constructor(message = 'GitVerse rejected the supplied parameters.', options = {}) { super(message, { ...options, code: 'GITVERSE_VALIDATION' }); } }
export class GitVerseConfirmationRequiredError extends GitVerseError { constructor(message = 'This operation needs explicit confirmation. Repeat with confirm: true after checking the target.', options = {}) { super(message, { ...options, code: 'GITVERSE_CONFIRMATION_REQUIRED' }); } }
export function classifyHttpError(status, retryAfter) {
  if (status === 401) return new GitVerseAuthenticationError(undefined, { status }); if (status === 403) return new GitVersePermissionError(undefined, { status }); if (status === 404) return new GitVerseNotFoundError(undefined, { status }); if (status === 409) return new GitVerseConflictError(undefined, { status }); if (status === 422 || status === 400) return new GitVerseValidationError(undefined, { status }); if (status === 429) return new GitVerseRateLimitError(undefined, { status, retryAfter }); if (status >= 500) return new GitVerseUnavailableError(undefined, { status }); return new GitVerseError(`GitVerse request failed with HTTP ${status}.`, { status });
}
