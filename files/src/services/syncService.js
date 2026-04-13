const axios = require('axios');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Device = require('../models/Device');

const RENDER_URL = 'https://finalv.onrender.com';
const SYNC_INTERVAL = 10000; // 10 seconds for real-time demo

/**
 * The background worker that pulls data from Render to Local MongoDB
 */
const startSyncWorker = () => {
  console.log(`🔄 Sync Worker initialized. Interval: ${SYNC_INTERVAL/1000}s`);
  
  setInterval(async () => {
    try {
      // 1. Fetch from Cloud
      const response = await axios.get(`${RENDER_URL}/api/attendance`);
      const cloudLogs = response.data.attendance || [];
      
      if (cloudLogs.length === 0) return;

      let newRecords = 0;
      for (const log of cloudLogs) {
        // Check if exists locally
        const existing = await Attendance.findOne({ 
          uid: log.uid, 
          timestamp: new Date(log.timestamp) 
        });

        if (!existing) {
          // Find/Update local student
          const student = await Student.findOne({ uid: log.uid });
          
          const newRecord = new Attendance({
            student_id: student ? student._id : null,
            device_mac: log.device_mac || 'RENDER-CLOUD',
            uid: log.uid,
            student_name: log.student_name || 'Unknown',
            timestamp: new Date(log.timestamp),
            email_sent: log.email_sent || false
          });
          
          await newRecord.save();
          newRecords++;
        }
      }
      
      if (newRecords > 0) {
        console.log(`✅ Sync Completed: Imported ${newRecords} new records from cloud.`);
      }
    } catch (err) {
      console.error('❌ Sync Worker failed:', err.message);
    }
  }, SYNC_INTERVAL);
};

module.exports = { startSyncWorker };
