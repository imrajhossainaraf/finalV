/**
 * ============================================================
 *  ATTENDLY SERVER v2.0
 *  Smart Attendance System Backend with Email Notifications
 * ============================================================
 */

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const moment = require('moment-timezone');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../client/dist')));

// ============================================================
//  DATABASE SETUP
// ============================================================
const dbPath = path.join(__dirname, 'attendly.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at', dbPath);
    initDatabase();
  }
});

function initDatabase() {
  // Students table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    class TEXT,
    roll_number TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Devices table
  db.run(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mac TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    device_mac TEXT NOT NULL,
    uid TEXT NOT NULL,
    student_name TEXT,
    timestamp DATETIME NOT NULL,
    email_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('✅ Database tables initialized');
}

// ============================================================
//  EMAIL CONFIGURATION
// ============================================================
// CONFIGURE YOUR EMAIL HERE:
const EMAIL_CONFIG = {
  enabled: true,  // Set to false to disable email sending
  service: 'gmail',  // 'gmail', 'outlook', 'yahoo', etc.
  user: 'imrajhossainaraf12@gmail.com',  // Your email address
  password: 'gepw jorg gare hlgo',  // Gmail App Password (not regular password)
  from: 'Attendly System <imrajhossainaraf12@gmail.com>'
};

let transporter = null;

function initEmailTransporter() {
  if (!EMAIL_CONFIG.enabled) {
    console.log('⚠️  Email notifications DISABLED');
    return;
  }

  transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.password
    }
  });

  // Test email connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
      console.log('💡 To enable emails:');
      console.log('   1. Use Gmail App Password (not regular password)');
      console.log('   2. Enable 2FA and create App Password at: https://myaccount.google.com/apppasswords');
    } else {
      console.log('✅ Email service ready');
    }
  });
}

async function sendAttendanceEmail(student, device, timestamp) {
  if (!EMAIL_CONFIG.enabled || !transporter) return false;

  const formattedTime = moment(timestamp).format('MMMM DD, YYYY [at] hh:mm A');
  
  const mailOptions = {
    from: EMAIL_CONFIG.from,
    to: student.email,
    subject: '✅ Attendance Confirmed - ' + formattedTime,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">✅ Attendance Confirmed</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${student.name}</strong>,</p>
          <p style="font-size: 14px; color: #666;">Your attendance has been recorded successfully.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr>
                <td style="padding: 8px 0;"><strong>Student:</strong></td>
                <td>${student.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Class:</strong></td>
                <td>${student.class || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Roll Number:</strong></td>
                <td>${student.roll_number || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Time:</strong></td>
                <td>${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Location:</strong></td>
                <td>${device.name} (${device.location || 'Main Building'})</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            This is an automated message from Attendly Attendance System.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${student.email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
}

// ============================================================
//  API ENDPOINTS
// ============================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Attendly Server v2.0',
    status: 'running',
    endpoints: {
      attendance: 'POST /api/attendance',
      sync: 'POST /api/sync',
      students: 'GET/POST /api/students',
      devices: 'GET /api/devices'
    }
  });
});

// ── ATTENDANCE ENDPOINT (Single scan from ESP32) ──
app.post('/api/attendance', async (req, res) => {
  const { mac, deviceName, uid, timestamp } = req.body;

  if (!mac || !uid || !timestamp) {
    console.log('⚠️  Invalid attendance request:', req.body);
    return res.status(400).json({ error: 'Missing required fields: mac, uid, or timestamp' });
  }

  console.log(`📍 [Real-time] UID=${uid} from ${deviceName || mac}`);
  processAttendanceRecord(mac, deviceName, uid, timestamp, res);
});

// ── SYNC ENDPOINT (Batch offline data from ESP32) ──
app.post('/api/sync', async (req, res) => {
  const { mac, deviceName, logs } = req.body;

  if (!mac || !logs || !Array.isArray(logs)) {
    console.log('⚠️  Invalid sync request from:', mac);
    return res.status(400).json({ error: 'Invalid sync data: logs must be an array' });
  }

  console.log(`🔄 [Batch Sync] ${logs.length} records from ${deviceName || mac}`);

  // Update device last_seen
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO devices (mac, name, last_seen) VALUES (?, ?, ?)
     ON CONFLICT(mac) DO UPDATE SET last_seen = ?, name = COALESCE(?, name)`,
    [mac, deviceName || 'Unknown Device', now, now, deviceName]
  );

  let processed = 0;
  let errors = 0;

  for (const log of logs) {
    const { uid, timestamp, time } = log;
    const finalTime = timestamp || time;
    
    if (!uid || !finalTime) {
      errors++;
      continue;
    }

    try {
      await new Promise((resolve, reject) => {
        db.get('SELECT * FROM students WHERE uid = ? AND active = 1', [uid], (err, student) => {
          if (err) return reject(err);
          
          const studentId = student ? student.id : null;
          const studentName = student ? student.name : `Unknown-${uid}`;

          const dateOnly = finalTime.split('T')[0];
          db.get('SELECT id FROM attendance WHERE uid = ? AND DATE(timestamp) = DATE(?)', [uid, dateOnly], (err, existing) => {
            if (existing) {
              // Already recorded today, skip
              processed++;
              return resolve();
            }

            db.run(
              `INSERT INTO attendance (student_id, device_mac, uid, student_name, timestamp, email_sent)
               VALUES (?, ?, ?, ?, ?, 0)`,
              [studentId, mac, uid, studentName, finalTime],
              function(err) {
                if (err) return reject(err);
                processed++;
                
                // Async email sending (don't block the loop)
                if (student && student.active) {
                  const deviceInfo = { name: deviceName || 'Scanner', location: 'Unknown' };
                  sendAttendanceEmail(student, deviceInfo, finalTime).then(sent => {
                    if (sent) db.run('UPDATE attendance SET email_sent = 1 WHERE id = ?', [this.lastID]);
                  });
                }
                resolve();
              }
            );
          });
        });
      });
    } catch (e) {
      console.error('❌ Error processing sync record:', e.message);
      errors++;
    }
  }

  res.json({ success: true, processed, errors, total: logs.length });
});

async function processAttendanceRecord(mac, deviceName, uid, timestamp, res) {
  // Update device
  db.run(
    `INSERT INTO devices (mac, name, last_seen) VALUES (?, ?, ?)
     ON CONFLICT(mac) DO UPDATE SET last_seen = ?, name = COALESCE(?, name)`,
    [mac, deviceName || 'Unknown Device', timestamp, timestamp, deviceName]
  );

  db.get('SELECT * FROM students WHERE uid = ? AND active = 1', [uid], (err, student) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const studentId = student ? student.id : null;
    const studentName = student ? student.name : `Unknown-${uid}`;

    if (!student) {
      db.run('INSERT OR IGNORE INTO students (uid, name, email, active) VALUES (?, ?, ?, 0)',
        [uid, `Unknown-${uid}`, `unknown-${uid}@pending.com`]);
    }

    // Check if already exist today
    const dateOnly = timestamp.split('T')[0]; // Extract YYYY-MM-DD
    db.get('SELECT id FROM attendance WHERE uid = ? AND DATE(timestamp) = DATE(?)', [uid, dateOnly], (err, existing) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (existing) {
        // Already recorded today, ignore duplicate
        return res.json({ success: true, message: 'Already recorded today', student: studentName, timestamp });
      }

      db.run(
        `INSERT INTO attendance (student_id, device_mac, uid, student_name, timestamp, email_sent)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [studentId, mac, uid, studentName, timestamp],
        async function(err) {
          if (err) return res.status(500).json({ error: 'Failed to record' });

          const attendanceId = this.lastID;
          if (student && student.active) {
            const deviceInfo = { name: deviceName || 'Scanner', location: 'Unknown' };
            const sent = await sendAttendanceEmail(student, deviceInfo, timestamp);
            if (sent) db.run('UPDATE attendance SET email_sent = 1 WHERE id = ?', [attendanceId]);
          }

          res.json({ success: true, student: studentName, timestamp });
        }
      );
    });
  });
}


