const express = require('express');
const router = express.Router();

const { getMesEnfants, getMonEnfantById } = require('../controllers/parentPortalController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/mes-enfants', requireAuth, requireRole(['PARENT']), getMesEnfants);
router.get('/mes-enfants/:id', requireAuth, requireRole(['PARENT']), getMonEnfantById);

module.exports = router;
