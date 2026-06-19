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
  const drafts = posts.filter(p => p.status === 'draft').length;
  const myPosts = posts.filter(p => p.authorId === user?.id).length;
  const canWrite = ['admin', 'author', 'editor'].includes(user?.role);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <span>Loading dashboard…</span>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Dashboard</h2>
          <p>Welcome back, {user?.name?.split(' ')[0]} — here's what's happening today.</p>
        </div>
        <div className="topbar-right">
          {canWrite && (
            <button id="dash-new-post-btn" className="btn btn-primary btn-sm" onClick={() => onNavigate('new-post')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              New Post
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{posts.length}</div>
              <div className="stat-label">Total Posts</div>
              <div className="stat-trend up">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}><polyline points="18 15 12 9 6 15"/></svg>
                Active
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{published}</div>
              <div className="stat-label">Published</div>
              {published > 0 && <div className="stat-trend up">{Math.round(published/posts.length*100)}% of posts</div>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <div className="stat-body">
              <div className="stat-value">{drafts}</div>
              <div className="stat-label">Drafts</div>
              {drafts > 0 && <div className="stat-trend down">Needs review</div>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              {user?.role === 'admin' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
            </div>
            <div className="stat-body">
              <div className="stat-value">{user?.role === 'admin' ? users.length : myPosts}</div>
              <div className="stat-label">{user?.role === 'admin' ? 'Total Users' : 'My Posts'}</div>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <h3 className="section-title">Recent Posts</h3>
          <div className="header-right">
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('posts')}>
              View All
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <div className="posts-grid">
          {posts.slice(0, 6).map(post => (
            <div key={post.id} className="post-card">
              <div className="post-card-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span className={`badge badge-${post.status}`}>{post.status}</span>
              </div>
              <div className="post-card-body">
                <h4 className="post-card-title">{post.title}</h4>
                <p className="post-card-excerpt">{post.content}</p>
                <div className="post-card-footer">
                  <div className="post-card-meta">
                    <div className="post-card-author">
                      <span className="avatar-dot">P</span>
                      Post #{post.id}
                    </div>
                  </div>
                  <div className="post-card-actions">
                    <button id={`dash-view-post-${post.id}`} className="btn btn-ghost btn-xs" onClick={() => onNavigate('posts')}>
                      Read
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3>No posts yet</h3>
            <p>Be the first to create a blog post!</p>
            {canWrite && (
              <button className="btn btn-primary" style={{marginTop:16}} onClick={() => onNavigate('new-post')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                Create Your First Post
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
