const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfp.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', rfpController.createRFP);
router.get('/', rfpController.getRFPs);
router.get('/:id', rfpController.getRFPById);
router.put('/:id', rfpController.updateRFP);
router.delete('/:id', rfpController.deleteRFP);

module.exports = router;
