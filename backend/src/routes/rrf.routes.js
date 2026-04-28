const express = require('express');
const router = express.Router();
const rrfController = require('../controllers/rrf.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', rrfController.createRRF);
router.get('/', rrfController.getRRFs);
router.get('/:id', rrfController.getRRFById);
router.put('/:id', rrfController.updateRRF);
router.delete('/:id', rrfController.deleteRRF);

module.exports = router;
