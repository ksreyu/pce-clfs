import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useDarkMode } from '../../context/DarkModeContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { darkMode } = useDarkMode();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition ${
    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary-600" />
          <span className="text-3xl font-bold text-primary-600">PCE CLFS</span>
        </Link>
        <h2 className={`mt-6 text-center text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
        <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Enter your email to receive a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Check your email</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                If an account exists with this email, you'll receive a reset link.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@student.mes.ac.in"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
