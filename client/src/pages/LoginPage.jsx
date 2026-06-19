import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
export default function LoginPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return setError('Enter a valid email.');
    setError(''); setLoading(true);
    try {
      await sendOtp(email);
      setMessage('OTP sent to your email.');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP.');
    setError(''); setLoading(true);
    try {
      await verifyOtp(email, otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setError('');
    setMessage('');
    setOtp('');
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-content">
          <h1>Postly</h1>
          <p className="login-brand-tagline">Your college's anonymous network.</p>
              <p className="login-brand-sub">No names. No profiles. Just real talk.</p>
              <div className="login-brand-domain">
                Any college email works
              </div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-logo-sm">P</div>
            {step === 'email' ? (
              <>
                <h2>Enter the forum</h2>
                <p>Sign in with your college email</p>
              </>
            ) : (
              <>
                <h2>Check your email</h2>
                <p>A 6-digit code was sent to {email}</p>
              </>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {step === 'email' ? (
            <form id="otp-email-form" onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">College Email</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="your.email@college.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <button id="send-otp-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : null} {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form id="otp-verify-form" onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="otp-input">6-Digit Code</label>
                <input
                  id="otp-input"
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter the code"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <button id="verify-otp-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : null} {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                style={{ marginTop: 8 }}
                onClick={handleBack}
              >Use a different email</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
