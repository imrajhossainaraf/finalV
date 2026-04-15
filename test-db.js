const mongoose = require('mongoose');
require('dotenv').config({ path: './files/.env' });

async function testConnection() {
  const uri = process.env.MONGO_URI;
  console.log('Testing connection to:', uri.replace(/:([^@]+)@/, ':****@'));
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Success! Connected to MongoDB Atlas.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: This usually means your IP address is not whitelisted in MongoDB Atlas.');
    }
    process.exit(1);
  }
}

testConnection();
