import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CREDENTIALS = [
  { label: 'Admin', username: 'admin', password: 'admin123' },
  { label: 'Author', username: 'author1', password: 'author123' },
  { label: 'Editor', username: 'editor1', password: 'editor123' },
  { label: 'Reader', username: 'reader1', password: 'reader123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Please enter both username and password.');
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-decoration" />
        <div className="brand-decoration" />
        <div className="login-brand-content">
          <div className="login-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h1>Write. Share. Inspire.</h1>
          <p>A modern blogging platform for creators who want to share their ideas with the world.</p>
        </div>
      </div>
      <div className="login-form-section">
        <div className="login-card">
          <div className="login-card-header">
            <h1>Welcome back</h1>
            <p>Sign in to your Postly workspace</p>
          </div>

          {error && <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username-input">Username</label>
              <input id="username-input" className="form-input" type="text" placeholder="Enter your username…" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password-input">Password</label>
              <input id="password-input" className="form-input" type="password" placeholder="Enter your password…" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button id="login-btn" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-demo">
            <p>Quick fill — demo accounts</p>
            <div className="credential-grid">
              {CREDENTIALS.map(c => (
                <div key={c.username} className="credential-item" onClick={() => fillCredentials(c)} role="button" tabIndex={0} id={`cred-${c.username}`} onKeyDown={e => e.key === 'Enter' && fillCredentials(c)}>
                  {c.label}
                  <span>{c.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
