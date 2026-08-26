const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function isPasswordStrongEnough(plain) {
  return typeof plain === 'string' && plain.length >= 8 && /[a-zA-Z]/.test(plain) && /[0-9]/.test(plain);
}

module.exports = { hashPassword, verifyPassword, isPasswordStrongEnough };
