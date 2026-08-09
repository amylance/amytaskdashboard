import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'dash_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const passphrase = process.env.DASHBOARD_PASSPHRASE;
  if (!passphrase) {
    throw new Error('DASHBOARD_PASSPHRASE is not set');
  }
  return passphrase;
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
}

export function checkPassphrase(candidate) {
  if (typeof candidate !== 'string' || candidate.length === 0) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function setSessionCookie(res, token) {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

export function clearSessionCookie(res) {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

export function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

export function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}

// --- Profile gate -----------------------------------------------------------
// The Profile/Memory tab has its OWN passphrase, separate from the shared dashboard
// one, so holding the team passphrase does not grant access to Amy's private ledger.
// The passphrase itself lives only as a SHA-256 hash in the database — never here.

const PROFILE_COOKIE_NAME = 'profile_session';
const PROFILE_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function hashPassphrase(candidate) {
  return createHash('sha256').update(String(candidate)).digest('hex');
}

export function createProfileToken() {
  const exp = Math.floor(Date.now() / 1000) + PROFILE_TTL_SECONDS;
  const payload = `p${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyProfileToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload.startsWith('p')) return false;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(payload.slice(1));
  return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
}

export function setProfileCookie(res, token) {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${PROFILE_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${PROFILE_TTL_SECONDS}${secure}`,
  );
}

export function isProfileUnlocked(req) {
  const cookies = parseCookies(req);
  return verifyProfileToken(cookies[PROFILE_COOKIE_NAME]);
}

export { COOKIE_NAME, PROFILE_COOKIE_NAME };
