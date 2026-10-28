import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db.ts';

// In-memory token session store (24 hours expiry)
interface Session {
  token: string;
  adminId: string;
  email: string;
  role: string;
  expiresAt: number;
}

const sessions = new Map<string, Session>();

// Simple in-memory rate limiter for login
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const record = loginAttempts.get(ip);
  const now = Date.now();
  if (record && record.blockedUntil > now) {
    return { allowed: false, waitSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.blockedUntil = now + 15 * 60 * 1000; // 15 mins block
    record.attempts = 0;
  }
  loginAttempts.set(ip, record);
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function createSessionToken(adminId: string, email: string, role: string): string {
  const token = 'cg_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  sessions.set(token, {
    token,
    adminId,
    email,
    role,
    expiresAt
  });
  return token;
}

export function verifySession(token: string): Session | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
    return;
  }

  const session = verifySession(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
    return;
  }

  (req as any).adminSession = session;
  next();
}
