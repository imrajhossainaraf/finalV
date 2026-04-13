const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  device_mac: { type: String, required: true },
  uid: { type: String, required: true },
  student_name: { type: String },
  timestamp: { type: Date, required: true },
  email_sent: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
