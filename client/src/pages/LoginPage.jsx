import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CREDENTIALS = [
  { label: 'Admin',   username: 'admin',   password: 'admin123'  },
  { label: 'Author',  username: 'author1', password: 'author123' },
  { label: 'Editor',  username: 'editor1', password: 'editor123' },
  { label: 'Reader',  username: 'reader1', password: 'reader123' },
];

export default function LoginPage() {
  const { login }         = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
      <div className="login-card">
        <div className="login-logo">
          <h1>Postly</h1>
          <p>Sign in to your blogging workspace</p>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username-input">Username</label>
            <input
              id="username-input"
              className="form-input"
              type="text"
              placeholder="Enter username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              className="form-input"
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '🚀'}&nbsp;
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Quick fill — demo accounts</p>
          <div className="credential-grid">
            {CREDENTIALS.map(c => (
              <div
                key={c.username}
                className="credential-item"
                onClick={() => fillCredentials(c)}
                role="button"
                tabIndex={0}
                id={`cred-${c.username}`}
                onKeyDown={e => e.key === 'Enter' && fillCredentials(c)}
              >
                {c.label} <span>· {c.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
