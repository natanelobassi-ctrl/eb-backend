const express = require('express');
const router = express.Router();

const { register, login, refresh, logout } = require('../controllers/authController');
const { loginRateLimiter, registerRateLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');
const prisma = require('../utils/prisma');

router.post('/register', registerRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { role: true, parent: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  return res.json({
    id: user.id,
    email: user.email,
    role: user.role.name,
    parent: user.parent,
  });
});

module.exports = router;
