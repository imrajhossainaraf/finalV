/**
 * ============================================================
 *  ATTENDLY SERVER v2.5 (MVC RESTRUCTURED)
 *  Smart Attendance System Backend with MongoDB & Local Sync
 * ============================================================
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// MVC Imports
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/api');
const { startSyncWorker } = require('./src/services/syncService');
const Student = require('./src/models/Student');
const Device = require('./src/models/Device');

const app = express();
const PORT = process.env.PORT || 3001;

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../client/dist')));

// ROUTES
app.use('/api', apiRoutes);

// Root Route: Serve React App
app.get('/', (req, res) => {
 res.status(200).json({message: 'Attendly Backend is running', status: 'online', version: '2.5-MVC'});
});

// Health Check for Render/Monitoring
app.get('/status', (req, res) => {
  res.json({ service: 'Attendly Backend', status: 'online', version: '2.5-MVC' });
});

// Catch-all for React Router (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Database & Background Services
async function run() {
  await connectDB();
  
  // Seed mock data for science fair if DB is empty
  try {
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      console.log('🌱 Seeding mock data for Science Fair...');
      const mockStudents = [
        { uid: 'A1B2C3D4', name: 'John Doe', email: 'imrajhossainarafraf12@gmail.com', parent_email: 'parent.john@example.com', teacher_email: 'class.teacher@school.com', class: 'CS-101', roll_number: '01' },
        { uid: 'E5F6G7H8', name: 'Jane Smith', email: 'jane@example.com', parent_email: 'parent.jane@example.com', teacher_email: 'class.teacher@school.com', class: 'CS-101', roll_number: '02' }
      ];
      await Student.insertMany(mockStudents);
      
      const mockDevices = [
        { mac: 'AA:BB:CC:DD:EE:FF', name: 'Main Gate Scanner', location: 'Science Building Entrance' }
      ];
      await Device.insertMany(mockDevices);
    }
  } catch (err) {
    console.error('⚠️ Seeding failed:', err.message);
  }

  // Start the background sync worker (Cloud -> Local)
  // Disabled because we are now connected directly to Atlas
  // startSyncWorker();

  // Start Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Attendly Backend running at http://localhost:${PORT}`);
    console.log(`📡 Serving API routes at /api/` );
  });
}

run();
