const express = require('express');
const router = express.Router();
const prfController = require('../controllers/prf.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', prfController.createPRF);
router.get('/', prfController.getPRFs);
router.get('/:id', prfController.getPRFById);
router.put('/:id', prfController.updatePRF);
router.delete('/:id', prfController.deletePRF);

module.exports = router;
