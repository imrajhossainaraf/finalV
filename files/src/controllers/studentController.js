const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { sendNoteNotification } = require('../services/emailService');

/**
 * GET all students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ created_at: -1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST (Create or Update) student
 */
exports.upsertStudent = async (req, res) => {
  const { uid, name, email, parent_email, teacher_email, class: studentClass, roll_number, notes } = req.body;

  try {
    // Check for existing to see if notes changed
    const existingStudent = await Student.findOne({ uid });
    
    const updatedStudent = await Student.findOneAndUpdate(
      { uid },
      { name, email, parent_email, teacher_email, class: studentClass, roll_number, notes, active: true },
      { upsert: true, new: true }
    );

    // TRIGGER NOTIFICATION: Only if notes are provided and they are DIFFERENT from existing
    if (notes && (!existingStudent || existingStudent.notes !== notes)) {
      // Send notification to Student and Teacher (as requested)
      sendNoteNotification(updatedStudent, notes);
    }

    res.json({ success: true, message: 'Student information updated', student: updatedStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET single student by UID
 */
exports.getStudentByUid = async (req, res) => {
  try {
    const student = await Student.findOne({ uid: req.params.uid });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE single student by UID and clear their logs
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ uid: req.params.uid });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Delete all attendance records tied to this student
    await Attendance.deleteMany({ student_id: student._id });

    // Delete the student profile
    await Student.findByIdAndDelete(student._id);

    res.json({ success: true, message: 'Student and past logs deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET students by parent email (Security restricted)
 */
exports.getStudentsByParentEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Parent email is required' });

  try {
    const students = await Student.find({ parent_email: email, active: true })
      .select('name class roll_number uid');
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found associated with this email.' });
    }

    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET detailed student report for AI automated reply
 */
exports.getStudentDetailedReport = async (req, res) => {
  const { name, parent_email } = req.query;

  if (!name || !parent_email) {
    return res.status(400).json({ error: 'Name and Parent Email are required for security.' });
  }

  try {
    // Security Check: Find student with this name AND linked to this parent email
    const student = await Student.findOne({
      name: { $regex: new RegExp(name, 'i') },
      parent_email: parent_email,
      active: true
    });

    if (!student) {
      return res.status(404).json({ message: 'No matching student found for your account.' });
    }

    // Get today's status and recent logs
    const logs = await Attendance.find({ student_id: student._id })
      .sort({ timestamp: -1 })
      .limit(5);

    const todayStr = new Date().toDateString();
    const attendedToday = logs.some(l => new Date(l.timestamp).toDateString() === todayStr);

    res.json({
      student: {
        name: student.name,
        class: student.class,
        notes: student.notes
      },
      status: {
        is_present_today: attendedToday,
        last_scan: logs[0] ? logs[0].timestamp : 'None recorded',
        recent_logs: logs
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
