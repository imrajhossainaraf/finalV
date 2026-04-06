import { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { Search, Plus, UserCircle, Save, X, Trash2 } from 'lucide-react';
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
      refetch(); // Reload data immediately
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
          <p className="text-base-content/60 mt-1">Map RFID cards to students and edit profiles.</p>
        </div>
        
        <button onClick={handleNew} className="btn btn-primary shadow-lg shadow-primary/20">
          <Plus size={18} />
          Register Student
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-base-200 bg-base-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by UID or Name..." 
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-base-200/50 text-base-content/70">
                <th>Student info</th>
                <th>RFID UID</th>
                <th>Class & Roll</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const isUnknown = student.name.startsWith('Unknown-');
                return (
                  <tr key={student.id} className="hover:bg-base-200/30 transition-colors group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`avatar placeholder ${isUnknown ? 'opacity-50' : ''}`}>
                          <div className={`rounded-full w-10 ${isUnknown ? 'bg-base-300 text-base-content' : 'bg-primary/20 text-primary'}`}>
                            {isUnknown ? '?' : student.name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className={`font-bold ${isUnknown ? 'text-error' : ''}`}>
                            {isUnknown ? 'Unregistered Card' : student.name}
                          </div>
                          <div className="text-xs text-base-content/60">
                            {isUnknown ? 'Needs mapping' : student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs bg-base-200 px-2 py-1 rounded select-all">
                        {student.uid}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">{student.class || '-'}</div>
                      <div className="text-xs text-base-content/50">
                        Roll: {student.roll_number || '-'}
                      </div>
                    </td>
                    <td>
                      <div className={`badge badge-sm ${student.active ? 'badge-success' : 'badge-ghost'}`}>
                        {student.active ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleEdit(student)}
                        className={`btn btn-sm ${isUnknown ? 'btn-error' : 'btn-ghost'}`}
                      >
                        {isUnknown ? 'Map User' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-base-content/50">
                    <UserCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No students found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-base-300/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-base-200 flex justify-between items-center">
              <h3 className="font-bold text-xl">
                {formData.uid ? 'Edit Student Mapping' : 'Register New Student'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">RFID Card UID *</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. A1B2C3D4" 
                  className="input input-bordered font-mono uppercase" 
                  value={formData.uid}
                  onChange={e => setFormData({...formData, uid: e.target.value.toUpperCase()})}
                  readOnly={!!students?.find(s => s.uid === formData.uid)} // Cannot change UID if editing an existing record
                  style={{
                    backgroundColor: students?.find(s => s.uid === formData.uid) ? 'var(--fallback-b2,oklch(var(--b2)/1))' : '',
                  }}
                />
                {students?.find(s => s.uid === formData.uid) && (
                  <span className="label-text-alt text-base-content/50 mt-1">
                    UID cannot be changed once created.
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Full Name *</span></label>
                <input 
                  type="text" 
                  placeholder="Student Name" 
                  className="input input-bordered" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Email Address *</span></label>
                <input 
                  type="email" 
                  placeholder="Email for notifications" 
                  className="input input-bordered" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Class / Dept</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. CS-101" 
                    className="input input-bordered" 
                    value={formData.class}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Roll Number</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. 24" 
                    className="input input-bordered" 
                    value={formData.roll_number}
                    onChange={e => setFormData({...formData, roll_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  type="button" 
                  className="btn btn-ghost flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Save size={18} /> Save Mapping
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
