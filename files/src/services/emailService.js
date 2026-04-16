const axios = require('axios');

const EMAIL_SERVICE_URL = 'http://localhost:5001/api';

/**
 * Triggers an attendance email via the local email service.
 */
const sendAttendanceEmail = async (student, device, timestamp) => {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}/send-attendance`, {
      student,
      device,
      timestamp
    });
    return true;
  } catch (err) {
    console.error('📧 Local Email Service failed (Attendance):', err.message);
    return false;
  }
};

/**
 * Triggers a notification email when a teacher adds/updates a note.
 */
const sendNoteNotification = async (student, note) => {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}/send-note`, {
      student,
      note
    });
    console.log(`📧 Note notification triggered for ${student.name}`);
    return true;
  } catch (err) {
    console.error('📧 Local Email Service failed (Note):', err.message);
    return false;
  }
};

/**
 * Triggers an exam result notification for a registered student.
 */
const sendExamResultNotification = async (student, exam) => {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}/send-exam-results`, {
      student,
      exam
    });
    console.log(`Exam result notification triggered for ${student.name}`);
    return true;
  } catch (err) {
    console.error('Local Email Service failed (Exam Results):', err.message);
    return false;
  }
};

/**
 * Triggers a school-wide notice email.
 */
const sendNoticeEmail = async (student, notice) => {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}/send-notice`, {
      student,
      notice
    });
    return true;
  } catch (err) {
    console.error('📧 Local Email Service failed (Notice):', err.message);
    return false;
  }
};

module.exports = {
  sendAttendanceEmail,
  sendNoteNotification,
  sendExamResultNotification,
  sendNoticeEmail
};
