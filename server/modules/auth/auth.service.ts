import { multiTenantDb } from '../../services/multiTenantDb';
import { logger } from '../../utils/logger';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';
import { isCognitoEnabled, allowLegacyAdminLogin } from '../../auth/cognitoConfig';
import {
  cognitoSignUp,
  cognitoResendConfirmation,
  cognitoConfirmSignUp,
  cognitoLogin,
  decodeJwtPayload
} from '../../auth/cognitoClient';
import { looksLikeJwt, verifyCognitoIdToken } from '../../auth/cognitoJwt';
import {
  findMembershipsByCognitoSub,
  findMembershipsByEmail,
  bindCognitoSubToMembership
} from '../../db/provisionTenant';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyName?: string;
  companyDescription?: string;
  businessType?: string;
  tenantId?: string;
  databaseCollection?: string;
  isAdmin: boolean;
  status: string;
  avatar: string;
  totalCallsToday: number;
  talkTimeMinutes: number;
  convertedLeadsCount: number;
  revenueGenerated: number;
  responseTimeMinutes: number;
  managerId?: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const otpStore = new Map<string, { code: string; expiresAt: number }>();
export const activeSessions = new Map<string, UserAccount>();

function sessionsFilePath(): string {
  const base =
    process.env.PIXBE_DATA_DIR ||
    (process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'PixbeCrm', 'data')
      : path.join(process.cwd(), '.data'));
  return path.join(base, 'sessions.json');
}

function loadPersistedSessions() {
  try {
    const p = sessionsFilePath();
    if (!fs.existsSync(p)) return;
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!raw || typeof raw !== 'object') return;
    for (const [token, user] of Object.entries(raw)) {
      if (token && user && typeof user === 'object') {
        activeSessions.set(token, user as UserAccount);
      }
    }
    if (activeSessions.size > 0) {
      logger.info(`[Auth] Restored ${activeSessions.size} session(s) from disk`);
    }
  } catch (e: any) {
    logger.warn('[Auth] Session load notice:', e?.message || e);
  }
}

