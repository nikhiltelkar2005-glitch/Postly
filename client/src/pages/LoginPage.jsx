import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COLLEGE } from '../api';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');

  const [lEmail, setLEmail]     = useState('');
  const [lPassword, setLPassword] = useState('');

  const [sName, setSName]       = useState('');
  const [sEmail, setSEmail]     = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sConfirm, setSConfirm] = useState('');

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!lEmail || !lPassword) return setError('Fill in both fields.');
    if (!lEmail.endsWith(`@${COLLEGE}`)) return setError(`Only @${COLLEGE} emails allowed.`);
    setError(''); setLoading(true);
    try { await login(lEmail, lPassword); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!sName.trim()) return setError('Your name is required.');
    if (!sEmail.endsWith(`@${COLLEGE}`)) return setError(`Only @${COLLEGE} emails allowed.`);
    if (sPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (sPassword !== sConfirm) return setError('Passwords do not match.');
    setError(''); setLoading(true);
    try { await register(sName.trim(), sEmail, sPassword); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-glow" />
        <div className="login-brand-content">
          <h1>Postly</h1>
          <p className="login-brand-tagline">Your college's private network.</p>
          <p className="login-brand-sub">Connect with your batchmates. Share what matters.</p>
          <div className="login-brand-domain">
            Exclusive to <strong>@{COLLEGE}</strong>
          </div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-logo-sm">P</div>
            <h2>{tab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{tab === 'login' ? 'Sign in with your college email' : 'Sign up with your college email'}</p>
          </div>

          <div className="auth-tabs">
            <button
              id="tab-login"
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
            >Login</button>
            <button
              id="tab-signup"
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); }}
            >Sign Up</button>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form id="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">College Email</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder={`your.id@${COLLEGE}`}
                  value={lEmail}
                  onChange={e => setLEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password"
                  placeholder="Enter your password"
                  value={lPassword}
                  onChange={e => setLPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button id="login-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : null} {loading ? 'Logging in…' : 'Login'}
              </button>
            </form>
          ) : (
            <form id="signup-form" onSubmit={handleSignup}>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Your Name</label>
                <input
                  id="signup-name"
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={sName}
                  onChange={e => setSName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">College Email</label>
                <input
                  id="signup-email"
                  className="form-input"
                  type="email"
                  placeholder={`your.id@${COLLEGE}`}
                  value={sEmail}
                  onChange={e => setSEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  className="form-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={sPassword}
                  onChange={e => setSPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
                <input
                  id="signup-confirm"
                  className="form-input"
                  type="password"
                  placeholder="Repeat password"
                  value={sConfirm}
                  onChange={e => setSConfirm(e.target.value)}
                />
              </div>
              <button id="signup-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : null} {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="login-footer">
            {tab === 'login'
              ? <>New here? <button className="link-btn" onClick={() => { setTab('signup'); setError(''); }}>Sign up</button></>
              : <>Already have an account? <button className="link-btn" onClick={() => { setTab('login'); setError(''); }}>Login</button></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
