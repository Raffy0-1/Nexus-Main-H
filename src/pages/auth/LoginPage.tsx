import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, CircleDollarSign, Building2, LogIn, AlertCircle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';
import api from '../../utils/api';
import toast from 'react-hot-toast';

type LoginStep = 'credentials' | 'otp';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false); // true when SMTP is not configured

  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1: Submit credentials — if valid, request OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // First verify credentials by calling login (this sets the token)
      await login(email, password, role);

      // Credentials valid — now request OTP for 2FA
      setIsSendingOtp(true);
      try {
        const otpRes = await api.post('/auth/request-otp', { email });
        
        // Demo mode: backend returns OTP directly when SMTP is not configured
        if (otpRes.data?.demoMode && otpRes.data?.demoOtp) {
          setIsDemoMode(true);
          setOtpCode(otpRes.data.demoOtp); // Auto-fill the code
          toast.success('Demo mode: Code auto-filled for you!', { icon: '🧪' });
        } else {
          setIsDemoMode(false);
          toast.success('Verification code sent to your email!');
        }
        setStep('otp');
      } catch (otpErr: any) {
        // If OTP request fails entirely, skip 2FA and go straight in
        console.warn('OTP request failed, skipping 2FA:', otpErr.message);
        toast.success('Logged in successfully!');
        navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
      } finally {
        setIsSendingOtp(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || (err as Error).message || 'Login failed');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otpCode });
      toast.success('2FA verified! Welcome to Nexus.');
      navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const otpRes = await api.post('/auth/request-otp', { email });
      if (otpRes.data?.demoMode && otpRes.data?.demoOtp) {
        setIsDemoMode(true);
        setOtpCode(otpRes.data.demoOtp);
        toast.success('New code auto-filled (demo mode)', { icon: '🧪' });
      } else {
        toast.success('New verification code sent!');
        setOtpCode('');
      }
    } catch (err: any) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // For demo purposes, pre-filled credentials
  const fillDemoCredentials = (userRole: UserRole) => {
    if (userRole === 'entrepreneur') {
      setEmail('sarah@techwave.io');
      setPassword('password123');
    } else {
      setEmail('michael@vcinnovate.com');
      setPassword('password123');
    }
    setRole(userRole);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'credentials' ? 'Sign in to Business Nexus' : 'Two-Step Verification'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'credentials'
            ? 'Connect with investors and entrepreneurs'
            : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: Credentials ─────────────────────────────────── */}
          {step === 'credentials' && (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${role === 'entrepreneur'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      onClick={() => setRole('entrepreneur')}
                    >
                      <Building2 size={18} className="mr-2" />
                      Entrepreneur
                    </button>

                    <button
                      type="button"
                      className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors ${role === 'investor'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      onClick={() => setRole('investor')}
                    >
                      <CircleDollarSign size={18} className="mr-2" />
                      Investor
                    </button>
                  </div>
                </div>

                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  startAdornment={<User size={18} />}
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading || isSendingOtp}
                  leftIcon={<LogIn size={18} />}
                >
                  {isSendingOtp ? 'Sending verification code...' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fillDemoCredentials('entrepreneur')}
                    leftIcon={<Building2 size={16} />}
                  >
                    Entrepreneur Demo
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => fillDemoCredentials('investor')}
                    leftIcon={<CircleDollarSign size={16} />}
                  >
                    Investor Demo
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: OTP Verification ────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              {/* Demo mode banner */}
              {isDemoMode && (
                <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
                  <Zap size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold">Demo Mode</span> — Email is not configured.
                    The code has been <span className="font-semibold">auto-filled</span> for you.
                    Check the server console too.
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center text-2xl font-bold tracking-[0.5em] py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="000000"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    {isDemoMode
                      ? 'Code auto-filled from server (demo mode — no real email sent)'
                      : 'Check your email — the code expires in 10 minutes'}
                  </p>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isVerifying}
                  leftIcon={<ShieldCheck size={18} />}
                >
                  Verify & Continue
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setOtpCode(''); setError(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to login
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                  className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSendingOtp ? 'animate-spin' : ''} />
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};