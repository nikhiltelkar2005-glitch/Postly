import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPosts()
      .then(data => {
        const mine = (Array.isArray(data) ? data : []).filter(p => p.authorId === user?.id);
        setPosts(mine);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
  const totalReactions = posts.reduce((sum, p) => sum + Object.values(p.reactions || {}).reduce((s,v)=>s+v,0), 0);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>My Profile</h2>
          <p>Your personal dashboard.</p>
        </div>
      </div>

      <div className="page-body">
        <div className="profile-hero">
          <div className="profile-avatar-lg">{initials}</div>
          <div className="profile-info">
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email">{user?.email || user?.username}</p>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="profile-stat-val">{posts.length}</div>
              <div className="profile-stat-lbl">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{posts.filter(p=>p.status==='published').length}</div>
              <div className="profile-stat-lbl">Published</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{totalReactions}</div>
              <div className="profile-stat-lbl">Reactions</div>
            </div>
          </div>
        </div>

        <h3 className="section-title" style={{ marginBottom: 20, marginTop: 32 }}>My Posts</h3>

        {loading ? (
          <div className="loading-page"><div className="spinner" /><span>Loading your posts…</span></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>You haven't posted anything yet.</h3>
            <p>Create your first post to get started.</p>
          </div>
        ) : (
          <div className="feed-grid">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                {post.imageBase64 && (
                  <div className="post-card-image-full"><img src={post.imageBase64} alt={post.title} /></div>
                )}
                <div className="post-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h4 className="post-card-title" style={{ margin: 0 }}>{post.title}</h4>
                    <span className={`badge badge-${post.status}`}>{post.status}</span>
                  </div>
                  {post.content && <p className="post-card-excerpt">{post.content}</p>}
                  <div className="post-time" style={{ marginTop: 8 }}>{timeAgo(post.createdAt)}</div>
                  <div className="post-reactions" style={{ marginTop: 8 }}>
                    {Object.entries(post.reactions || {}).filter(([,v])=>v>0).map(([emoji,count]) => (
                      <span key={emoji} className="reaction-btn has-count" style={{ pointerEvents:'none' }}>
                        {emoji} <span className="reaction-count">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
