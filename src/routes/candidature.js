const express = require('express');
const router = express.Router();

const {
  creerCandidature,
  maCandidature,
  listCandidatures,
  updateStatutCandidature,
} = require('../controllers/candidatureController');
const { requireAuth, requireRole } = require('../middleware/auth');

const ADMIN_ROLES = ['SUPER_ADMIN', 'DIRECTION', 'ADMIN_SCOLAIRE'];

router.post('/', requireAuth, requireRole(['CANDIDAT']), creerCandidature);
router.get('/ma-candidature', requireAuth, requireRole(['CANDIDAT']), maCandidature);
router.get('/', requireAuth, requireRole(ADMIN_ROLES), listCandidatures);
router.patch('/:id/statut', requireAuth, requireRole(ADMIN_ROLES), updateStatutCandidature);

module.exports = router;
