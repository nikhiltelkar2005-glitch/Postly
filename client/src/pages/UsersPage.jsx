import { useEffect, useState } from 'react';
import { api } from '../api';

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const roleColors = {
    admin:  'badge-admin',
    author: 'badge-author',
    editor: 'badge-editor',
    reader: 'badge-reader',
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

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
                  <th>Username</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} id={`user-row-${u.id}`}>
                    <td style={{ color: 'var(--color-text-dim)', fontWeight: 600 }}>{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>@{u.username}</td>
                    <td>
                      <span className={`badge ${roleColors[u.role] || ''}`}>{u.role}</span>
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
