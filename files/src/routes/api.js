const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const attendanceController = require('../controllers/attendanceController');
const syncController = require('../controllers/syncController');
const systemController = require('../controllers/systemController');

// ── STUDENTS ──
router.get('/students', studentController.getAllStudents);
router.post('/students', studentController.upsertStudent);
router.get('/students/:uid', studentController.getStudentByUid);
router.delete('/students/:uid', studentController.deleteStudent);
router.get('/students/parent/lookup', studentController.getStudentsByParentEmail);
router.get('/students/parent/report', studentController.getStudentDetailedReport);

// ── ATTENDANCE ──
router.post('/attendance', attendanceController.logScan);
router.get('/attendance', attendanceController.getLogs);
router.patch('/attendance/:id/status', attendanceController.updateStatus);
router.delete('/attendance', attendanceController.resetDemo);

// ── SYNC ──
router.post('/sync', syncController.batchSync);

// ── SYSTEM / DASHBOARD ──
router.get('/devices', systemController.getDevices);
router.get('/stats', systemController.getStats);
router.post('/inquiry/lookup', systemController.lookupInquiry);

module.exports = router;
