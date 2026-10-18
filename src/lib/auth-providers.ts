/**
 * Social login is optional. Providers are only advertised when both the
 * client id and secret are configured; otherwise the buttons fail on click.
 * Phase 1 ships with email + password only.
 */
export const hasGoogleOAuth = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const hasGitHubOAuth = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);

export const hasSocialLogin = hasGoogleOAuth || hasGitHubOAuth;
