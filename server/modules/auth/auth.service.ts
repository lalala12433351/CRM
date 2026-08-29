import { provisionClientTenantInAwsDb } from '../../../src/lib/awsDb';
import { logger } from '../../utils/logger';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyName?: string;
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
}

export const otpStore = new Map<string, { code: string; expiresAt: number }>();
export const activeSessions = new Map<string, UserAccount>();

export const AUTH_USERS: UserAccount[] = [
  {
    id: 'agent-ms',
    name: 'Madhava sai nagendra',
    email: 'admin@kiteaviation.edu',
    phone: '+91 98450 11223',
    role: 'Chief Operating Officer (COO)',
    companyName: 'Kite Aviation Academy',
    tenantId: 'company_kite_aviation',
    databaseCollection: 'company_kite_aviation',
    isAdmin: true,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    totalCallsToday: 18,
    talkTimeMinutes: 64,
    convertedLeadsCount: 5,
    revenueGenerated: 850000,
    responseTimeMinutes: 1.2
  },
  {
    id: 'agent-us',
    name: 'Ummema Sufiya BM',
    email: 'employee@kiteaviation.edu',
    phone: '+91 97410 44556',
    role: 'Senior Admission Counselor',
    companyName: 'Kite Aviation Academy',
    tenantId: 'company_kite_aviation',
    databaseCollection: 'company_kite_aviation',
    isAdmin: false,
    status: 'busy',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    totalCallsToday: 24,
    talkTimeMinutes: 98,
    convertedLeadsCount: 8,
    revenueGenerated: 1240000,
    responseTimeMinutes: 1.8
  }
];

export class AuthService {
  public sendOtp(email?: string, phone?: string) {
    const targetEmail = (email || '').trim().toLowerCase();
    const key = (targetEmail || phone || '').trim();
    if (!key) throw new Error('Email or phone is required for OTP');

    const existingByEmail = AUTH_USERS.find((u) => u.email.toLowerCase() === targetEmail);
    if (existingByEmail) {
      throw new Error(`An account with email "${targetEmail}" is already registered. Please log in instead.`);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(key, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    logger.info(`📲 [SMS/Email OTP Sent] Verification Code for ${key}: [ ${code} ]`);
    return { code, key };
  }

  public verifyOtp(email?: string, phone?: string, otp?: string) {
    const key = (email || phone || '').trim().toLowerCase();
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

  public async registerUser(data: { name: string; email: string; phone?: string; companyName: string; password?: string }) {
    const targetEmail = (data.email || '').trim().toLowerCase();
    const targetCompany = (data.companyName || '').trim();

    if (!targetEmail || !data.name || !targetCompany) {
      throw new Error('Name, email, and company name are required');
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
      tenantId: companyCollectionName,
      databaseCollection: companyCollectionName,
      role: 'Master Admin',
      isAdmin: true,
      status: 'online',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 0
    };

    AUTH_USERS.push(newUser);
    await provisionClientTenantInAwsDb(companyCollectionName, targetCompany, targetEmail, newUser.phone);

    const token = `pixbe_token_${tenantId}_${Date.now()}`;
    activeSessions.set(token, newUser);

    logger.info(`✅ [New Tenant Created] Database provisioned for ${targetCompany} (${tenantId}) -> Admin: ${newUser.name}`);
    return { token, tenantId, user: newUser };
  }

  public loginUser(email: string, password?: string) {
    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail) throw new Error('Email address is required');

    if (targetEmail === 'admin@kiteaviation' || targetEmail === 'admin@kiteaviation.edu') {
      if (password && password !== 'admin') {
        throw new Error('Invalid password for Admin account. Expected password: admin');
      }
    }

    if (targetEmail === 'employee@kiteaviation' || targetEmail === 'employee@kiteaviation.edu') {
      if (password && password !== 'employee') {
        throw new Error('Invalid password for Employee account. Expected password: employee');
      }
    }

    let user = AUTH_USERS.find(
      (u) =>
        u.email.toLowerCase() === targetEmail ||
        (targetEmail.includes('admin') && u.isAdmin) ||
        (targetEmail.includes('employee') && !u.isAdmin)
    );

    if (!user) {
      const isAdmin = targetEmail.includes('admin') || targetEmail.includes('owner');
      user = {
        id: `agent-${Date.now().toString().slice(-5)}`,
        name: targetEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: targetEmail,
        phone: '+91 98000 00000',
        role: isAdmin ? 'Master Admin' : 'Course Counselor & Telecaller',
        isAdmin,
        status: 'online',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        totalCallsToday: 0,
        talkTimeMinutes: 0,
        convertedLeadsCount: 0,
        revenueGenerated: 0,
        responseTimeMinutes: 1.0
      };
    }

    const token = `pixbe_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    activeSessions.set(token, user);
    logger.info(`✅ Authenticated User: ${user.name} (${user.email}) -> Role: ${user.isAdmin ? 'Admin' : 'Employee'}`);
    return { token, user };
  }

  public getSession(token: string) {
    return activeSessions.get(token);
  }

  public logoutSession(token: string) {
    activeSessions.delete(token);
  }
}

export const authService = new AuthService();
