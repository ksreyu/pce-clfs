import { useState, useEffect } from 'react';
import { User as UserIcon, Save, Lock, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { api } from '../../lib/api';
import { DEPARTMENTS, YEARS } from '../../lib/utils';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { darkMode } = useDarkMode();
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', department: '', year: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        department: user.department || '',
        year: user.year || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await api.updateProfile(profileForm) as any;
      updateUser(updated.user || updated);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputClass = `w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition ${
    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Card */}
      <div className={`rounded-xl p-6 transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID: {user?.studentId}</p>
              {user?.department && (
                <>
                  <span className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{user.department}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h2>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
            <input type="text" value={profileForm.name}
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
            <input type="text" value={profileForm.phone}
              onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Department</label>
              <select value={profileForm.department}
                onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                className={inputClass}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Year</label>
              <select value={profileForm.year}
                onChange={e => setProfileForm({ ...profileForm, year: e.target.value })}
                className={inputClass}>
                <option value="">Select</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={profileLoading}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 active:scale-95">
            <Save className="h-4 w-4" />
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Card */}
      <div className={`rounded-xl p-6 transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Lock className="h-5 w-5" /> Change Password
          </h2>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
            <input type="password" value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required className={inputClass} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
            <input type="password" value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required minLength={6} className={inputClass} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required minLength={6} className={inputClass} />
          </div>
          <button type="submit" disabled={passwordLoading}
            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-50 active:scale-95">
            <Lock className="h-4 w-4" />
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
