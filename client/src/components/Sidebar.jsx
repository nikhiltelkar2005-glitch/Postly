import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard'   },
  { id: 'posts',     icon: '📝', label: 'Posts'       },
  { id: 'new-post',  icon: '✏️',  label: 'New Post',
    roles: ['admin', 'author', 'editor'] },
  { id: 'users',     icon: '👥', label: 'Users',
    roles: ['admin'] },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();

  const visible = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleBadge = `badge badge-${user?.role}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Postly</h1>
        <p>Blogging Platform</p>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Menu</span>
        {visible.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              <span className={roleBadge}>{user?.role}</span>
            </div>
          </div>
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={logout}
            title="Logout"
          >⏻</button>
        </div>
      </div>
    </aside>
  );
}
