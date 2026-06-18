import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches = [api.getPosts().then(setPosts)];
    if (user?.role === 'admin') fetches.push(api.getUsers().then(setUsers));
    Promise.all(fetches).finally(() => setLoading(false));
  }, [user]);

  const published = posts.filter(p => p.status === 'published').length;
  const drafts    = posts.filter(p => p.status === 'draft').length;
  const myPosts   = posts.filter(p => p.authorId === user?.id).length;

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <span>Loading dashboard…</span>
    </div>
  );

  const canWrite = ['admin','author','editor'].includes(user?.role);

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <h2 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="page-subtitle">Here's what's happening on Postly today.</p>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">📝</div>
            <div>
              <div className="stat-value">{posts.length}</div>
              <div className="stat-label">Total Posts</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value">{published}</div>
              <div className="stat-label">Published</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">📋</div>
            <div>
              <div className="stat-value">{drafts}</div>
              <div className="stat-label">Drafts</div>
            </div>
          </div>
          {user?.role === 'admin' ? (
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div>
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
          ) : (
            <div className="stat-card">
              <div className="stat-icon blue">🖊️</div>
              <div>
                <div className="stat-value">{myPosts}</div>
                <div className="stat-label">My Posts</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="page-header-actions">
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Recent Posts</h3>
          {canWrite && (
            <button id="dash-new-post-btn" className="btn btn-primary btn-sm" onClick={() => onNavigate('new-post')}>
              ✏️ New Post
            </button>
          )}
        </div>

        <div className="posts-grid">
          {posts.slice(0, 6).map(post => (
            <div key={post.id} className="post-card">
              <div className="post-card-header">
                <h4 className="post-title">{post.title}</h4>
                <span className={`badge badge-${post.status}`}>{post.status}</span>
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-card-footer">
                <span className="post-meta">Post #{post.id}</span>
                <button
                  id={`view-post-${post.id}`}
                  className="btn btn-ghost btn-sm"
                  onClick={() => onNavigate('posts')}
                >View →</button>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No posts yet</h3>
            <p>Be the first to create a post!</p>
          </div>
        )}
      </div>
    </>
  );
}
