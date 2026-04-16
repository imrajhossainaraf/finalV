const Notice = require('../models/Notice');
const Student = require('../models/Student');
const { sendNoticeEmail } = require('../services/emailService');

exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNotice = async (req, res) => {
  const { title, content, category } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  try {
    const newNotice = new Notice({
      title,
      content,
      category: category || 'General'
    });
    
    await newNotice.save();
    res.status(201).json(newNotice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendNoticeToParents = async (req, res) => {
  const { id } = req.params;

  try {
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found.' });
    }

    // Fetch all active students who have parent emails
    const students = await Student.find({ 
      active: true,
      $or: [
        { parent_email: { $exists: true, $ne: '' } },
        { email: { $exists: true, $ne: '' } }
      ]
    });

    if (students.length === 0) {
      return res.status(400).json({ error: 'No active students with email addresses found.' });
    }

    let sentCount = 0;
    for (const student of students) {
      const sent = await sendNoticeEmail(student, notice);
      if (sent) sentCount++;
    }

    notice.sentAt = new Date();
    await notice.save();

    res.json({ 
      success: true, 
      message: `Notice broadcasted to ${sentCount} recipients.`,
      totals: students.length,
      sent: sentCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotice = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
