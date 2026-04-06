import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { Search, Plus, UserCircle, Save, X, Edit3, ShieldAlert, Hash, Mail, User } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Students() {
  const { students, refetch } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    email: '',
    class: '',
    roll_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out students by name or UID
  const filteredStudents = students?.filter((s) => 
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.uid && s.uid.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleEdit = (student) => {
    setFormData({
      uid: student.uid || '',
      name: student.name.startsWith('Unknown-') ? '' : student.name,
      email: student.email.startsWith('unknown-') ? '' : student.email,
      class: student.class || '',
      roll_number: student.roll_number || ''
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setFormData({
      uid: '',
      name: '',
      email: '',
      class: '',
      roll_number: ''
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
          className="p-4"
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
                return (
                  <tr
                    key={student.id}
                    className="transition-all duration-200 group"
                    style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={
                            isUnknown
                              ? {
                                  background: 'var(--attendly-glow-error)',
                                  color: 'var(--attendly-accent-error)',
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
                            className="font-semibold text-sm"
                            style={{ color: isUnknown ? 'var(--attendly-accent-error)' : 'var(--attendly-text-primary)' }}
                          >
                            {isUnknown ? 'Unregistered Card' : student.name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--attendly-text-muted)' }}>
                            {isUnknown ? 'Needs mapping' : student.email}
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
                                background: 'var(--attendly-glow-success)',
                                color: '#34d399',
                                border: '1px solid rgba(16,185,129,0.25)',
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
                          style={{ background: student.active ? '#34d399' : 'var(--attendly-text-muted)' }}
                        />
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--attendly-text-muted)' }}>
                  <Mail size={12} /> Email Address *
                </label>
                <input 
                  type="email" 
                  placeholder="Email for notifications" 
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
    </div>
  );
}
