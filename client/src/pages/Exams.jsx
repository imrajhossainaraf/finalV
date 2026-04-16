import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useData } from '../context/DataContext';
import { BookOpen, FileSpreadsheet, Mail, Plus, Send, Trash2, Filter } from 'lucide-react';

const createSubject = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  subject: '',
  total_marks: 100
});

const isRegisteredStudent = (student) =>
  Boolean(
    student?.active &&
    student?.uid &&
    student?.name &&
    !student.name.startsWith('Unknown-') &&
    student?.email &&
    !student.email.includes('pending.com') &&
    !student.email.includes('unknown-')
  );

export default function Exams() {
  const { students, refetch } = useData();
  const [examMeta, setExamMeta] = useState({
    exam_name: '',
    exam_type: 'final',
    week_label: ''
  });
  const [selectedClass, setSelectedClass] = useState('all');
  const [subjects, setSubjects] = useState([createSubject()]);
  const [marksByUid, setMarksByUid] = useState({});
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const classOptions = [...new Set((students || []).map((student) => student.class).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  const registeredStudents = (students || []).filter(isRegisteredStudent);
  const scopedStudents = registeredStudents.filter((student) =>
    selectedClass === 'all' ? true : (student.class || '') === selectedClass
  );
  const filledSubjects = subjects.filter((subject) => subject.subject.trim());

  const recentPublished = scopedStudents
    .flatMap((student) =>
      (student.exam_records || []).map((record) => ({
        key: `${student.uid}-${record._id || record.published_at}`,
        studentName: student.name,
        examName: record.week_label ? `${record.exam_name} (${record.week_label})` : record.exam_name,
        publishedAt: record.published_at
      }))
    )
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 5);

  const handleSubjectChange = (subjectId, field, value) => {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              [field]: field === 'total_marks' ? Number(value) || 0 : value
            }
          : subject
      )
    );
  };

  const handleMarksChange = (uid, subjectId, value) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (subject && value !== '' && Number(value) > subject.total_marks) {
      toast.warn(`Marks cannot exceed full marks (${subject.total_marks}) for ${subject.subject}`);
      return;
    }
    setMarksByUid((current) => ({
      ...current,
      [uid]: {
        ...(current[uid] || {}),
        [subjectId]: value
      }
    }));
  };

  const addSubject = () => {
    setSubjects((current) => [...current, createSubject()]);
  };

  const removeSubject = (subjectId) => {
    setSubjects((current) => (current.length === 1 ? current : current.filter((subject) => subject.id !== subjectId)));
    setMarksByUid((current) => {
      const next = {};
      Object.entries(current).forEach(([uid, marks]) => {
        const filteredMarks = { ...marks };
        delete filteredMarks[subjectId];
        next[uid] = filteredMarks;
      });
      return next;
    });
  };

  const buildPayload = () => {
    if (selectedClass === 'all') {
      toast.error('Select a class before defining subjects or sending exam numbers.');
      return null;
    }

    if (!examMeta.exam_name.trim()) {
      toast.error('Exam name is required.');
      return null;
    }

    if (filledSubjects.length === 0) {
      toast.error('Add at least one subject.');
      return null;
    }

    if (examMeta.exam_type === 'weekly' && !examMeta.week_label.trim()) {
      toast.error('Week label is required for weekly exams.');
      return null;
    }

    const incompleteStudents = [];

    const results = scopedStudents
      .map((student) => {
        let invalidMark = null;
        const subjectMarks = filledSubjects.map((subject) => {
          const rawValue = marksByUid[student.uid]?.[subject.id];
          const marks = rawValue === '' || rawValue === undefined ? null : Number(rawValue);

          if (marks !== null && marks > subject.total_marks) {
            invalidMark = { subject: subject.subject, marks, total: subject.total_marks };
          }

          return {
            subject: subject.subject.trim(),
            total_marks: Number(subject.total_marks) || 100,
            marks: marks
          };
        });

        if (invalidMark) {
          toast.error(`${student.name}: ${invalidMark.subject} marks (${invalidMark.marks}) exceed full marks (${invalidMark.total})`);
          return null;
        }

        const enteredCount = subjectMarks.filter((subject) => subject.marks !== null && Number.isFinite(subject.marks)).length;

        if (enteredCount > 0 && enteredCount !== subjectMarks.length) {
          incompleteStudents.push(student.name);
        }

        return {
          uid: student.uid,
          subjects: subjectMarks.filter((subject) => subject.marks !== null && Number.isFinite(subject.marks))
        };
      })
      .filter((student) => student !== null && student.subjects.length > 0);

    if (incompleteStudents.length > 0) {
      toast.error(`Complete all subject marks for: ${incompleteStudents.slice(0, 3).join(', ')}`);
      return null;
    }

    if (results.length === 0) {
      toast.error('Enter marks for at least one registered student.');
      return null;
    }

    return {
      exam_name: examMeta.exam_name.trim(),
      exam_type: examMeta.exam_type,
      week_label: examMeta.exam_type === 'weekly' ? examMeta.week_label.trim() : '',
      results
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const { data } = await axios.post('/api/exams/publish', payload);
      toast.success(data.message || 'Exam numbers saved.');
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save exam numbers.');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSending(true);
    try {
      await axios.post('/api/exams/publish', payload);
      const { data } = await axios.post('/api/exams/send', payload);
      toast.success(`Sent exam numbers to ${data.sent}/${data.totals} registered students.`);
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send exam numbers.');
    } finally {
      setSending(false);
    }
  };

  const completedStudents = scopedStudents.filter((student) => {
    const latestExam = (student.exam_records || []).slice(-1)[0];
    return latestExam?.exam_name === examMeta.exam_name.trim() &&
      (examMeta.exam_type === 'weekly' ? (latestExam?.week_label || '') === examMeta.week_label.trim() : true);
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--attendly-text-primary) 0%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Exam Numbers
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
            Select a class, define its subjects and weekly/main exam label, then send only to registered students in that class.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving || sending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-60"
            style={{
              background: 'rgba(34,211,238,0.12)',
              color: '#67e8f9',
              border: '1px solid rgba(34,211,238,0.2)',
            }}
          >
            <FileSpreadsheet size={16} />
            {saving ? 'Saving...' : 'Save Numbers'}
          </button>

          <button
            onClick={handleSend}
            disabled={saving || sending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-60"
            style={{
              background: 'var(--attendly-gradient-primary)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            }}
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Save & Send'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Registered In Class', value: scopedStudents.length, icon: <Mail size={16} />, color: '#22d3ee' },
          { label: 'Subjects Added', value: filledSubjects.length, icon: <BookOpen size={16} />, color: '#818cf8' },
          { label: 'Latest Exam Matches', value: completedStudents, icon: <FileSpreadsheet size={16} />, color: '#34d399' },
        ].map((item) => (
          <div key={item.label} className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl" style={{ background: `${item.color}15`, color: item.color }}>
              {item.icon}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
                {item.value}
              </p>
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--attendly-text-muted)' }}>
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <div className="glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--attendly-text-muted)' }}>
                Target Class
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--attendly-text-muted)' }} />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                    color: 'var(--attendly-text-primary)',
                  }}
                >
                  <option value="all">All Classes</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--attendly-text-muted)' }}>
                Exam Name
              </label>
              <input
                type="text"
                value={examMeta.exam_name}
                onChange={(e) => setExamMeta((current) => ({ ...current, exam_name: e.target.value }))}
                placeholder="Mid Term, Final Term"
                className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                style={{
                  background: 'var(--attendly-bg-elevated)',
                  border: '1px solid var(--attendly-border)',
                  color: 'var(--attendly-text-primary)',
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--attendly-text-muted)' }}>
                Exam Type
              </label>
              <select
                value={examMeta.exam_type}
                onChange={(e) => setExamMeta((current) => ({ ...current, exam_type: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                style={{
                  background: 'var(--attendly-bg-elevated)',
                  border: '1px solid var(--attendly-border)',
                  color: 'var(--attendly-text-primary)',
                }}
              >
                <option value="final">Main Exam</option>
                <option value="weekly">Weekly Exam</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--attendly-text-muted)' }}>
                Week Label
              </label>
              <input
                type="text"
                value={examMeta.week_label}
                onChange={(e) => setExamMeta((current) => ({ ...current, week_label: e.target.value }))}
                placeholder="Week 1"
                disabled={examMeta.exam_type !== 'weekly'}
                className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none disabled:opacity-50"
                style={{
                  background: 'var(--attendly-bg-elevated)',
                  border: '1px solid var(--attendly-border)',
                  color: 'var(--attendly-text-primary)',
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>Subjects</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
                  Add subjects once, then enter marks only for registered students below.
                </p>
              </div>

              <button
                onClick={addSubject}
                disabled={selectedClass === 'all'}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <Plus size={14} />
                Add Subject
              </button>
            </div>

            {selectedClass === 'all' && (
              <div
                className="rounded-2xl px-4 py-3 text-xs"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#fbbf24',
                }}
              >
                Choose a class first. Subjects, weekly labels, marks, and sends are scoped to the selected class only.
              </div>
            )}

            {subjects.map((subject, index) => (
              <div key={subject.id} className="grid grid-cols-1 md:grid-cols-[1fr_160px_44px] gap-3">
                <input
                  type="text"
                  value={subject.subject}
                  onChange={(e) => handleSubjectChange(subject.id, 'subject', e.target.value)}
                  placeholder={`Subject ${index + 1}`}
                  disabled={selectedClass === 'all'}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                    color: 'var(--attendly-text-primary)',
                  }}
                />
                <input
                  type="number"
                  min="1"
                  value={subject.total_marks}
                  onChange={(e) => handleSubjectChange(subject.id, 'total_marks', e.target.value)}
                  placeholder="Total Marks"
                  disabled={selectedClass === 'all'}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                    color: 'var(--attendly-text-primary)',
                  }}
                />
                <button
                  onClick={() => removeSubject(subject.id)}
                  disabled={subjects.length === 1 || selectedClass === 'all'}
                  className="rounded-xl flex items-center justify-center disabled:opacity-40"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--attendly-text-primary)' }}>
            Recent Published Results
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--attendly-text-muted)' }}>
            Latest student records for the selected class.
          </p>

          <div className="space-y-3">
            {recentPublished.length > 0 ? (
              recentPublished.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--attendly-text-primary)' }}>
                    {item.studentName}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#a5b4fc' }}>
                    {item.examName}
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--attendly-text-muted)' }}>
                    {new Date(item.publishedAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div
                className="rounded-2xl p-5 text-sm"
                style={{
                  background: 'var(--attendly-bg-elevated)',
                  border: '1px solid var(--attendly-border)',
                  color: 'var(--attendly-text-muted)',
                }}
              >
                No exam numbers have been published yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid var(--attendly-border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--attendly-text-primary)' }}>
            Registered Students Only
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
            Unregistered cards and inactive students are excluded automatically.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--attendly-border)' }}>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--attendly-text-muted)' }}>
                  Student
                </th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--attendly-text-muted)' }}>
                  Class
                </th>
                {filledSubjects.map((subject) => (
                  <th
                    key={subject.id}
                    className="px-5 py-3 text-left text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: 'var(--attendly-text-muted)' }}
                  >
                    {subject.subject} ({subject.total_marks || 100})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scopedStudents.map((student) => (
                <tr key={student.uid} style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--attendly-text-primary)' }}>
                        {student.name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
                        {student.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm" style={{ color: 'var(--attendly-text-primary)' }}>
                      {student.class || '-'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
                      Roll {student.roll_number || '-'}
                    </p>
                  </td>
                  {filledSubjects.map((subject) => (
                    <td key={`${student.uid}-${subject.id}`} className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        max={subject.total_marks || 100}
                        value={marksByUid[student.uid]?.[subject.id] ?? ''}
                        onChange={(e) => handleMarksChange(student.uid, subject.id, e.target.value)}
                        placeholder="0"
                        disabled={selectedClass === 'all'}
                        className="w-28 px-3 py-2 rounded-xl text-sm border-none focus:outline-none"
                        style={{
                          background: 'var(--attendly-bg-elevated)',
                          border: '1px solid var(--attendly-border)',
                          color: 'var(--attendly-text-primary)',
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {scopedStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(filledSubjects.length + 2, 3)}
                    className="px-5 py-10 text-center text-sm"
                    style={{ color: 'var(--attendly-text-muted)' }}
                  >
                    {selectedClass === 'all'
                      ? 'Choose a class to load the matching registered students.'
                      : 'No registered students are available for this class yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
