import React, { useState } from 'react';
import { Mail, Lock, User, KeyRound, ArrowRight, ShieldCheck, HelpCircle, RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function AuthView({ onLoginSuccess }) {
  // Screens: 'login', 'register', 'verify', 'forgot', 'reset'
  const [screen, setScreen] = useState('login');
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status/Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSwitchScreen = (newScreen) => {
    clearMessages();
    setScreen(newScreen);
    // Clear passwords
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed.');
      }
      
      setSuccessMsg('Logged in successfully!');
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirm_password: confirmPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }
      
      if (data.otp_fallback) {
        setSuccessMsg(`${data.message} Verification code: ${data.otp_fallback}`);
        setOtp(data.otp_fallback);
      } else {
        setSuccessMsg('An OTP has been sent to your email. Please verify.');
      }
      setScreen('verify');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Verification failed.');
      }
      
      setSuccessMsg('Email verified successfully! You can now login.');
      setScreen('login');
      // Keep email, clear credentials
      setPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Request failed.');
      }
      
      if (data.otp_fallback) {
        setSuccessMsg(`${data.message} Reset code: ${data.otp_fallback}`);
        setOtp(data.otp_fallback);
      } else {
        setSuccessMsg('A password reset OTP has been sent to your email.');
      }
      setScreen('reset');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password, confirm_password: confirmPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Password reset failed.');
      }
      
      setSuccessMsg('Password reset successfully! Please login with your new password.');
      setScreen('login');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem',
      background: 'transparent',
      width: '100%',
      minHeight: '60vh'
    }}>
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '380px', 
        padding: '1.75rem',
        borderRadius: '16px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Banner Logo */}
        <div style={{ textAlign: 'center', marginBottom: screen === 'register' ? '1.25rem' : '2.0rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(20, 184, 166, 0.15))',
            padding: screen === 'register' ? '0.5rem' : '0.75rem',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: screen === 'register' ? '0.5rem' : '1rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)'
          }}>
            <ShieldCheck size={screen === 'register' ? 24 : 32} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontSize: screen === 'register' ? '1.45rem' : '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
            {screen === 'login' && 'Welcome Back'}
            {screen === 'register' && 'Create Account'}
            {screen === 'verify' && 'Verify Email'}
            {screen === 'forgot' && 'Reset Password'}
            {screen === 'reset' && 'Define New Password'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: screen === 'register' ? '0.78rem' : '0.88rem', marginTop: '0.25rem', marginBottom: 0 }}>
            {screen === 'login' && 'Login to access oral assessments and report history.'}
            {screen === 'register' && 'Register now to start tracking your verbal speech.'}
            {screen === 'verify' && `We've sent a 6-digit verification code to ${email}`}
            {screen === 'forgot' && 'Enter your email to receive a password reset OTP.'}
            {screen === 'reset' && 'Enter the reset code sent to your email and your new password.'}
          </p>
        </div>

        {/* Global Error/Success Notification Boxes */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--success)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            lineHeight: '1.4'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Screens */}
        {screen === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                className="form-control"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Lock size={12} /> Password
                </label>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  onClick={() => handleSwitchScreen('forgot')}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ padding: '0.5rem 2.25rem 0.5rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-premium btn-primary"
              style={{ width: '100%', padding: '0.7rem', marginBottom: '1.0rem', fontSize: '0.85rem' }}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Don't have an account?{' '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => handleSwitchScreen('register')}
              >
                Register here
              </button>
            </p>
          </form>
        )}

        {screen === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <User size={12} /> Full Name
              </label>
              <input
                type="text"
                className="form-control"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                className="form-control"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Lock size={12} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ padding: '0.5rem 2.25rem 0.5rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.0rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Lock size={12} /> Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ padding: '0.5rem 2.25rem 0.5rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-premium btn-accent"
              style={{ width: '100%', padding: '0.7rem', marginBottom: '1.0rem', fontSize: '0.85rem' }}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <>Register Account <ArrowRight size={16} /></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Already have an account?{' '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => handleSwitchScreen('login')}
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {screen === 'verify' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={12} /> Verification Code (OTP)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  textAlign: 'center',
                  fontSize: '1.3rem',
                  letterSpacing: '6px',
                  fontWeight: '700'
                }}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-premium btn-accent"
              style={{ width: '100%', padding: '0.9rem', marginBottom: '1.5rem' }}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <>Verify Code <ArrowRight size={16} /></>}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <button
                type="button"
                className="btn-premium btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => handleSwitchScreen('register')}
                disabled={isLoading}
              >
                Back to Register
              </button>
              
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={handleRegister} // Triggers OTP resend by re-submitting registration details
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {screen === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={12} /> Registered Email Address
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-premium btn-primary"
              style={{ width: '100%', padding: '0.9rem', marginBottom: '1.5rem' }}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <>Send Reset Code <ArrowRight size={16} /></>}
            </button>

            <button
              type="button"
              className="btn-premium btn-secondary"
              style={{ width: '100%', padding: '0.8rem' }}
              onClick={() => handleSwitchScreen('login')}
              disabled={isLoading}
            >
              Back to Login
            </button>
          </form>
        )}

        {screen === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <KeyRound size={12} /> Reset OTP Code
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  letterSpacing: '5px',
                  fontWeight: '700',
                  padding: '0.5rem 0.75rem'
                }}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Lock size={12} /> New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ padding: '0.5rem 2.25rem 0.5rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.0rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Lock size={12} /> Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ padding: '0.5rem 2.25rem 0.5rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-premium btn-accent"
              style={{ width: '100%', padding: '0.7rem', marginBottom: '1.0rem', fontSize: '0.85rem' }}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <>Save Password & Login <ArrowRight size={16} /></>}
            </button>

            <button
              type="button"
              className="btn-premium btn-secondary"
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem' }}
              onClick={() => handleSwitchScreen('login')}
              disabled={isLoading}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
