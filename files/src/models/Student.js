const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  uid: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true }, // Student/Main email
  parent_email: { type: String },
  teacher_email: { type: String },
  class: { type: String },
  roll_number: { type: String },
  notes: { type: String, default: '' },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
