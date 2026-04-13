const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Device = require('../models/Device');

/**
 * Handle batch sync from hardware (Offline logs)
 */
exports.batchSync = async (req, res) => {
  const { mac, deviceName, logs } = req.body;

  if (!mac || !logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: 'Invalid sync data' });
  }

  try {
    // 1. Update Device
    await Device.findOneAndUpdate(
      { mac },
      { name: deviceName || 'Offline Scanner', last_seen: new Date() },
      { upsert: true }
    );

    let processed = 0;
    for (const log of logs) {
      const { uid, timestamp, time } = log;
      const finalTime = timestamp || time;
      if (!uid || !finalTime) continue;

      // Find student
      const student = await Student.findOne({ uid, active: true });
      if (!student) continue;

      // Duplicate check for this student on this date
      const dateOnly = finalTime.split('T')[0];
      const startOfDay = new Date(dateOnly);
      const endOfDay = new Date(dateOnly);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await Attendance.findOne({ 
        uid, 
        timestamp: { $gte: startOfDay, $lte: endOfDay } 
      });
      
      if (existing) continue;

      // Log record
      const attendance = new Attendance({
        student_id: student._id,
        device_mac: mac,
        uid,
        student_name: student.name,
        timestamp: new Date(finalTime)
      });
      await attendance.save();
      processed++;
    }
    
    res.json({ success: true, processed, total: logs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
