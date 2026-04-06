# 🚀 Attendly Server v2.0

Smart Attendance System Backend with automatic email notifications

## ✨ Features

- ✅ RESTful API for ESP32 devices
- ✅ SQLite database (zero configuration)
- ✅ **Automatic email notifications** when students scan in
- ✅ Student & device management
- ✅ Attendance tracking & reports
- ✅ Offline data sync support

---

## 📦 Installation

### 1. Install Node.js
Download from: https://nodejs.org (v14 or higher)

### 2. Install Dependencies
```bash
cd attendly-server
npm install
```

### 3. Configure Email (IMPORTANT!)

Open `server.js` and edit the **EMAIL_CONFIG** section (around line 65):

```javascript
const EMAIL_CONFIG = {
  enabled: true,  // Set to false to disable emails
  service: 'gmail',
  user: 'your-email@gmail.com',     // ← Your Gmail address
  password: 'your-app-password',     // ← Gmail App Password
  from: 'Attendly System <your-email@gmail.com>'
};
```

#### 🔐 How to get Gmail App Password:

1. Go to your Google Account: https://myaccount.google.com
2. Enable **2-Step Verification** (required!)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select **"Mail"** and your device
5. Copy the 16-character password
6. Paste it in `server.js` (no spaces)

**⚠️ Important:** Do NOT use your regular Gmail password!

---

## 🏃 Running the Server

```bash
npm start
```

You should see:
```
✅ Connected to SQLite database
✅ Database tables initialized
✅ Email service ready
🚀 Attendly Server v2.0 Running
📡 Server URL: http://localhost:3001
```

---

## 👥 Adding Students

### Method 1: Using API

```bash
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "A1B2C3D4",
    "name": "John Doe",
    "email": "john@example.com",
    "class": "CSE-2024",
    "roll_number": "2024001"
  }'
```

### Method 2: Using Browser Console

Open: http://localhost:3001

Open browser console (F12) and run:

```javascript
fetch('http://localhost:3001/api/students', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    uid: 'A1B2C3D4',
    name: 'John Doe',
    email: 'john@example.com',
    class: 'CSE-2024',
    roll_number: '2024001'
  })
}).then(r => r.json()).then(console.log);
```

---

## 📡 API Endpoints

### 1. Record Attendance (from ESP32)
```
POST /api/attendance
```
**Body:**
```json
{
  "mac": "AABBCCDDEEFF",
  "deviceName": "Main Gate Scanner",
  "uid": "A1B2C3D4",
  "timestamp": "2026-04-06T14:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance recorded",
  "student": "John Doe",
  "timestamp": "2026-04-06T14:30:00Z"
}
```

### 2. Batch Sync (from ESP32)
```
POST /api/sync
```
**Body:**
```json
{
  "mac": "AABBCCDDEEFF",
  "deviceName": "Main Gate Scanner",
  "logs": [
    {"uid": "A1B2C3D4", "timestamp": "2026-04-06T14:30:00Z"},
    {"uid": "E5F6G7H8", "timestamp": "2026-04-06T14:31:00Z"}
  ]
}
```

### 3. Get All Students
```
GET /api/students
```

### 4. Add/Update Student
```
POST /api/students
```
**Body:**
```json
{
  "uid": "A1B2C3D4",
  "name": "John Doe",
  "email": "john@example.com",
  "class": "CSE-2024",
  "roll_number": "2024001"
}
```

### 5. Get All Devices
```
GET /api/devices
```

### 6. Get Attendance Records
```
GET /api/attendance
GET /api/attendance?date=2026-04-06
GET /api/attendance?student_id=1
```

### 7. Get Statistics
```
GET /api/stats
```

**Response:**
```json
{
  "totalStudents": 25,
  "totalDevices": 2,
  "todayAttendance": 18,
  "totalAttendance": 342
}
```

---

## 📧 Email Notification

When a student scans their RFID card, they automatically receive an email like this:

**Subject:** ✅ Attendance Confirmed - April 06, 2026 at 02:30 PM

**Body:**
```
Hello John Doe,

Your attendance has been recorded successfully.

Student:      John Doe
Class:        CSE-2024
Roll Number:  2024001
Time:         April 06, 2026 at 02:30 PM
Location:     Main Gate Scanner (Main Building)
```

---

## 🗄️ Database Structure

The server uses SQLite with 3 tables:

### students
- `id` - Primary key
- `uid` - RFID card UID (unique)
- `name` - Student name
- `email` - Student email
- `class` - Class/section
- `roll_number` - Roll number
- `active` - 1 = active, 0 = inactive

### devices
- `id` - Primary key
- `mac` - ESP32 MAC address (unique)
- `name` - Device name
- `location` - Location description
- `last_seen` - Last sync timestamp

### attendance
- `id` - Primary key
- `student_id` - Foreign key to students
- `device_mac` - Device MAC address
- `uid` - RFID card UID
- `student_name` - Cached student name
- `timestamp` - Scan timestamp
- `email_sent` - 1 if email sent, 0 if not

---

## 🔧 Troubleshooting

### Email not sending?

1. **Check email config** in `server.js`
2. **Use App Password**, not regular password
3. **Enable 2-Step Verification** in Google Account
4. Check server logs for error messages

### Unknown UID?

If a student scans but isn't in the database:
- Server creates a placeholder: `Unknown-A1B2C3D4`
- Email is NOT sent
- Add the student later using POST /api/students

### Find your IP address:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address"

**Mac/Linux:**
```bash
ifconfig
ip addr
```

Use this IP in your ESP32 configuration!

---

## 🚀 Production Deployment

For production, consider:

1. Use **PM2** for auto-restart:
```bash
npm install -g pm2
pm2 start server.js --name attendly-server
pm2 save
pm2 startup
```

2. Use **PostgreSQL** or **MySQL** instead of SQLite
3. Set up **HTTPS** with SSL certificate
4. Use environment variables for sensitive config

---

## 📝 License

MIT License - Feel free to modify and use!

---

## 💡 Support

For issues or questions, check the server logs:
```bash
npm start
```

Look for lines starting with:
- ✅ = Success
- ❌ = Error
- 📧 = Email sent
- 📍 = Attendance received
