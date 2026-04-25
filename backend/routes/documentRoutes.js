const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const protect = require('../middleware/protect');
const uploadPdf = require('../middleware/uploadPdf');

router.use(protect);

router.post('/', uploadPdf.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocument);
router.get('/:id/download', documentController.downloadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
