import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage   from './pages/LoginPage';
import Dashboard   from './pages/Dashboard';
import PostsPage   from './pages/PostsPage';
import NewPostPage from './pages/NewPostPage';
import UsersPage   from './pages/UsersPage';
import Sidebar     from './components/Sidebar';

function AppShell() {
  const { user, loading } = useAuth();
  const [page, setPage]   = useState('dashboard');

  if (loading) {
    return (
      <div className="loading-page" style={{ height: '100vh' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
        <span style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>Loading Postly…</span>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const canAccess = (p) => {
    if (p === 'users'    && user.role !== 'admin')                          return false;
    if (p === 'new-post' && !['admin','author','editor'].includes(user.role)) return false;
    return true;
  };

  const navigate = (p) => {
    if (canAccess(p)) setPage(p);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'posts':     return <PostsPage />;
      case 'new-post':  return <NewPostPage onNavigate={navigate} />;
      case 'users':     return canAccess('users') ? <UsersPage /> : <Dashboard onNavigate={navigate} />;
      default:          return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={navigate} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
