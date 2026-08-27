const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET manquant dans les variables d\'environnement.');
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role.name },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateRefreshToken() {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}

function hashRefreshToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_DAYS,
};
