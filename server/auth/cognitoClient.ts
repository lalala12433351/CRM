import { createHmac } from 'crypto';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
import { getCognitoConfig, isCognitoEnabled } from './cognitoConfig';
import { logger } from '../utils/logger';

let client: CognitoIdentityProviderClient | null = null;

function getClient(): CognitoIdentityProviderClient {
  if (!client) {
    const { region } = getCognitoConfig();
    client = new CognitoIdentityProviderClient({ region });
  }
  return client;
}

/** Required when the app client was created with a client secret. */
function cognitoSecretHash(username: string): string | undefined {
  const { clientId, clientSecret } = getCognitoConfig();
  if (!clientSecret) return undefined;
  return createHmac('sha256', clientSecret).update(`${username}${clientId}`).digest('base64');
}

function mapCognitoError(err: any): Error {
  const code = err?.name || err?.Code || '';
  const message = err?.message || String(err);
  logger.warn('[Cognito]', code, message);
  if (code === 'UsernameExistsException') {
    return new Error('An account with this email already exists. Please sign in instead.');
  }
  if (code === 'InvalidPasswordException') {
    return new Error(
      'Password does not meet Cognito policy (usually 8+ chars with upper, lower, number, and symbol).'
    );
  }
  if (code === 'CodeMismatchException') {
    return new Error('Invalid verification code. Please check the code from your email.');
  }
  if (code === 'ExpiredCodeException') {
    return new Error('Verification code expired. Please request a new code.');
  }
  if (code === 'UserNotConfirmedException') {
    return new Error('Email not verified yet. Enter the verification code sent to your email.');
  }
  if (code === 'NotAuthorizedException') {
    if (/secret_hash/i.test(message)) {
      return new Error(
        'Cognito app client has a client secret. Add COGNITO_CLIENT_SECRET to .env (Client secrets tab), then restart.'
      );
    }
    return new Error('Incorrect email or password.');
  }
  if (code === 'UserNotFoundException') {
    return new Error('No account found for this email. Please sign up first.');
  }
  if (code === 'InvalidParameterException') {
    return new Error(message || 'Invalid account details. Check email and password.');
  }
  return new Error(message || 'Cognito request failed');
}

export async function cognitoSignUp(opts: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ userSub: string; userConfirmed: boolean }> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { clientId } = getCognitoConfig();
  const email = opts.email.trim().toLowerCase();
  const userAttributes: Array<{ Name: string; Value: string }> = [
    { Name: 'email', Value: email },
    { Name: 'name', Value: opts.name.trim() }
  ];
  const phoneDigits = (opts.phone || '').replace(/[^\d+]/g, '');
  if (phoneDigits.length >= 10) {
    // Cognito expects E.164 when phone_number attribute is used
    const e164 = phoneDigits.startsWith('+') ? phoneDigits : `+91${phoneDigits.slice(-10)}`;
    userAttributes.push({ Name: 'phone_number', Value: e164 });
  }

  try {
    const out = await getClient().send(
      new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: opts.password,
        SecretHash: cognitoSecretHash(email),
        UserAttributes: userAttributes
      })
    );
    return {
      userSub: out.UserSub || '',
      userConfirmed: Boolean(out.UserConfirmed)
    };
  } catch (err: any) {
    if (err?.name === 'UsernameExistsException') {
      // Allow resend path for unconfirmed users
      throw mapCognitoError(err);
    }
    throw mapCognitoError(err);
  }
}

export async function cognitoResendConfirmation(email: string): Promise<void> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { clientId } = getCognitoConfig();
  const username = email.trim().toLowerCase();
  try {
    await getClient().send(
      new ResendConfirmationCodeCommand({
        ClientId: clientId,
        Username: username,
        SecretHash: cognitoSecretHash(username)
      })
    );
  } catch (err: any) {
    throw mapCognitoError(err);
  }
}

export async function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { clientId } = getCognitoConfig();
  const username = email.trim().toLowerCase();
  try {
    await getClient().send(
      new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: username,
        ConfirmationCode: code.trim(),
        SecretHash: cognitoSecretHash(username)
      })
    );
  } catch (err: any) {
    throw mapCognitoError(err);
  }
}

export type CognitoTokens = {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export async function cognitoLogin(email: string, password: string): Promise<CognitoTokens> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { clientId } = getCognitoConfig();
  const username = email.trim().toLowerCase();
  const secretHash = cognitoSecretHash(username);
  if (getCognitoConfig().clientSecret && !secretHash) {
    throw new Error('Cognito client secret is set but SECRET_HASH could not be computed.');
  }
  try {
    const out = await getClient().send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          ...(secretHash ? { SECRET_HASH: secretHash } : {})
        }
      })
    );
    const result = out.AuthenticationResult;
    if (!result?.IdToken) {
      throw new Error('Cognito login did not return tokens. Enable USER_PASSWORD_AUTH on the app client.');
    }
    return {
      idToken: result.IdToken,
      accessToken: result.AccessToken || '',
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn
    };
  } catch (err: any) {
    throw mapCognitoError(err);
  }
}

/** Decode JWT payload without verify (used after Cognito login we just performed). */
export function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}
