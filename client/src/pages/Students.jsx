import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { Search, Plus, UserCircle, Save, X, Edit3, ShieldAlert, Hash, Mail, User, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Students() {
  const { students, refetch, sendManualNotice, todayAttendanceMap } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    email: '',
    parent_email: '',
    teacher_email: '',
    class: '',
    roll_number: '',
    notes: ''
  });
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const classOptions = [...new Set((students || []).map((student) => student.class).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  // Filter out students by name or UID
  const filteredStudents = students?.filter((s) => 
    (
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.uid && s.uid.toLowerCase().includes(searchTerm.toLowerCase()))
    ) &&
    (selectedClass === 'all' || (s.class || '') === selectedClass)
  ) || [];

  const handleEdit = (student) => {
    setFormData({
      uid: student.uid || '',
      name: student.name.startsWith('Unknown-') ? '' : student.name,
      email: student.email.startsWith('unknown-') ? '' : student.email,
      parent_email: student.parent_email || '',
      teacher_email: student.teacher_email || '',
      class: student.class || '',
      roll_number: student.roll_number || '',
      notes: student.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleViewCard = (student) => {
    setSelectedStudent(student);
    setIsCardOpen(true);
  };

  const handleNew = () => {
    setFormData({
      uid: '',
      name: '',
      email: '',
      parent_email: '',
      teacher_email: '',
      class: '',
      roll_number: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.uid || !formData.name || !formData.email) {
      toast.error('UID, Name, and Email are required!');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/students', formData);
      toast.success('Student updated successfully!');
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete('/api/students/' + studentToDelete.uid);
      toast.success('Student and their past logs deleted successfully!');
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--attendly-text-primary) 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Student Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
            Map RFID cards to students and edit profiles.
          </p>
        </div>
        
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            background: 'var(--attendly-gradient-primary)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Plus size={18} />
          Register Student
        </button>
      </div>

      {/* Main Container */}
      <div className="glass-card overflow-hidden animate-fade-in-up stagger-1">
        {/* Toolbar */}
        <div
          className="p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between"
          style={{ borderBottom: '1px solid var(--attendly-border)' }}
        >
          <div className="relative max-w-md w-full">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              size={16}
              style={{ color: 'var(--attendly-text-muted)' }}
            />
            <input 
              type="text" 
              placeholder="Search by UID or Name..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
              style={{
                background: 'var(--attendly-bg-elevated)',
                border: '1px solid var(--attendly-border)',
                color: 'var(--attendly-text-primary)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full max-w-xs">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--attendly-border)' }}>
                {['Student Info', 'RFID UID', 'Class & Roll', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left"
                    style={{
                      background: 'var(--attendly-bg-elevated)',
                      color: 'var(--attendly-text-muted)',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => {
                const isUnknown = student.name.startsWith('Unknown-');
                const studentId = (student._id || student.id || student.uid)?.toString();
                const isPresent = !!todayAttendanceMap?.[studentId];
                const isAbsent = !isPresent && !isUnknown && (student.active === 1 || student.active === true);

                return (
                  <tr
                    key={student._id || student.uid || idx}
                    className="transition-all duration-200 group"
                    style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300"
                          style={
                            isUnknown
                              ? {
                                  background: 'var(--attendly-glow-error)',
                                  color: 'var(--attendly-accent-error)',
                                }
                              : isPresent 
                              ? {
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10b981',
                                  border: '2px solid #10b981',
                                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                                }
                              : isAbsent
                              ? {
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: '2px solid #ef4444',
                                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                                }
                              : {
                                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
                                  color: '#818cf8',
                                }
                          }
                        >
                          {isUnknown ? '?' : student.name.charAt(0)}
                        </div>
                        <div>
                          <div
                            className="font-semibold text-sm flex items-center gap-2"
                            style={{ color: isUnknown ? 'var(--attendly-accent-error)' : 'var(--attendly-text-primary)' }}
                          >
                            {isUnknown ? 'Unregistered Card' : student.name}
                            {student.notes && !isUnknown && (
                              <div title="Has Notes" className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                            )}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--attendly-text-muted)' }}>
                            {isUnknown ? 'Needs mapping' : (isPresent ? 'Check-in recorded' : (isAbsent ? 'Absent today' : student.email))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="font-mono text-xs px-2.5 py-1 rounded-lg select-all"
                        style={{
                          background: 'var(--attendly-bg-elevated)',
                          color: 'var(--attendly-text-secondary)',
                          border: '1px solid var(--attendly-border)',
                        }}
                      >
                        {student.uid}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm" style={{ color: 'var(--attendly-text-primary)' }}>{student.class || '-'}</div>
                      <div className="text-xs" style={{ color: 'var(--attendly-text-muted)' }}>
                        Roll: {student.roll_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={
                          student.active
                            ? {
                                background: isPresent ? 'var(--attendly-glow-success)' : 'var(--attendly-bg-elevated)',
                                color: isPresent ? '#34d399' : 'var(--attendly-text-muted)',
                                border: isPresent ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--attendly-border)',
                              }
                            : {
                                background: 'var(--attendly-bg-elevated)',
                                color: 'var(--attendly-text-muted)',
                                border: '1px solid var(--attendly-border)',
                              }
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isPresent ? '#34d399' : 'var(--attendly-text-muted)' }}
                        />
                        {isPresent ? 'Present' : (student.active ? 'Expected' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCard(student)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                          style={{
                            background: 'var(--attendly-glow-primary)',
                            color: '#818cf8',
                            border: '1px solid rgba(129, 140, 248, 0.25)',
                          }}
                        >
                          View Card
                        </button>

                        <button
                          onClick={() => handleEdit(student)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                          style={
                            isUnknown
                              ? {
                                  background: 'var(--attendly-glow-error)',
                                  color: 'var(--attendly-accent-error)',
                                  border: '1px solid rgba(239,68,68,0.25)',
                                }
                              : {
                                  background: 'transparent',
                                  color: 'var(--attendly-text-muted)',
                                  border: '1px solid var(--attendly-border)',
                                }
                          }
                          onMouseEnter={(e) => {
                            if (!isUnknown) {
                              e.currentTarget.style.borderColor = 'var(--attendly-border-focus)';
                              e.currentTarget.style.color = '#818cf8';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUnknown) {
                              e.currentTarget.style.borderColor = 'var(--attendly-border)';
                              e.currentTarget.style.color = 'var(--attendly-text-muted)';
                            }
                          }}
                        >
                          {isUnknown ? (
                            <><ShieldAlert size={12} /> Map User</>
                          ) : (
                            <><Edit3 size={12} /> Edit</>
                          )}
                        </button>

                        {!isUnknown && (
                          <>
                            <button
                              onClick={() => sendManualNotice(student, "This is a manual check-in from Attendly Management.")}
                              className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Send Manual Email"
                              style={{
                                background: 'rgba(6,182,212,0.1)',
                                color: '#22d3ee',
                                border: '1px solid rgba(6,182,212,0.2)',
                              }}
                            >
                              <Mail size={14} />
                            </button>

                            <button
                              onClick={() => confirmDelete(student)}
                              className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Delete Student"
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <UserCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--attendly-text-muted)', opacity: 0.3 }} />
                    <p className="text-sm" style={{ color: 'var(--attendly-text-muted)' }}>No students found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
            style={{
              background: 'var(--attendly-bg-card)',
              border: '1px solid var(--attendly-border-focus)',
            }}
          >
            {/* Modal Header */}
            <div
              className="p-6 flex justify-between items-center"
              style={{ borderBottom: '1px solid var(--attendly-border)' }}
            >
              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: 'var(--attendly-text-primary)' }}
                >
                  {formData.uid && students?.find(s => s.uid === formData.uid) ? 'Edit Student Mapping' : 'Register New Student'}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--attendly-text-muted)' }}>
                  Fill in the details below.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--attendly-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--attendly-bg-elevated)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
              {/* UID */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                  <Hash size={12} /> RFID Card UID *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. A1B2C3D4" 
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-mono uppercase border-none focus:outline-none"
                  style={{
                    background: students?.find(s => s.uid === formData.uid) ? 'rgba(99,102,241,0.08)' : 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                    color: 'var(--attendly-text-primary)',
                  }}
                  value={formData.uid}
                  onChange={e => setFormData({...formData, uid: e.target.value.toUpperCase()})}
                  readOnly={!!students?.find(s => s.uid === formData.uid)}
                />
                {students?.find(s => s.uid === formData.uid) && (
                  <span className="text-xs mt-1 block" style={{ color: 'var(--attendly-text-muted)' }}>
                    UID cannot be changed once created.
                  </span>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                  <User size={12} /> Full Name *
                </label>
                <input 
                  type="text" 
                  placeholder="Student Name" 
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                    color: 'var(--attendly-text-primary)',
                  }}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Emails Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                    <Mail size={12} /> Student Email *
                  </label>
                  <input 
                    type="email" 
                    placeholder="Student primary email" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                    style={{
                      background: 'var(--attendly-bg-elevated)',
                      border: '1px solid var(--attendly-border)',
                      color: 'var(--attendly-text-primary)',
                    }}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                {/* Parent Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                    <Mail size={12} /> Parent Email
                  </label>
                  <input 
                    type="email" 
                    placeholder="Inquiry reply target" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                    style={{
                      background: 'var(--attendly-bg-elevated)',
                      border: '1px solid var(--attendly-border)',
                      color: 'var(--attendly-text-primary)',
                    }}
                    value={formData.parent_email}
                    onChange={e => setFormData({...formData, parent_email: e.target.value})}
                  />
                </div>

                {/* Teacher Email */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                    <Mail size={12} /> Teacher Email
                  </label>
                  <input 
                    type="email" 
                    placeholder="Assigned teacher for updates" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                    style={{
                      background: 'var(--attendly-bg-elevated)',
                      border: '1px solid var(--attendly-border)',
                      color: 'var(--attendly-text-primary)',
                    }}
                    value={formData.teacher_email}
                    onChange={e => setFormData({...formData, teacher_email: e.target.value})}
                  />
                </div>
              </div>

              {/* Class & Roll */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--attendly-text-muted)' }}>
                    Class / Dept
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. CS-101" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                    style={{
                      background: 'var(--attendly-bg-elevated)',
                      border: '1px solid var(--attendly-border)',
                      color: 'var(--attendly-text-primary)',
                    }}
                    value={formData.class}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--attendly-text-muted)' }}>
                    Roll Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 24" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none"
                    style={{
                      background: 'var(--attendly-bg-elevated)',
                      border: '1px solid var(--attendly-border)',
                      color: 'var(--attendly-text-primary)',
                    }}
                    value={formData.roll_number}
                    onChange={e => setFormData({...formData, roll_number: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                  Notes & Remarks
                </label>
                <textarea 
                  placeholder="e.g. Fought today, has to pay dues, etc." 
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-none focus:outline-none min-h-20 resize-none"
                  style={{
                    background: 'var(--attendly-bg-elevated)',
                    border: '1px solid var(--attendly-border)',
                    color: 'var(--attendly-text-primary)',
                  }}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'transparent',
                    color: 'var(--attendly-text-muted)',
                    border: '1px solid var(--attendly-border)',
                  }}
                  onClick={() => setIsModalOpen(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--attendly-border-focus)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--attendly-border)'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  disabled={isSubmitting}
                  style={{
                    background: 'var(--attendly-gradient-primary)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Save size={16} /> Save Mapping
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Personal Card Modal */}
      {isCardOpen && selectedStudent && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setIsCardOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[2.5rem] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-scale-in"
            style={{
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 blur-[60px] rounded-full -ml-16 -mb-16" />

            <div className="p-8 relative">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl font-bold text-indigo-400 border border-indigo-500/20">
                  {selectedStudent.name.charAt(0)}
                </div>
                <button onClick={() => setIsCardOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedStudent.name}</h2>
                <p className="text-indigo-400 font-medium text-sm">{selectedStudent.class} • Roll {selectedStudent.roll_number}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Contact Email</p>
                  <p className="text-slate-300 text-sm truncate">{selectedStudent.email}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Behavioral Notes</p>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      {selectedStudent.notes || "No recent remarks recorded."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-400">ID</div>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-slate-900 flex items-center justify-center text-[10px] text-indigo-400 font-mono">
                    {selectedStudent.uid.slice(-2)}
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Attendly Verified</p>
              </div>

              {/* Quick Edit Action */}
              <button 
                onClick={() => {
                  setIsCardOpen(false);
                  handleEdit(selectedStudent);
                }}
                className="w-full mt-6 py-4 rounded-2xl bg-indigo-500 text-white font-bold text-sm shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Edit3 size={16} />
                Edit Remarks & Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && studentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteModalOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-4xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-scale-in bg-slate-900 border border-slate-700"
          >
            <div className="p-8 text-center pt-10 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 mb-6 relative z-10">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Delete Student?</h3>
              <p className="text-slate-400 text-sm mb-8 relative z-10">
                Are you sure you want to permanently delete <strong className="text-white">{studentToDelete.name}</strong>? This will also wipe all their past attendance logs.
              </p>
              
              <div className="flex gap-4 relative z-10">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-white bg-red-600 hover:bg-red-500 shadow-[0_4px_15px_rgba(220,38,38,0.3)] disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
