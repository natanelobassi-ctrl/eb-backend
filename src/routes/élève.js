const express = require('express');
const router = express.Router();

const {
  createEleve,
  listEleves,
  getEleveById,
  linkParentToEleve,
} = require('../controllers/eleveController');
const { requireAuth, requireRole } = require('../middleware/auth');

const ADMIN_ROLES = ['SUPER_ADMIN', 'DIRECTION', 'ADMIN_SCOLAIRE'];

router.get('/', requireAuth, requireRole(ADMIN_ROLES), listEleves);
router.get('/:id', requireAuth, requireRole(ADMIN_ROLES), getEleveById);
router.post('/', requireAuth, requireRole(ADMIN_ROLES), createEleve);
router.post('/lier-parent', requireAuth, requireRole(ADMIN_ROLES), linkParentToEleve);

module.exports = router;
