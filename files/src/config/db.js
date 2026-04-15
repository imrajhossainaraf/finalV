const mongoose = require('mongoose');

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendly';
  try {
    await mongoose.connect(MONGO_URI, { family: 4 });
    console.log('✅ Connected to MongoDB at', MONGO_URI);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
