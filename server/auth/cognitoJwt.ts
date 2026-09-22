import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { getCognitoConfig, isCognitoEnabled } from './cognitoConfig';

let idTokenVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!isCognitoEnabled()) {
    throw new Error('Cognito is not configured');
  }
  if (!idTokenVerifier) {
    const { userPoolId, clientId } = getCognitoConfig();
    idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId
    });
  }
  return idTokenVerifier;
}

export function looksLikeJwt(token: string): boolean {
  return Boolean(token && token.split('.').length === 3 && !token.startsWith('pixbe_token_'));
}

export type VerifiedCognitoUser = {
  sub: string;
  email: string;
  name?: string;
  tokenUse: string;
  raw: Record<string, any>;
};

export async function verifyCognitoIdToken(token: string): Promise<VerifiedCognitoUser> {
  const payload = await getVerifier().verify(token);
  const email = String(payload.email || '').trim().toLowerCase();
  const sub = String(payload.sub || '').trim();
  if (!sub) throw new Error('Invalid Cognito token: missing sub');
  return {
    sub,
    email,
    name: payload.name ? String(payload.name) : undefined,
    tokenUse: String(payload.token_use || 'id'),
    raw: payload as Record<string, any>
  };
}
