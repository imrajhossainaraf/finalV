const Student = require('../models/Student');
const Device = require('../models/Device');
const Attendance = require('../models/Attendance');

/**
 * GET hardware devices list
 */
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ last_seen: -1 });
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET dashboard statistics
 */
exports.getStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ active: true });
    const totalDevices = await Device.countDocuments();
    
    const dateParam = req.query.date || new Date().toISOString().split('T')[0];
    const startOfTarget = new Date(dateParam);
    const endOfTarget = new Date(dateParam);
    endOfTarget.setHours(23, 59, 59, 999);

    const todayAttendanceRecords = await Attendance.distinct('uid', {
      timestamp: { $gte: startOfTarget, $lte: endOfTarget }
    });
    const todayAttendance = todayAttendanceRecords.length;

    const totalAttendance = await Attendance.countDocuments();

    res.json({
      totalStudents,
      totalDevices,
      todayAttendance,
      totalAttendance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Inquiry Lookup for N8N / AI Service
 */
exports.lookupInquiry = async (req, res) => {
  const { name, roll_number, class: studentClass } = req.body;

  if (!name || !roll_number || !studentClass) {
    return res.status(400).json({ error: 'Name, Roll, and Class are required' });
  }

  try {
    const student = await Student.findOne({
      name: { $regex: new RegExp(name, 'i') },
      roll_number,
      class: studentClass,
      active: true
    });

    if (!student) {
      return res.status(404).json({ message: 'No student found with these credentials.' });
    }

    // Get attendance profile
    const logs = await Attendance.find({ student_id: student._id }).sort({ timestamp: -1 }).limit(10);
    const hasAttendedToday = logs.some(l => 
      new Date(l.timestamp).toDateString() === new Date().toDateString()
    );

    res.json({
      found: true,
      student: {
        name: student.name,
        class: student.class,
        roll: student.roll_number,
        notes: student.notes
      },
      status: {
        present_today: hasAttendedToday,
        last_seen: logs[0] ? logs[0].timestamp : 'Never',
        total_logs: logs.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
