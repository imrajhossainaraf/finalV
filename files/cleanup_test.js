const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
const Attendance = require('./src/models/Attendance');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const targetDate = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const result = await Attendance.deleteMany({
      uid: 'A1B2C3D4',
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    console.log(`Deleted today's records for A1B2C3D4. Count: ${result.deletedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  }
}

run();