function persistSessions() {
  try {
    const p = sessionsFilePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = JSON.stringify(Object.fromEntries(activeSessions), null, 2);
    const tmp = `${p}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, payload, 'utf8');
    try {
      fs.renameSync(tmp, p);
    } catch {
      fs.copyFileSync(tmp, p);
      try { fs.unlinkSync(tmp); } catch {}
    }
  } catch (e: any) {
    logger.warn('[Auth] Session persist notice:', e?.message || e);
  }
}

function setSession(token: string, user: UserAccount) {
  activeSessions.set(token, user);
  persistSessions();
}

loadPersistedSessions();

export const AUTH_USERS: UserAccount[] = [];

function userAccountFromAgent(agent: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  companyName?: string;
  tenantId?: string;
  isAdmin?: boolean;
  status?: string;
  avatar?: string;
  totalCallsToday?: number;
  talkTimeMinutes?: number;
  convertedLeadsCount?: number;
  revenueGenerated?: number;
  responseTimeMinutes?: number;
  managerId?: string;
}, overrides?: Partial<UserAccount>): UserAccount {
  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    phone: agent.phone || '',
    role: agent.role || 'Telecaller',
    companyName: agent.companyName,
    tenantId: agent.tenantId,
    databaseCollection: agent.tenantId,
    isAdmin: Boolean(agent.isAdmin),
    status: agent.status || 'online',
    avatar: agent.avatar || '',
    totalCallsToday: agent.totalCallsToday || 0,
    talkTimeMinutes: agent.talkTimeMinutes || 0,
    convertedLeadsCount: agent.convertedLeadsCount || 0,
    revenueGenerated: agent.revenueGenerated || 0,
    responseTimeMinutes: agent.responseTimeMinutes || 0,
    managerId: agent.managerId,
    ...overrides
  };
}

function upsertAuthUserCache(user: UserAccount) {
  const idx = AUTH_USERS.findIndex(
    (u) =>
      u.id === user.id ||
      (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
  );
  if (idx >= 0) AUTH_USERS[idx] = { ...AUTH_USERS[idx], ...user };
  else AUTH_USERS.push(user);
}

export class AuthService {
  public async sendOtp(
    email?: string,
    phone?: string,
    extras?: { password?: string; name?: string; resend?: boolean }
  ) {
    const targetEmail = (email || '').trim().toLowerCase();
    const key = (targetEmail || phone || '').trim();
    if (!key) throw new Error('Email or phone is required for OTP');

    if (isCognitoEnabled()) {
      if (!targetEmail) throw new Error('Email is required for Cognito verification');
      if (extras?.resend) {
        await cognitoResendConfirmation(targetEmail);
        return { code: undefined as string | undefined, key: targetEmail, via: 'cognito' as const };
      }
      const password = extras?.password || '';
      const name = (extras?.name || '').trim();
      if (!password || !name) {
        throw new Error('Name and password are required to start Cognito sign-up');
      }
      try {
        const signed = await cognitoSignUp({
          email: targetEmail,
          password,
          name,
          phone
        });
        if (signed.userConfirmed) {
          return { code: undefined, key: targetEmail, via: 'cognito' as const, alreadyConfirmed: true };
        }
        return { code: undefined, key: targetEmail, via: 'cognito' as const };
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.toLowerCase().includes('already exists')) {
          // Unconfirmed user may need a resent code
          try {
            await cognitoResendConfirmation(targetEmail);
            return { code: undefined, key: targetEmail, via: 'cognito' as const };
          } catch {
            throw err;
          }
        }
        throw err;
      }
    }

    const existingByEmail = AUTH_USERS.find((u) => u.email.toLowerCase() === targetEmail);
    if (existingByEmail) {
      throw new Error(`An account with email "${targetEmail}" is already registered. Please log in instead.`);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(key, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    logger.info(`📲 [SMS/Email OTP Sent] Verification Code for ${key}: [ ${code} ]`);
    return { code, key, via: 'local' as const };
  }

  public async verifyOtp(email?: string, phone?: string, otp?: string) {
    const key = (email || phone || '').trim().toLowerCase();

    if (isCognitoEnabled()) {
      if (!email) throw new Error('Email is required to verify Cognito sign-up');
      await cognitoConfirmSignUp(email, otp || '');
      return true;
    }

    const stored = otpStore.get(key);

    if (!stored) {
      throw new Error('No verification OTP request found. Please resend code.');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      throw new Error('Verification code expired. Please request a new code.');
    }

    if (stored.code !== (otp || '').trim()) {
      throw new Error('Invalid 6-digit verification code. Please check and try again.');
    }

    otpStore.delete(key);
    return true;
  }

  private async userFromMembershipAndAgent(opts: {
    tenantId: string;
    agentId: string;
    email: string;
    role: string;
    isAdmin: boolean;
    companyName?: string;
  }): Promise<UserAccount> {
    const agents = await multiTenantDb.getAgents(opts.tenantId);
    const agent =
      agents.find((a) => a.id === opts.agentId) ||
      agents.find((a) => a.email && a.email.toLowerCase() === opts.email.toLowerCase()) ||
      null;
    if (agent) {
      return userAccountFromAgent(agent, {
        role: opts.isAdmin ? 'Admin' : opts.role || agent.role,
        isAdmin: opts.isAdmin || Boolean(agent.isAdmin),
        companyName: opts.companyName || agent.companyName,
        tenantId: opts.tenantId
      });
    }
    const tenant = multiTenantDb.getTenant(opts.tenantId);
    return {
      id: opts.agentId,
      name: opts.email.split('@')[0] || 'User',
      email: opts.email,
      phone: '',
      role: opts.role || 'Telecaller',
      companyName: opts.companyName || tenant?.companyName,
      tenantId: opts.tenantId,
      databaseCollection: opts.tenantId,
      isAdmin: opts.isAdmin,
      status: 'online',
      avatar: '',
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 0
    };
  }

  public async resolveUserFromCognitoToken(
    token: string,
    preferredTenantId?: string
  ): Promise<UserAccount | null> {
    const verified = await verifyCognitoIdToken(token);
    let memberships = await findMembershipsByCognitoSub(verified.sub);
    if (!memberships.length && verified.email) {
      memberships = await findMembershipsByEmail(verified.email);
      if (memberships.length === 1 && verified.sub) {
        await bindCognitoSubToMembership({
          tenantId: memberships[0].tenantId,
          email: memberships[0].email,
          cognitoSub: verified.sub
        });
      }
    }
    if (!memberships.length) return null;

    const preferred = (preferredTenantId || '').trim();
    const chosen =
      (preferred && memberships.find((m) => m.tenantId === preferred)) || memberships[0];
    if (preferred && chosen.tenantId !== preferred) {
      throw new Error('Forbidden: You are not a member of that workspace');
    }

    const tenant = multiTenantDb.getTenant(chosen.tenantId);
    return this.userFromMembershipAndAgent({
      tenantId: chosen.tenantId,
      agentId: chosen.agentId,
      email: chosen.email || verified.email,
      role: chosen.role,
      isAdmin: chosen.isAdmin,
      companyName: tenant?.companyName
    });
  }

  public async registerUser(data: { 
    name: string; 
    email: string; 
    phone?: string; 
    companyName: string; 
    password?: string;
    companyDescription?: string;
    businessType?: string;
    businessTypeOther?: string;
    referralSource?: string;
    referralSourceOther?: string;
  }) {
    const targetEmail = (data.email || '').trim().toLowerCase();
    const targetCompany = (data.companyName || '').trim();
    const password = (data.password || '').trim();

    if (!targetEmail || !data.name || !targetCompany) {
      throw new Error('Name, email, and company name are required');
    }

    if (isCognitoEnabled()) {
      if (!password) throw new Error('Password is required');

      const existingMemberships = await findMembershipsByEmail(targetEmail);
      if (existingMemberships.length) {
        throw new Error(`An account with email "${targetEmail}" is already registered. Please log in instead.`);
      }

      // Confirm sign-up must already have succeeded (OTP step). Authenticate to get sub + tokens.
      const tokens = await cognitoLogin(targetEmail, password);
      const payload = decodeJwtPayload(tokens.idToken);
      const cognitoSub = String(payload.sub || '').trim();
      if (!cognitoSub) throw new Error('Cognito login succeeded but token had no sub');

      const companySlug = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
      const companyCollectionName = `company_${companySlug}`;
      const tenantId = companyCollectionName;

      const newUser: UserAccount = {
        id: `agent_${Date.now().toString().slice(-6)}`,
        name: data.name.trim(),
        email: targetEmail,
        phone: data.phone ? data.phone.trim() : '+91 98000 00000',
        companyName: targetCompany,
        companyDescription: data.companyDescription?.trim() || '',
        businessType: (data.businessType === 'Other' && data.businessTypeOther ? data.businessTypeOther : data.businessType) || '',
        tenantId: companyCollectionName,
        databaseCollection: companyCollectionName,
        role: 'Admin',
        isAdmin: true,
        status: 'online',
        avatar: '',
        totalCallsToday: 0,
        talkTimeMinutes: 0,
        convertedLeadsCount: 0,
        revenueGenerated: 0,
        responseTimeMinutes: 0
      };

      AUTH_USERS.push(newUser);

      await multiTenantDb.createTenant({
        tenantId,
        companyName: targetCompany,
        ownerEmail: targetEmail,
        ownerPhone: newUser.phone,
        adminName: newUser.name,
        companyDescription: data.companyDescription,
        businessType: data.businessType,
        businessTypeOther: data.businessTypeOther,
        referralSource: data.referralSource,
        referralSourceOther: data.referralSourceOther
      });

      // Ensure membership has cognito_sub (createTenant provision may have run without it)
      await bindCognitoSubToMembership({
        tenantId,
        email: targetEmail,
        cognitoSub
      });
      // Also re-upsert in case membership row used a different agent id
      const agents = await multiTenantDb.getAgents(tenantId);
      const adminAgent =
        agents.find((a) => a.email?.toLowerCase() === targetEmail) || agents[0];
      if (adminAgent) {
        newUser.id = adminAgent.id;
        await bindCognitoSubToMembership({
          tenantId,
          email: targetEmail,
          cognitoSub
        });
      }

      upsertAuthUserCache(newUser);
      logger.info(
        `✅ [Cognito Tenant Created] ${targetCompany} (${tenantId}) -> Admin: ${newUser.name} sub=${cognitoSub}`
      );
      return { token: tokens.idToken, tenantId, user: newUser };
    }

    const existingByEmail = AUTH_USERS.find((u) => u.email.toLowerCase() === targetEmail);
    if (existingByEmail) {
      throw new Error(`An account with email "${targetEmail}" is already registered. Please log in instead.`);
    }

    const companySlug = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    const companyCollectionName = `company_${companySlug}`;
    const tenantId = companyCollectionName;

    const newUser: UserAccount = {
      id: `agent_${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      email: targetEmail,
      phone: data.phone ? data.phone.trim() : '+91 98000 00000',
      companyName: targetCompany,
      companyDescription: data.companyDescription?.trim() || '',
      businessType: (data.businessType === 'Other' && data.businessTypeOther ? data.businessTypeOther : data.businessType) || '',
      tenantId: companyCollectionName,
      databaseCollection: companyCollectionName,
      role: 'Admin',
      isAdmin: true,
      status: 'online',
      avatar: '',
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 0
    };

    AUTH_USERS.push(newUser);

    await multiTenantDb.createTenant({
      tenantId,
      companyName: targetCompany,
      ownerEmail: targetEmail,
      ownerPhone: newUser.phone,
      adminName: newUser.name,
      companyDescription: data.companyDescription,
      businessType: data.businessType,
      businessTypeOther: data.businessTypeOther,
      referralSource: data.referralSource,
      referralSourceOther: data.referralSourceOther
    });

    const token = `pixbe_token_${tenantId}_${Date.now()}`;
    setSession(token, newUser);

    logger.info(`✅ [New Tenant Created] Database provisioned for ${targetCompany} (${tenantId}) -> Admin: ${newUser.name}, Industry: ${newUser.businessType || 'N/A'}`);
    return { token, tenantId, user: newUser };
  }

  public async loginUser(email: string, password?: string) {
    const targetEmail = (email || '').trim().toLowerCase();
    const inputPass   = (password || '').trim();

    if (!targetEmail) {
      throw new Error('Email address is required.');
    }
    if (!inputPass) {
      throw new Error('Password is required.');
    }

    if (isCognitoEnabled()) {
      const tokens = await cognitoLogin(targetEmail, inputPass);
      const payload = decodeJwtPayload(tokens.idToken);
      const sub = String(payload.sub || '').trim();

      let memberships = sub ? await findMembershipsByCognitoSub(sub) : [];
      if (!memberships.length) {
        memberships = await findMembershipsByEmail(targetEmail);
        if (memberships.length && sub) {
          await bindCognitoSubToMembership({
            tenantId: memberships[0].tenantId,
            email: targetEmail,
            cognitoSub: sub
          });
        }
      }

      if (!memberships.length) {
        throw new Error(
          'Cognito login succeeded, but no workspace membership was found. Complete Sign Up to create your company workspace.'
        );
      }

      const m = memberships[0];
      const tenant = multiTenantDb.getTenant(m.tenantId);
      const user = await this.userFromMembershipAndAgent({
        tenantId: m.tenantId,
        agentId: m.agentId,
        email: m.email || targetEmail,
        role: m.role,
        isAdmin: m.isAdmin,
        companyName: tenant?.companyName
      });
      upsertAuthUserCache(user);
      return { token: tokens.idToken, user };
    }

    const ALLOWED_ADMIN = 'admin@kiteaviation';
    const ALLOWED_ADMIN_ALT = 'admin@kiteaviation.com';
    const DEFAULT_ADMIN_TENANT = 'company_kite_aviation';

    // 1. Built-in workspace admin (credentials stay the same; display name comes from the tenant store)
    if (allowLegacyAdminLogin() && (targetEmail === ALLOWED_ADMIN || targetEmail === ALLOWED_ADMIN_ALT)) {
      const isValidAdminPass = inputPass === 'admin' || inputPass === 'admin@123';
      if (!isValidAdminPass) {
        throw new Error('Invalid password. Incorrect password for admin@kiteaviation.');
      }

      const storedAgent =
        (await multiTenantDb.findAgentByEmail(ALLOWED_ADMIN)) ||
        (await multiTenantDb.findAgentByEmail(ALLOWED_ADMIN_ALT)) ||
        (await multiTenantDb.getAgents(DEFAULT_ADMIN_TENANT)).find((agent) => agent.id === 'agent_kiteaviation_admin');
      const tenant = multiTenantDb.getTenant(storedAgent?.tenantId || DEFAULT_ADMIN_TENANT);
      const companyName = tenant?.companyName || storedAgent?.companyName || 'Direct Keys';
      const tenantId = storedAgent?.tenantId || tenant?.tenantId || DEFAULT_ADMIN_TENANT;

      const adminUser: UserAccount = storedAgent
        ? userAccountFromAgent(storedAgent, {
            companyName,
            tenantId,
            databaseCollection: tenantId,
            role: 'Admin',
            isAdmin: true
          })
        : {
            id: 'agent_kiteaviation_admin',
            name: 'Direct Keys Admin',
            email: ALLOWED_ADMIN,
            phone: '+91 98765 43210',
            companyName,
            tenantId,
            databaseCollection: tenantId,
            role: 'Admin',
            isAdmin: true,
            status: 'online',
            avatar: '',
            totalCallsToday: 0,
            talkTimeMinutes: 0,
            convertedLeadsCount: 0,
            revenueGenerated: 0,
            responseTimeMinutes: 1
          };

      upsertAuthUserCache(adminUser);
      if (!storedAgent) {
        try {
          await multiTenantDb.saveAgent(tenantId, {
            ...adminUser,
            role: 'Admin',
            isAdmin: true,
            permission: 'Admin'
          });
        } catch (e) {
          logger.warn('Admin store sync notice:', (e as any)?.message || e);
        }
      }

      const token = `pixbe_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setSession(token, adminUser);
      return { token, user: adminUser };
    }

    // 2. Persisted workspace users (primary) — always hydrate from multiTenantDb
    const storedAgent = await multiTenantDb.findAgentByEmail(targetEmail);
    if (storedAgent) {
      if (storedAgent.passwordHash) {
        if (!verifyPassword(inputPass, storedAgent.passwordHash)) {
          throw new Error('Invalid password. Ask your administrator to set or reset your temporary password.');
        }
      } else {
        const registeredUser = AUTH_USERS.find((u) => u.email.toLowerCase() === targetEmail);
        const expectedPass = (registeredUser as any)?.password || 'admin';
        if (inputPass !== expectedPass && inputPass !== 'admin' && inputPass !== 'admin@123') {
          throw new Error('Invalid password. Ask your administrator to set or reset your temporary password.');
        }
      }

      const storedUser = userAccountFromAgent(storedAgent);
      upsertAuthUserCache(storedUser);
      const token = `pixbe_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setSession(token, storedUser);
      return { token, user: storedUser };
    }

    // 3. Runtime-only registered users (no agent row yet)
    const registeredUser = AUTH_USERS.find((u) => u.email.toLowerCase() === targetEmail);
    if (registeredUser) {
      const expectedPass = (registeredUser as any).password || 'admin';
      if (inputPass !== expectedPass && inputPass !== 'admin' && inputPass !== 'admin@123') {
        throw new Error('Invalid password. Please check your credentials.');
      }
      const token = `pixbe_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setSession(token, registeredUser);
      return { token, user: registeredUser };
    }

    throw new Error('Invalid email address or password.');
  }

  public getSession(token: string) {
    return activeSessions.get(token);
  }

  /** Return session user refreshed from the durable agent record when available. */
  public async getSessionHydrated(token: string, preferredTenantId?: string): Promise<UserAccount | null> {
    if (isCognitoEnabled() && looksLikeJwt(token)) {
      try {
        return await this.resolveUserFromCognitoToken(token, preferredTenantId);
      } catch (err: any) {
        logger.warn('[Auth] Cognito token hydrate failed:', err?.message || err);
        return null;
      }
    }

    const session = activeSessions.get(token);
    if (!session) return null;

    try {
      let agent =
        (session.email ? await multiTenantDb.findAgentByEmail(session.email) : null) ||
        null;
      if (!agent && session.tenantId && session.id) {
        const agents = await multiTenantDb.getAgents(session.tenantId);
        agent = agents.find((a) => a.id === session.id) || null;
      }
      if (!agent) return session;

      const hydrated = userAccountFromAgent(agent, {
        companyName: agent.companyName || session.companyName,
        role: session.isAdmin ? 'Admin' : (agent.role || session.role),
        isAdmin: session.isAdmin || Boolean(agent.isAdmin)
      });
      setSession(token, hydrated);
      upsertAuthUserCache(hydrated);
      return hydrated;
    } catch {
      return session;
    }
  }

  public logoutSession(token: string) {
    if (looksLikeJwt(token)) return; // Cognito JWT is stateless; client clears storage
    activeSessions.delete(token);
    persistSessions();
  }

  /** Re-bind a browser token after server restart so API creates/fetches keep working. */
  public async restoreSession(token: string, userHint?: Partial<UserAccount>) {
    if (isCognitoEnabled() && looksLikeJwt(token)) {
      const user = await this.resolveUserFromCognitoToken(token, userHint?.tenantId);
      if (!user) throw new Error('Session expired. Please sign in again.');
      return { token, user };
    }

    if (!token || !String(token).startsWith('pixbe_token_')) {
      throw new Error('Invalid session token');
    }
    const existing = activeSessions.get(token);
    if (existing) {
      const hydrated = await this.getSessionHydrated(token);
      return { token, user: hydrated || existing };
    }

    const email = (userHint?.email || '').trim().toLowerCase();
    const userId = (userHint?.id || '').trim();
    const tenantHint = (userHint?.tenantId || '').trim();

    let agent = email ? await multiTenantDb.findAgentByEmail(email) : null;
    if (!agent && userId && tenantHint) {
      const agents = await multiTenantDb.getAgents(tenantHint);
      agent = agents.find((a) => a.id === userId) || null;
    }

    if (
      allowLegacyAdminLogin() &&
      !agent &&
      (email === 'admin@kiteaviation' ||
        email === 'admin@kiteaviation.com' ||
        userId === 'agent_kiteaviation_admin')
    ) {
      agent =
        (await multiTenantDb.findAgentByEmail('admin@kiteaviation')) ||
        (await multiTenantDb.getAgents('company_kite_aviation')).find(
          (a) => a.id === 'agent_kiteaviation_admin'
        ) ||
        null;
    }

    if (!agent) {
      throw new Error('Session expired. Please sign in again.');
    }

    const restored = userAccountFromAgent(agent, {
      companyName: agent.companyName || userHint?.companyName,
      role: agent.isAdmin || userHint?.isAdmin ? 'Admin' : (agent.role || userHint?.role || 'Telecaller'),
      isAdmin: Boolean(agent.isAdmin || userHint?.isAdmin)
    });
    upsertAuthUserCache(restored);
    setSession(token, restored);
    return { token, user: restored };
  }

  public async updateProfile(userId: string, data: { name: string; newId?: string; email?: string; phone?: string; avatar?: string }, tenantId?: string) {
    const cleanName = (data.name || '').trim();
    const newId = (data.newId || userId || '').trim();
    const cleanEmail = data.email !== undefined ? String(data.email || '').trim() : undefined;
    const cleanPhone = data.phone !== undefined ? String(data.phone || '').trim() : undefined;
    if (!cleanName) throw new Error('User name is required.');

    // 1. Update only sessions for this user (not every user in the tenant)
    for (const [token, sessionUser] of activeSessions.entries()) {
      const sameUser =
        sessionUser.id === userId ||
        (cleanEmail && sessionUser.email && sessionUser.email.toLowerCase() === cleanEmail.toLowerCase());
      if (!sameUser) continue;
      sessionUser.name = cleanName;
      if (newId) sessionUser.id = newId;
      if (cleanEmail !== undefined) sessionUser.email = cleanEmail;
      if (cleanPhone !== undefined) sessionUser.phone = cleanPhone;
      if (data.avatar !== undefined) sessionUser.avatar = data.avatar;
      setSession(token, sessionUser);
    }

    // 2. Update in AUTH_USERS array
    const emailLower = cleanEmail?.toLowerCase();
    const userInAuth = AUTH_USERS.find(
      (u) =>
        u.id === userId ||
        (emailLower && u.email && u.email.toLowerCase() === emailLower)
    );
    if (userInAuth) {
      userInAuth.name = cleanName;
      if (newId) userInAuth.id = newId;
      if (cleanEmail !== undefined) userInAuth.email = cleanEmail;
      if (cleanPhone !== undefined) userInAuth.phone = cleanPhone;
      if (data.avatar !== undefined) userInAuth.avatar = data.avatar;
    }

    // 3. Persist in multiTenantDb (agents + denormalized lead/task/call labels)
    const targetTenantId = tenantId || userInAuth?.tenantId || 'company_kite_aviation';
    const updatedAgent = await multiTenantDb.updateAgentProfile(targetTenantId, userId, {
      name: cleanName,
      id: newId,
      email: cleanEmail,
      phone: cleanPhone,
      avatar: data.avatar
    });

    const merged: UserAccount = {
      id: updatedAgent?.id || newId || userId,
      name: cleanName,
      email: cleanEmail !== undefined ? cleanEmail : (updatedAgent?.email || userInAuth?.email || ''),
      phone: cleanPhone !== undefined ? cleanPhone : (updatedAgent?.phone || userInAuth?.phone || ''),
      avatar: data.avatar !== undefined ? data.avatar : (updatedAgent?.avatar || userInAuth?.avatar || ''),
      tenantId: updatedAgent?.tenantId || targetTenantId,
      databaseCollection: updatedAgent?.tenantId || targetTenantId,
      companyName: updatedAgent?.companyName || userInAuth?.companyName,
      role: updatedAgent?.role || userInAuth?.role || 'Admin',
      isAdmin: updatedAgent?.isAdmin ?? userInAuth?.isAdmin ?? false,
      status: updatedAgent?.status || userInAuth?.status || 'online',
      totalCallsToday: updatedAgent?.totalCallsToday || userInAuth?.totalCallsToday || 0,
      talkTimeMinutes: updatedAgent?.talkTimeMinutes || userInAuth?.talkTimeMinutes || 0,
      convertedLeadsCount: updatedAgent?.convertedLeadsCount || userInAuth?.convertedLeadsCount || 0,
      revenueGenerated: updatedAgent?.revenueGenerated || userInAuth?.revenueGenerated || 0,
      responseTimeMinutes: updatedAgent?.responseTimeMinutes || userInAuth?.responseTimeMinutes || 0,
      managerId: updatedAgent?.managerId || userInAuth?.managerId
    };

    upsertAuthUserCache(merged);

    // Refresh all matching sessions with the full hydrated profile
    for (const [token, sessionUser] of activeSessions.entries()) {
      if (sessionUser.id === merged.id || sessionUser.id === userId ||
          (merged.email && sessionUser.email && sessionUser.email.toLowerCase() === merged.email.toLowerCase())) {
        setSession(token, { ...sessionUser, ...merged });
      }
    }

    return merged;
  }
}

export const authService = new AuthService();
