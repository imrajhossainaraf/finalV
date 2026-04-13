const nodemailer = require('nodemailer');
const moment = require('moment-timezone');

const EMAIL_CONFIG = {
  service: 'gmail',
  user: 'imrajhossainaraf12@gmail.com',
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

/**
 * Helper to consolidate recipients (Student, Parent, Teacher)
 */
const getRecipients = (student) => {
  const list = [student.email, student.parent_email, student.teacher_email].filter(Boolean);
  // Remove duplicates and join
  return [...new Set(list)].join(',');
};

/**
 * POST /api/send-attendance
 */
exports.sendAttendance = async (req, res) => {
  const { student, device, timestamp } = req.body;
  if (!student) return res.status(400).json({ error: 'Student details missing' });

  const formattedTime = moment(timestamp).format('MMMM DD, YYYY [at] hh:mm A');
  const recipients = getRecipients(student);

  const mailOptions = {
    from: EMAIL_CONFIG.from,
    to: recipients,
    subject: `✅ Attendance Confirmed - ${student.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: #4f46e5; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Check-in Confirmed</h1>
        </div>
        <div style="padding: 32px; color: #333; line-height: 1.6;">
          <p>Hello,</p>
          <p>This is an automated confirmation that <strong>${student.name}</strong> has been recorded in the attendance system.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #f3f4f6;">
            <p style="margin: 0 0 10px 0;"><strong>Student:</strong> ${student.name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Class:</strong> ${student.class || 'N/A'}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 0;"><strong>Scanner:</strong> ${device?.name || 'Main Hallway'}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 32px; border-top: 1px solid #eee; padding-top: 20px;">
            Attendly Smart Monitoring &copy; 2026
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, to: recipients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/send-note (NEW FEATURE)
 */
exports.sendNoteAlert = async (req, res) => {
  const { student, note } = req.body;
  if (!student) return res.status(400).json({ error: 'Student details missing' });

  // For behavioral notes, we send to Student and Teacher (as requested)
  const recipients = [student.email, student.teacher_email].filter(Boolean).join(',');

  const mailOptions = {
    from: EMAIL_CONFIG.from,
    to: recipients,
    subject: `📝 New Remark Recorded: ${student.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fbbf24; border-radius: 12px; overflow: hidden;">
        <div style="background: #fbbf24; color: #78350f; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Behavioral / Academic Note</h1>
        </div>
        <div style="padding: 32px; color: #333; line-height: 1.6;">
          <p>Hello,</p>
          <p>A new behavioral or academic remark has been added to the profile of <strong>${student.name}</strong>.</p>
          <div style="background: #fffbeb; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #fef3c7; font-style: italic; color: #92400e;">
            "${note}"
          </div>
          <p style="font-size: 14px; color: #4b5563;">
            Teachers use these notes to track performance and classroom behavior. No action is required unless specified above.
          </p>
          <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 32px; border-top: 1px solid #eee; padding-top: 20px;">
            Attendly Parent-Teacher Portal
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, to: recipients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/send-bulk
 */
exports.sendBulk = async (req, res) => {
  const { students, date } = req.body;
  if (!students || !Array.isArray(students)) return res.status(400).json({ error: 'No students provided' });

  const formattedDate = moment(date).format('MMMM DD, YYYY');
  let sent = 0;

  for (const s of students) {
    const recipients = getRecipients(s);
    const hasAttended = s.hasAttended;

    try {
      await transporter.sendMail({
        from: EMAIL_CONFIG.from,
        to: recipients,
        subject: `${hasAttended ? '✅' : '❌'} Attendance Alert: ${formattedDate}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid ${hasAttended ? '#10b981' : '#ef4444'}; border-radius: 12px; overflow: hidden;">
            <div style="background: ${hasAttended ? '#10b981' : '#ef4444'}; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">Daily Status Report</h1>
            </div>
            <div style="padding: 32px; color: #333;">
              <p>Student: <strong>${s.name}</strong></p>
              <p>Date: <strong>${formattedDate}</strong></p>
              <p>Status: <strong style="color: ${hasAttended ? '#059669' : '#dc2626'}">${hasAttended ? 'PRESENT' : 'ABSENT'}</strong></p>
            </div>
          </div>
        `
      });
      sent++;
    } catch (err) { console.error(`Failed bulk for ${s.name}:`, err.message); }
  }

  res.json({ success: true, totals: students.length, sent });
};

/**
 * POST /api/send-manual
 */
exports.sendManual = async (req, res) => {
  const { student, message } = req.body;
  const recipients = getRecipients(student);

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `📢 Attendly Notification - ${student.name}`,
      html: `<div style="padding: 24px; font-family: sans-serif;">${message}</div>`
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
