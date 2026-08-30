const express = require('express');
const router = express.Router();

const { createClasse, listClasses } = require('../controllers/classeController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, listClasses);
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'DIRECTION', 'ADMIN_SCOLAIRE']), createClasse);

module.exports = router;
