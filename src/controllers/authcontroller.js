const prisma = require('../utils/prisma');
const { hashPassword, verifyPassword, isPasswordStrongEnough } = require('../utils/password');
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_DAYS,
} = require('../utils/jwt');

const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MINUTES = 15;

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: maxAgeMs,
});

async function logAction(userId, action, req) {
  await prisma.auditLog.create({
    data: { userId, action, ip: req.ip },
  });
}

async function register(req, res) {
  const { email, password, nom, prenom, telephone, whatsapp } = req.body;

  if (!email || !password || !nom || !prenom || !telephone) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }
  if (!isPasswordStrongEnough(password)) {
    return res.status(400).json({ error: 'Mot de passe trop faible (8 caractères min., lettres et chiffres).' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });
  }

  const parentRole = await prisma.role.findUnique({ where: { name: 'PARENT' } });
  if (!parentRole) {
    return res.status(500).json({ error: 'Rôle PARENT introuvable. Avez-vous lancé le seed ?' });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      roleId: parentRole.id,
      parent: {
        create: { nom, prenom, telephone, whatsapp },
      },
    },
    include: { role: true },
  });

  await logAction(user.id, 'REGISTER', req);

  return res.status(201).json({ message: 'Compte créé avec succès. Vous pouvez vous connecter.' });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail et mot de passe requis.' });
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

  const genericError = { error: 'E-mail ou mot de passe incorrect.' };
  if (!user || !user.isActive) {
    return res.status(401).json(genericError);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: `Compte temporairement verrouillé. Réessayez après ${user.lockedUntil.toLocaleTimeString('fr-FR')}.` });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    const failedLogins = user.failedLogins + 1;
    const shouldLock = failedLogins >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: shouldLock ? 0 : failedLogins,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) : null,
      },
    });
    await logAction(user.id, 'LOGIN_FAILED', req);
    return res.status(401).json(genericError);
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });

  const accessToken = signAccessToken(user);
  const { raw: refreshTokenRaw, hash: refreshTokenHash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: { tokenHash: refreshTokenHash, userId: user.id, expiresAt },
  });

  res.cookie('access_token', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refresh_token', refreshTokenRaw, cookieOptions(REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000));

  await logAction(user.id, 'LOGIN_SUCCESS', req);

  return res.json({
    user: { id: user.id, email: user.email, role: user.role.name },
  });
}

async function refresh(req, res) {
  const rawToken = req.cookies?.refresh_token;
  if (!rawToken) {
    return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter.' });
  }

  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter.' });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId }, include: { role: true } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Compte introuvable ou désactivé.' });
  }

  const accessToken = signAccessToken(user);
  res.cookie('access_token', accessToken, cookieOptions(15 * 60 * 1000));

  return res.json({ message: 'Session renouvelée.' });
}

async function logout(req, res) {
  const rawToken = req.cookies?.refresh_token;
  if (rawToken) {
    const tokenHash = hashRefreshToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return res.json({ message: 'Déconnecté.' });
}

module.exports = { register, login, refresh, logout };
