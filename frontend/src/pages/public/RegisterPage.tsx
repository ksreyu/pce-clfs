import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { UserPlus, User, Mail, Phone, BookOpen, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEPARTMENTS, YEARS } from '../../lib/utils';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', studentId: '', phone: '', department: '', year: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.studentId || !form.department || !form.year || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/@(student\.mes\.ac\.in|mes\.ac\.in)$/.test(form.email)) {
      toast.error('Email must be @student.mes.ac.in or @mes.ac.in');
      return;
    }
    if (!/^(FAC\d{3}|20\d{2}[A-Z]{2}\d{4})$/.test(form.studentId)) {
      toast.error('Admission number format: YYYYXX0000 (e.g., 2023PE0080) or FAC### for faculty');
      return;
    }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error('Phone must be a valid 10-digit Indian number');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      await register(submitData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition ${
    darkMode
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const selectClass = `block w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition ${
    darkMode
      ? 'bg-gray-800 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary-600" />
          <span className="text-3xl font-bold text-primary-600">PCE CLFS</span>
        </Link>
        <h2 className={`mt-6 text-center text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Account</h2>
        <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Join the Pillai College lost & found community
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name *</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className={inputClass}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email *</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className={inputClass}
                  placeholder="you@student.mes.ac.in"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Use your official college email (@student.mes.ac.in or @mes.ac.in)</p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Admission Number *</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={form.studentId}
                  onChange={e => updateField('studentId', e.target.value.toUpperCase())}
                  className={inputClass}
                  placeholder="e.g. 2023PE0080"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Format: Year + Branch Code + Number (e.g., 2023PE0080)</p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone (Optional)</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className={inputClass}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Department *</label>
                <select
                  required
                  value={form.department}
                  onChange={e => updateField('department', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Year *</label>
                <select
                  required
                  value={form.year}
                  onChange={e => updateField('year', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password *</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => updateField('password', e.target.value)}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password *</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={e => updateField('confirmPassword', e.target.value)}
                  className={inputClass}
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