// ── STUDENTS API ──
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ students: rows });
  });
});

app.post('/api/students', (req, res) => {
  const { uid, name, email, class: studentClass, roll_number } = req.body;

  if (!uid || !name || !email) {
    return res.status(400).json({ error: 'UID, name, and email are required' });
  }

  db.run(
    `INSERT INTO students (uid, name, email, class, roll_number, active)
     VALUES (?, ?, ?, ?, ?, 1)
     ON CONFLICT(uid) DO UPDATE SET 
       name = ?, email = ?, class = ?, roll_number = ?, active = 1`,
    [uid, name, email, studentClass, roll_number, name, email, studentClass, roll_number],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        message: 'Student added/updated',
        id: this.lastID
      });
    }
  );
});

// ── DEVICES API ──
app.get('/api/devices', (req, res) => {
  db.all('SELECT * FROM devices ORDER BY last_seen DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ devices: rows });
  });
});

// ── ATTENDANCE RECORDS API ──
app.get('/api/attendance', (req, res) => {
  const { date, student_id } = req.query;
  
  let query = `
    SELECT a.*, s.name as student_name, s.email, s.class, d.name as device_name
    FROM attendance a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN devices d ON a.device_mac = d.mac
  `;
  
  const conditions = [];
  const params = [];
  
  if (date) {
    conditions.push("DATE(a.timestamp) = ?");
    params.push(date);
  }
  
  if (student_id) {
    conditions.push("a.student_id = ?");
    params.push(student_id);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY a.timestamp DESC LIMIT 1000';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ attendance: rows });
  });
});

// ── STATISTICS API ──
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  // Total students
  db.get('SELECT COUNT(*) as count FROM students WHERE active = 1', (err, row) => {
    stats.totalStudents = row ? row.count : 0;
    
    // Total devices
    db.get('SELECT COUNT(*) as count FROM devices', (err, row) => {
      stats.totalDevices = row ? row.count : 0;
      
      // Today's attendance
      db.get(
        `SELECT COUNT(*) as count FROM attendance 
         WHERE DATE(timestamp) = DATE('now')`,
        (err, row) => {
          stats.todayAttendance = row ? row.count : 0;
          
          // Total attendance
          db.get('SELECT COUNT(*) as count FROM attendance', (err, row) => {
            stats.totalAttendance = row ? row.count : 0;
            res.json(stats);
          });
        }
      );
    });
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  }
});

// ============================================================
//  SERVER START
// ============================================================
function startServer() {
  initEmailTransporter();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('  🚀 Attendly Server v2.0 Running');
    console.log('========================================');
    console.log(`  📡 Server URL: http://localhost:${PORT}`);
    console.log(`  🌐 Network URL: http://<your-ip>:${PORT}`);
    console.log('========================================');
    console.log('\n📍 API Endpoints:');
    console.log(`  POST /api/attendance  - Record attendance`);
    console.log(`  POST /api/sync        - Batch sync offline data`);
    console.log(`  GET  /api/students    - List students`);
    console.log(`  POST /api/students    - Add/update student`);
    console.log(`  GET  /api/devices     - List devices`);
    console.log(`  GET  /api/attendance  - Get attendance records`);
    console.log(`  GET  /api/stats       - Get statistics`);
    console.log('\n✅ Server ready to receive attendance data!\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
}); 

// Start the server
startServer();
