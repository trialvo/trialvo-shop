const express = require('express');
const multer = require('multer');
const router = express.Router();
const { agentAuth, agentAuthEmptyBody, registerAuth } = require('../middleware/agentAuth');
const {
    registerAgent,
    heartbeat,
    requestLease,
    ackCommand,
    getBackupUploadUrl,
    uploadBackupBlob,
    completeBackupUpload,
    downloadBackupBlob,
} = require('../controllers/agentController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 512 * 1024 * 1024 }, // 512MB
});

router.post('/register', registerAuth, registerAgent);
router.post('/heartbeat', agentAuth, heartbeat);
router.post('/lease', agentAuth, requestLease);
router.post('/commands/:id/ack', agentAuth, ackCommand);

// Backup upload (local = multipart blob; S3 would use upload-url only)
router.get('/backup/upload-url', agentAuthEmptyBody, getBackupUploadUrl);
router.post('/backup/upload-url', agentAuth, getBackupUploadUrl);
router.post('/backup/blob', agentAuthEmptyBody, upload.single('file'), uploadBackupBlob);
router.post('/backup/complete', agentAuth, completeBackupUpload);
router.get('/backup/:backupId/download', agentAuthEmptyBody, downloadBackupBlob);

module.exports = router;
