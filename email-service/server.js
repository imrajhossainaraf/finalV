/**
 * ============================================================
 *  ATTENDLY LOCAL EMAIL SERVICE v1.0
 *  Processes email notifications locally for better speed.
 * ============================================================
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// EMAIL CONFIGURATION
const EMAIL_CONFIG = {
  service: 'gmail',
  user: 'imrajhossainaraf12@gmail.com',  // Hardcoded as requested from files/server.js
  password: 'gepw jorg gare hlgo',       // Gmail App Password
  from: 'Attendly System <imrajhossainaraf12@gmail.com>'
};

const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.password
  }
});

// Verify email service
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
  } else {
    console.log('✅ Local Email service ready');
  }
});

// ROUTES

// Root health check
app.get('/', (req, res) => {
  res.json({ service: 'Attendly Local Email Service', status: 'running' });
});

// Send Attendance Email
app.post('/api/send-attendance', async (req, res) => {
  const { student, device, timestamp } = req.body;

  if (!student || !student.email) {
    return res.status(400).json({ error: 'Student details missing email' });
  }

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
                <td>${device?.name || 'Main Scanner'} (${device?.location || 'Main Building'})</td>
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
    res.json({ success: true, message: `Email sent to ${student.email}` });
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send Bulk Notice (Broadcast)
app.post('/api/send-bulk', async (req, res) => {
  const { students, date } = req.body;

  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ error: 'Students array required' });
  }

  console.log(`🔄 Starting bulk delivery for ${students.length} students...`);
  
  let sentCount = 0;
  let failCount = 0;

  for (const student of students) {
    // Basic logic for present/absent from request body
    const hasAttended = student.hasAttended;
    const formattedDateStr = moment(date).format('MMMM DD, YYYY');
    
    const subject = hasAttended 
      ? `✅ Attendance Status: Present - ${formattedDateStr}`
      : `❌ Attendance Status: Absent - ${formattedDateStr}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${hasAttended ? '#667eea, #764ba2' : '#ea6666, #a24b4b'}); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Daily Attendance Notice</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${student.name}</strong>,</p>
          
          ${hasAttended 
            ? `<p style="font-size: 14px; color: #666;">We have recorded your attendance for <strong>${formattedDateStr}</strong>.</p>`
            : `<p style="font-size: 14px; color: #666;">We noticed you were <strong>absent</strong> on <strong>${formattedDateStr}</strong>. Please ensure to attend or contact administration if this is an error.</p>`
          }
          
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
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td><strong>${hasAttended ? 'Present ✅' : 'Absent ❌'}</strong></td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            This is an automated message from Attendly Attendance System.
          </p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: EMAIL_CONFIG.from,
        to: student.email,
        subject,
        html: htmlBody
      });
      sentCount++;
    } catch (error) {
      console.error(`❌ Failed notice to ${student.email}:`, error.message);
      failCount++;
    }
  }

  res.json({ success: true, stats: { total: students.length, sent: sentCount, failed: failCount } });
});

// Send Manual Notice
app.post('/api/send-manual', async (req, res) => {
  const { student, message } = req.body;

  if (!student || !student.email) {
    return res.status(400).json({ error: 'Student details missing email' });
  }

  const subject = `📢 Attendly System - Important Notice`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">System Notification</h1>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${student.name}</strong>,</p>
        <p style="font-size: 14px; color: #666;">${message || 'This is a manual notification from the Attendly System regarding your profile or attendance.'}</p>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; pt: 10px;">
          This is an automated message requested by Attendly Administration.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: student.email,
      subject,
      html: htmlBody
    });
    console.log(`📧 Manual notice sent to ${student.email}`);
    res.json({ success: true, message: `Notice sent to ${student.email}` });
  } catch (error) {
    console.error('❌ Manual notice failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Local Email Service running on http://localhost:${PORT}`);
});
