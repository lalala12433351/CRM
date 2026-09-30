import { createHmac } from 'crypto';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
  MessageActionType
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
    if (/current status is confirmed/i.test(message)) {
      return new Error('This email is already verified.');
    }
    return new Error('Incorrect email or password.');
  }
  if (code === 'UserNotFoundException') {
    return new Error('No account found for this email. Please sign up first.');
  }
  if (code === 'LimitExceededException' || code === 'TooManyRequestsException') {
    return new Error('Too many password reset attempts. Please wait a few minutes and try again.');
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
  const emailUsername = email.trim().toLowerCase();
  const username = (await lookupCognitoUsername(emailUsername)) || emailUsername;
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

function isAlreadyConfirmedError(err: any): boolean {
  const message = String(err?.message || '');
  return err?.name === 'NotAuthorizedException' && /current status is confirmed/i.test(message);
}

async function confirmSignUpWithUsername(username: string, code: string): Promise<void> {
  const { clientId } = getCognitoConfig();
  await getClient().send(
    new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: code,
      SecretHash: cognitoSecretHash(username)
    })
  );
}

export type CognitoDirectoryUser = {
  username: string;
  status: string;
  emailVerified: boolean;
};

/** Email-alias pools store a UUID username. Sign-up and confirm must use that, not the email. */
export async function findCognitoUserByEmail(email: string): Promise<CognitoDirectoryUser | null> {
  const { userPoolId } = getCognitoConfig();
  const normalized = email.trim().toLowerCase();
  try {
    const listed = await getClient().send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${normalized}"`,
        Limit: 5
      })
    );
    const match = (listed.Users || []).find((user) =>
      (user.Attributes || []).some(
        (attr) => attr.Name === 'email' && (attr.Value || '').trim().toLowerCase() === normalized
      )
    );
    const username = (match?.Username || '').trim();
    if (!username) return null;
    const emailVerified = (match?.Attributes || []).some(
      (attr) => attr.Name === 'email_verified' && attr.Value === 'true'
    );
    return {
      username,
      status: match?.UserStatus || '',
      emailVerified
    };
  } catch (err: any) {
    logger.warn('[Cognito] Could not resolve signup username:', err?.name || err?.message || err);
    return null;
  }
}

async function lookupCognitoUsername(email: string): Promise<string | undefined> {
  const user = await findCognitoUserByEmail(email);
  return user?.username;
}

/** Requires IAM permission cognito-idp:AdminDeleteUser. A missing user counts as deleted. */
export async function cognitoAdminDeleteUser(email: string): Promise<void> {
  if (!isCognitoEnabled()) return;
  const { userPoolId } = getCognitoConfig();
  const normalized = email.trim().toLowerCase();
  const username = (await lookupCognitoUsername(normalized)) || normalized;
  try {
    await getClient().send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: username }));
  } catch (err: any) {
    if (err?.name === 'UserNotFoundException') return;
    throw mapCognitoError(err);
  }
}

export async function cognitoSetUserPassword(username: string, password: string): Promise<void> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { userPoolId } = getCognitoConfig();
  await getClient().send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true
    })
  );
}

export async function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const emailUsername = email.trim().toLowerCase();
  const confirmationCode = String(code || '').replace(/\s+/g, '').trim();
  const storedUsername = await lookupCognitoUsername(emailUsername);
  const username = storedUsername || emailUsername;
  try {
    await confirmSignUpWithUsername(username, confirmationCode);
  } catch (err: any) {
    if (isAlreadyConfirmedError(err)) return;
    throw mapCognitoError(err);
  }
}

/**
 * Admin-invite flow: create a confirmed Cognito user with a permanent password
 * so they can log in immediately (no email verification OTP).
 * Requires IAM permission for AdminCreateUser / AdminSetUserPassword / AdminGetUser.
 */
export async function cognitoAdminCreateUser(opts: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ userSub: string }> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { userPoolId } = getCognitoConfig();
  const email = opts.email.trim().toLowerCase();
  const userAttributes: Array<{ Name: string; Value: string }> = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'name', Value: opts.name.trim() }
  ];
  const phoneDigits = (opts.phone || '').replace(/[^\d+]/g, '');
  if (phoneDigits.length >= 10) {
    const e164 = phoneDigits.startsWith('+') ? phoneDigits : `+91${phoneDigits.slice(-10)}`;
    userAttributes.push({ Name: 'phone_number', Value: e164 });
  }

  try {
    const created = await getClient().send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: opts.password,
        MessageAction: MessageActionType.SUPPRESS,
        UserAttributes: userAttributes
      })
    );

    await getClient().send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: opts.password,
        Permanent: true
      })
    );

    const subAttr = created.User?.Attributes?.find((a) => a.Name === 'sub');
    let userSub = subAttr?.Value || created.User?.Username || '';
    if (!userSub) {
      const existing = await getClient().send(
        new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email })
      );
      userSub = existing.UserAttributes?.find((a) => a.Name === 'sub')?.Value || '';
    }

    if (!userSub) {
      throw new Error('Cognito user was created but no user sub was returned.');
    }

    logger.info(`[Cognito] Admin-created user ${email} sub=${userSub}`);
    return { userSub };
  } catch (err: any) {
    if (err?.name === 'UsernameExistsException') {
      // Reuse existing Cognito user: reset permanent password and return their sub
      try {
        const existing = await getClient().send(
          new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email })
        );
        const userSub = existing.UserAttributes?.find((a) => a.Name === 'sub')?.Value || '';
        if (!userSub) {
          throw new Error('An account with this email already exists in Cognito, but no user sub was found.');
        }
        await getClient().send(
          new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: opts.password,
            Permanent: true
          })
        );
        logger.info(`[Cognito] Reused existing user ${email} sub=${userSub} (password updated)`);
        return { userSub };
      } catch (inner: any) {
        throw mapCognitoError(inner?.name ? inner : err);
      }
    }
    throw mapCognitoError(err);
  }
}

export type CognitoTokens = {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

/**
 * Triggers Cognito forgot-password email (code or custom link template).
 * Configure the User Pool forgot-password message to:
 *   {APP_URL}/set-password?email={username}&code={####}
 */
export async function cognitoForgotPassword(email: string): Promise<void> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { clientId } = getCognitoConfig();
  const username = email.trim().toLowerCase();
  try {
    await getClient().send(
      new ForgotPasswordCommand({
        ClientId: clientId,
        Username: username,
        SecretHash: cognitoSecretHash(username)
      })
    );
  } catch (err: any) {
    throw mapCognitoError(err);
  }
}

export async function cognitoConfirmForgotPassword(opts: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  if (!isCognitoEnabled()) throw new Error('Cognito is not configured');
  const { clientId } = getCognitoConfig();
  const username = opts.email.trim().toLowerCase();
  try {
    await getClient().send(
      new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: username,
        ConfirmationCode: String(opts.code || '').trim(),
        Password: opts.newPassword,
        SecretHash: cognitoSecretHash(username)
      })
    );
  } catch (err: any) {
    throw mapCognitoError(err);
  }
}

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
