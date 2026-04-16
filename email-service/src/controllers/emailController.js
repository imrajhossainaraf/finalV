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

const baseFooter = `
  <tr>
    <td style="padding: 0 40px 40px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center;">
            <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #64748b; line-height: 1.5; font-weight: 500;">
              Attendly Smart School System
            </p>
            <p style="margin: 4px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              This is an automated notification. Please do not reply to this email.
            </p>
            <p style="margin: 12px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #cbd5e1; line-height: 1.5; text-transform: uppercase; letter-spacing: 0.05em;">
              &copy; 2026 Attendly. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

function buildEmail(icon, title, subtitle, mainColor, accentColor, innerContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Attendly Notification</title>
  <!-- Keep styles simple and standard for maximum email client compatibility -->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        
        <!-- Subtle Branding -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
             <span style="font-family:'Georgia',serif;font-size:18px;font-weight:bold;color:#475569;letter-spacing:1px;text-transform:uppercase;">Attendly</span>
          </td>
        </tr>

        <!-- Main Card Container -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.05);border:1px solid #f1f5f9;border-top:6px solid ${mainColor};">

              
              <!-- Clean Formal Header -->
              <tr>
                <td style="padding:40px 48px;border-bottom:1px solid #f1f5f9;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                       <td width="48" style="padding-right:24px;vertical-align:top;">
                          <div style="width:48px;height:48px;border-radius:8px;background-color:${accentColor};display:flex;align-items:center;justify-content:center;text-align:center;">
                             <span style="font-size:24px;line-height:48px;">${icon}</span>
                          </div>
                       </td>
                       <td style="vertical-align:center;">
                          <h1 style="margin:0;font-size:22px;font-weight:600;color:#0f172a;letter-spacing:-0.01em;">${title}</h1>
                          <p style="margin:4px 0 0 0;font-size:15px;color:#64748b;">${subtitle}</p>
                       </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Dynamic Body -->
              <tr>
                <td style="padding:40px 48px;">
                  ${innerContent}
                </td>
              </tr>

              ${baseFooter}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// POST /api/send-attendance
// ─────────────────────────────────────────────
exports.sendAttendance = async (req, res) => {
  const { student, device, timestamp } = req.body;
  if (!student) return res.status(400).json({ error: 'Student details missing' });

  const formattedTime = moment(timestamp).tz('Asia/Dhaka').format('hh:mm A');
  const formattedDate = moment(timestamp).tz('Asia/Dhaka').format('dddd, MMMM D, YYYY');
  const recipients = getRecipients(student);

  const innerContent = `
    <p style="margin:0 0 32px 0;font-size:16px;color:#334155;line-height:1.6;">
      Dear Parent/Guardian,<br><br>
      This is an automated confirmation that <strong>${student.name}</strong> was successfully recorded in the attendance system today.
    </p>

    <!-- Formal Details Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:32px;">
      <tr>
        <td style="padding:24px;">
           <table width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr>
               <td style="padding-bottom:16px;">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Student</span><br>
                  <span style="font-size:16px;color:#1e293b;font-weight:500;">${student.name}</span>
               </td>
               <td style="padding-bottom:16px;">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Class</span><br>
                  <span style="font-size:16px;color:#1e293b;font-weight:500;">${student.class || 'N/A'}</span>
               </td>
             </tr>
             <tr>
               <td style="padding-bottom:16px;">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Date</span><br>
                  <span style="font-size:16px;color:#1e293b;font-weight:500;">${formattedDate}</span>
               </td>
               <td style="padding-bottom:16px;">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Time</span><br>
                  <span style="font-size:16px;color:#1e293b;font-weight:500;color:#2563eb;">${formattedTime}</span>
               </td>
             </tr>
             <tr>
               <td colspan="2">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Location Logged</span><br>
                  <span style="font-size:16px;color:#1e293b;font-weight:500;">${device?.name || 'Main Hallway'}</span>
               </td>
             </tr>
           </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;border-top:1px dashed #e2e8f0;padding-top:24px;">
      If you have any questions or did not expect this notification, please contact the administration office immediately.
    </p>
  `;

  const html = buildEmail('✓', 'Attendance Confirmation', 'Daily check-in successful', '#2563eb', '#eff6ff', innerContent);

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `Attendance Confirmation: ${student.name} - ${formattedDate}`,
      html
    });
    res.json({ success: true, to: recipients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/send-note
// ─────────────────────────────────────────────
exports.sendNoteAlert = async (req, res) => {
  const { student, note } = req.body;
  if (!student) return res.status(400).json({ error: 'Student details missing' });

  const recipients = [student.email, student.teacher_email].filter(Boolean).join(',');

  const innerContent = `
    <p style="margin:0 0 32px 0;font-size:16px;color:#334155;line-height:1.6;">
      Dear Parent/Guardian,<br><br>
      A new formal remark has been recorded regarding <strong>${student.name}</strong> by a member of the teaching staff.
    </p>

    <!-- Formal Quote Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fefce8;border:1px solid #fef08a;border-left:4px solid #eab308;border-radius:6px;margin-bottom:32px;">
      <tr>
        <td style="padding:24px 32px;">
          <p style="margin:0 0 12px 0;font-size:12px;font-weight:600;text-transform:uppercase;color:#a16207;letter-spacing:0.05em;">Official Remark</p>
          <p style="margin:0;font-family:'Georgia',serif;font-size:17px;color:#713f12;font-style:italic;line-height:1.7;">
            "${note}"
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;border-top:1px dashed #e2e8f0;padding-top:24px;">
      We document these remarks to support student monitoring and ensure consistent communication. If you wish to discuss this matter further, please reach out to the respective teacher.
    </p>
  `;

  const html = buildEmail('ⓘ', 'Teacher Remark Logged', 'A new note was added to the student profile', '#eab308', '#fefce8', innerContent);

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `Important Record: Teacher Remark for ${student.name}`,
      html
    });
    res.json({ success: true, to: recipients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/send-bulk
// ─────────────────────────────────────────────
exports.sendBulk = async (req, res) => {
  const { students, date } = req.body;
  if (!students || !Array.isArray(students)) return res.status(400).json({ error: 'No students provided' });

  const formattedDate = moment(date).format('dddd, MMMM D, YYYY');
  let sent = 0;

  for (const s of students) {
    const recipients = getRecipients(s);
    const hasAttended = s.hasAttended;

    const mainColor = hasAttended ? '#059669' : '#dc2626';
    const accentColor = hasAttended ? '#ecfdf5' : '#fef2f2';
    const icon = hasAttended ? '✓' : '✖';
    const title = hasAttended ? 'Present' : 'Absent';
    const subtitle = hasAttended ? 'Student was logged at school today' : 'No check-in record found for today';
    
    const statusText = hasAttended 
        ? 'We are pleased to report that the student was present.' 
        : 'Please be advised that the student was <strong>not recorded</strong> in attendance today.';

    const innerContent = `
      <p style="margin:0 0 24px 0;font-size:16px;color:#334155;line-height:1.6;">
        Dear Parent/Guardian,<br><br>
        This is an official summary of the daily attendance record for <strong>${s.name}</strong> on <strong>${formattedDate}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
           <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="background-color:${accentColor};border:1px solid ${mainColor}40;border-radius:100px;padding:12px 32px;">
                 <tr>
                    <td style="font-size:14px;font-weight:600;color:${mainColor};letter-spacing:1px;text-transform:uppercase;">
                        Status: ${title.toUpperCase()}
                    </td>
                 </tr>
              </table>
           </td>
        </tr>
      </table>

      <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;text-align:center;border-top:1px dashed #e2e8f0;padding-top:24px;">
        ${statusText}<br>
        If this record appears incorrect, please contact the administration office.
      </p>
    `;

    const html = buildEmail(icon, 'Daily Attendance Report', subtitle, mainColor, accentColor, innerContent);

    try {
      await transporter.sendMail({
        from: EMAIL_CONFIG.from,
        to: recipients,
        subject: `Daily Attendance Report: ${s.name} - ${formattedDate}`,
        html
      });
      sent++;
    } catch (err) { console.error(`Failed bulk for ${s.name}:`, err.message); }
  }

  res.json({ success: true, totals: students.length, sent });
};

// ─────────────────────────────────────────────
// POST /api/send-manual
// ─────────────────────────────────────────────
exports.sendManual = async (req, res) => {
  const { student, message } = req.body;
  const recipients = getRecipients(student);

  const innerContent = `
    <p style="margin:0 0 24px 0;font-size:16px;color:#334155;line-height:1.6;">
      Dear Parent/Guardian,<br><br>
      Please review the following administrative notice regarding <strong>${student.name}</strong>.
    </p>

    <div style="padding:24px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:24px;">
       <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.7;">
          ${message}
       </p>
    </div>

    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
       Thank you for your attention to this matter.
    </p>
  `;

  const html = buildEmail('✉', 'Administrative Notice', 'Important communication from the school', '#475569', '#f1f5f9', innerContent);

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `Official Notice Regarding ${student.name}`,
      html
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendExamResults = async (req, res) => {
  const { student, exam } = req.body;

  if (!student || !exam?.exam_name || !Array.isArray(exam.subjects) || exam.subjects.length === 0) {
    return res.status(400).json({ error: 'Student and exam details are required.' });
  }

  const recipients = getRecipients(student);
  const examLabel = exam.exam_type === 'weekly' && exam.week_label
    ? `${exam.exam_name} (${exam.week_label})`
    : exam.exam_name;

  const subjectRows = exam.subjects.map((subject) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;">
        ${subject.subject}
      </td>
      <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#2563eb;text-align:right;font-weight:700;">
        ${subject.marks} / ${subject.total_marks || 100}
      </td>
    </tr>
  `).join('');

  const innerContent = `
    <p style="margin:0 0 24px 0;font-size:16px;color:#334155;line-height:1.6;">
      Dear Parent/Guardian,<br><br>
      The latest exam numbers for <strong>${student.name}</strong> have been published.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Exam</p>
          <p style="margin:0;font-size:20px;color:#0f172a;font-weight:700;">${examLabel}</p>
          <p style="margin:10px 0 0 0;font-size:14px;color:#64748b;">Class: ${student.class || 'N/A'} | Roll: ${student.roll_number || 'N/A'}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:14px 16px;background-color:#eff6ff;font-size:12px;color:#1d4ed8;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;">Subject</td>
        <td style="padding:14px 16px;background-color:#eff6ff;font-size:12px;color:#1d4ed8;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;text-align:right;">Marks</td>
      </tr>
      ${subjectRows}
    </table>

    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
      Please contact the school if you need clarification on these published numbers.
    </p>
  `;

  const html = buildEmail('📘', 'Exam Numbers Published', 'Latest subject-wise marks are now available', '#2563eb', '#eff6ff', innerContent);

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `Exam Numbers: ${student.name} - ${examLabel}`,
      html
    });
    res.json({ success: true, to: recipients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendNotice = async (req, res) => {
  const { student, notice } = req.body;

  if (!student || !notice?.title || !notice?.content) {
    return res.status(400).json({ error: 'Student and notice details are required.' });
  }

  const recipients = getRecipients(student);
  
  const innerContent = `
    <p style="margin:0 0 24px 0;font-size:16px;color:#334155;line-height:1.6;">
      Dear Parent/Guardian,<br><br>
      The school has issued a new official notice regarding <strong>${student.name}</strong> and the school community.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Subject</p>
          <p style="margin:0;font-size:20px;color:#0f172a;font-weight:700;">${notice.title}</p>
          <p style="margin:10px 0 0 0;font-size:14px;color:#64748b;">Category: ${notice.category || 'General'}</p>
        </td>
      </tr>
    </table>

    <div style="padding:24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
       <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.7;white-space: pre-wrap;">
          ${notice.content}
       </p>
    </div>

    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
       This is an official communication from CNHHS Smart School System. Please contact the administration if you have further inquiries.
    </p>
  `;

  const html = buildEmail('📢', 'Official School Notice', notice.title, '#7c3aed', '#f5f3ff', innerContent);

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: `Notice: ${notice.title}`,
      html
    });
    res.json({ success: true, to: recipients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

