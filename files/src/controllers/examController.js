const Student = require('../models/Student');
const { sendExamResultNotification } = require('../services/emailService');

const isRegisteredStudent = (student) => {
  if (!student) return false;

  return Boolean(
    student.active &&
    student.uid &&
    student.name &&
    !student.name.startsWith('Unknown-') &&
    student.email &&
    !student.email.includes('pending.com') &&
    !student.email.includes('unknown-')
  );
};

const findMatchingRecord = (student, examName, examType, weekLabel) =>
  student.exam_records.find(
    (record) =>
      record.exam_name === examName &&
      record.exam_type === examType &&
      (record.week_label || '') === (weekLabel || '')
  );

exports.publishExamResults = async (req, res) => {
  const { exam_name, exam_type = 'final', week_label = '', results = [] } = req.body;

  if (!exam_name || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'Exam name and at least one result are required.' });
  }

  try {
    const normalizedResults = results
      .filter((entry) => entry?.uid && Array.isArray(entry.subjects) && entry.subjects.length > 0)
      .map((entry) => ({
        uid: entry.uid,
        subjects: entry.subjects
          .filter((subject) => subject?.subject && Number.isFinite(Number(subject.marks)))
          .map((subject) => ({
            subject: String(subject.subject).trim(),
            marks: Number(subject.marks),
            total_marks: Number(subject.total_marks) || 100
          }))
      }))
      .filter((entry) => entry.subjects.length > 0);

    if (normalizedResults.length === 0) {
      return res.status(400).json({ error: 'No valid subject marks were provided.' });
    }

    const students = await Student.find({
      uid: { $in: normalizedResults.map((entry) => entry.uid) }
    });

    const studentMap = new Map(students.map((student) => [student.uid, student]));
    const invalidStudents = normalizedResults.filter((entry) => !isRegisteredStudent(studentMap.get(entry.uid)));

    if (invalidStudents.length > 0) {
      return res.status(400).json({
        error: 'Exam numbers can only be given to registered students.',
        invalid_uids: invalidStudents.map((entry) => entry.uid)
      });
    }

    const publishedAt = new Date();

    for (const entry of normalizedResults) {
      const student = studentMap.get(entry.uid);
      const existingRecord = findMatchingRecord(student, exam_name, exam_type, week_label);

      if (existingRecord) {
        existingRecord.subjects = entry.subjects;
        existingRecord.published_at = publishedAt;
      } else {
        student.exam_records.push({
          exam_type,
          exam_name,
          week_label,
          published_at: publishedAt,
          subjects: entry.subjects
        });
      }

      await student.save();
    }

    res.json({
      success: true,
      message: 'Exam numbers saved successfully.',
      saved: normalizedResults.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendExamResults = async (req, res) => {
  const { exam_name, exam_type = 'final', week_label = '', results = [] } = req.body;

  if (!exam_name || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'Exam name and at least one result are required.' });
  }

  try {
    const normalizedResults = results
      .filter((entry) => entry?.uid && Array.isArray(entry.subjects) && entry.subjects.length > 0)
      .map((entry) => ({
        uid: entry.uid,
        subjects: entry.subjects
          .filter((subject) => subject?.subject && Number.isFinite(Number(subject.marks)))
          .map((subject) => ({
            subject: String(subject.subject).trim(),
            marks: Number(subject.marks),
            total_marks: Number(subject.total_marks) || 100
          }))
      }))
      .filter((entry) => entry.subjects.length > 0);

    const students = await Student.find({
      uid: { $in: normalizedResults.map((entry) => entry.uid) }
    });

    const studentMap = new Map(students.map((student) => [student.uid, student]));
    const invalidStudents = normalizedResults.filter((entry) => !isRegisteredStudent(studentMap.get(entry.uid)));

    if (invalidStudents.length > 0) {
      return res.status(400).json({
        error: 'Only registered students can receive exam numbers.',
        invalid_uids: invalidStudents.map((entry) => entry.uid)
      });
    }

    let sent = 0;

    for (const entry of normalizedResults) {
      const student = studentMap.get(entry.uid);
      const latestMatchingRecord = findMatchingRecord(student, exam_name, exam_type, week_label);

      const notificationSent = await sendExamResultNotification(student, {
        exam_name,
        exam_type,
        week_label,
        subjects: entry.subjects
      });

      if (notificationSent) {
        sent += 1;

        if (latestMatchingRecord) {
          latestMatchingRecord.sent_at = new Date();
          await student.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Exam numbers sent to registered students.',
      totals: normalizedResults.length,
      sent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
