const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Device = require('../models/Device');
const { sendAttendanceEmail } = require('../services/emailService');

/**
 * Log a single scan (from ESP32 or Simulator)
 */
exports.logScan = async (req, res) => {
  let { mac, deviceName, uid, timestamp } = req.body;

  if (!mac || !uid || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Clock Guard: If timestamp is from the distant past (e.g. Year 2000), use server time
  const incomingDate = new Date(timestamp);
  if (isNaN(incomingDate.getTime()) || incomingDate.getFullYear() < 2024) {
    console.log(`🕒 Invalid/Old timestamp received (${timestamp}). Overriding with server time.`);
    timestamp = new Date().toISOString();
  }

  try {
    // 1. Update/Upsert Device
    await Device.findOneAndUpdate(
      { mac },
      { name: deviceName || 'Unknown Device', last_seen: new Date(timestamp) },
      { upsert: true, new: true }
    );

    // 2. Find Student (Check if active)
    let student = await Student.findOne({ uid, active: true });
    
    // If student not found or inactive, we still record as "Unknown" for security/audit
    if (!student) {
      student = await Student.findOneAndUpdate(
        { uid },
        { name: `Unknown-${uid}`, email: `unknown-${uid}@pending.com`, active: false },
        { upsert: true, new: true }
      );
    }

    // 3. Check for duplicates today (prevents double scans)
    const dateOnly = timestamp.split('T')[0];
    const startOfDay = new Date(dateOnly);
    const endOfDay = new Date(dateOnly);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({ 
      uid, 
      timestamp: { $gte: startOfDay, $lte: endOfDay } 
    });
    
    if (existing) {
      return res.json({ success: true, message: 'Already recorded today', student: student.name });
    }

    // 4. Create record
    const attendance = new Attendance({
      student_id: student._id,
      device_mac: mac,
      uid: uid,
      student_name: student.name,
      timestamp: new Date(timestamp)
    });

    await attendance.save();

    // 5. Async Email Notification (only for active students)
    if (student.active) {
      const deviceInfo = { name: deviceName || 'Scanner', location: 'Main Entrance' };
      sendAttendanceEmail(student, deviceInfo, timestamp).then(sent => {
        if (sent) {
          attendance.email_sent = true;
          attendance.save();
        }
      });
    }

    res.json({ success: true, student: student.name, timestamp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET attendance logs with filtering
 */
exports.getLogs = async (req, res) => {
  const { date, student_id } = req.query;
  const filter = {};

  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.timestamp = { $gte: startOfDay, $lte: endOfDay };
  }

  if (student_id) {
    filter.student_id = student_id;
  }

  try {
    const records = await Attendance.find(filter)
      .populate('student_id')
      .sort({ timestamp: -1 })
      .limit(1000);
    res.json({ attendance: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update email status (callback from local service sync)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { email_sent } = req.body;
    await Attendance.findByIdAndUpdate(id, { email_sent: !!email_sent });
    res.json({ success: true, message: 'Attendance status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Demo Reset (Purge all scans)
 */
exports.resetDemo = async (req, res) => {
  try {
    await Attendance.deleteMany({});
    res.json({ success: true, message: 'All demo logs cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
