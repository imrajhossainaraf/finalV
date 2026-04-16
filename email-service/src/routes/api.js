const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// ── ENDPOINTS ──
router.post('/send-attendance', emailController.sendAttendance);
router.post('/send-note', emailController.sendNoteAlert);
router.post('/send-bulk', emailController.sendBulk);
router.post('/send-manual', emailController.sendManual);
router.post('/send-exam-results', emailController.sendExamResults);
router.post('/send-notice', emailController.sendNotice);


module.exports = router;
