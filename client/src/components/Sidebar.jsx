import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',      section: 'Main' },
  { id: 'posts',     label: 'Feed',      section: 'Content' },
  { id: 'new-post',  label: 'New Post',  section: 'Content', roles: ['admin', 'author', 'editor'] },
  { id: 'profile',   label: 'My Profile', section: 'Content' },
  { id: 'users',     label: 'Members',   section: 'Admin', roles: ['admin'] },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();

  const visible  = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role));
  const sections = [...new Set(visible.map(i => i.section))];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">P</div>
          <div className="logo-text">
            <h1>Postly</h1>
            <p>ADYPU Edition</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section} className="nav-section">
            <span className="nav-label">{section}</span>
            {visible.filter(i => i.section === section).map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">{user?.anonymousId || 'Anonymous'}</div>
            <div className="user-role">
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button id="logout-btn" className="logout-btn" onClick={logout} title="Logout">
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
