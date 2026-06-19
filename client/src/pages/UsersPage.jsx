import { useEffect, useState } from 'react';
import { api } from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Users</h2>
          <p>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {error}
        </div>}

        {loading ? (
          <div className="loading-page">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <span>Loading users…</span>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} id={`user-row-${u.id}`}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600, width: 60 }}>{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
