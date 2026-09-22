/** Cognito env helpers. Enabled when pool + client id are set. */

export function isCognitoEnabled(): boolean {
  return Boolean(
    (process.env.COGNITO_USER_POOL_ID || '').trim() &&
      (process.env.COGNITO_CLIENT_ID || '').trim()
  );
}

export function getCognitoConfig() {
  const region = (process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1').trim();
  const userPoolId = (process.env.COGNITO_USER_POOL_ID || '').trim();
  const clientId = (process.env.COGNITO_CLIENT_ID || '').trim();
  const clientSecret = (process.env.COGNITO_CLIENT_SECRET || '').trim();
  const issuer =
    (process.env.COGNITO_ISSUER || '').trim() ||
    (userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : '');
  const domain = (process.env.COGNITO_DOMAIN || '').trim().replace(/\/$/, '');
  const redirectUri = (process.env.COGNITO_REDIRECT_URI || 'http://localhost:8080/').trim();

  return { region, userPoolId, clientId, clientSecret, issuer, domain, redirectUri };
}

export function allowLegacyAdminLogin(): boolean {
  const raw = (process.env.ALLOW_LEGACY_ADMIN || '').trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  // Default: allow demo admin only when Cognito is off
  return !isCognitoEnabled();
}
