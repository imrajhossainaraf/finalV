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
  exam_records: {
    type: [
      {
        exam_type: { type: String, default: 'final' },
        exam_name: { type: String, required: true },
        week_label: { type: String, default: '' },
        published_at: { type: Date, default: Date.now },
        sent_at: { type: Date, default: null },
        subjects: {
          type: [
            {
              subject: { type: String, required: true },
              marks: { type: Number, required: true },
              total_marks: { type: Number, default: 100 }
            }
          ],
          default: []
        }
      }
    ],
    default: []
  },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
