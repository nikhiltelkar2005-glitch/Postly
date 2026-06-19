import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PostModal from '../components/PostModal';

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');

  const canWrite = ['admin', 'author', 'editor'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.getPosts().then(setPosts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  const handleSaved = () => { setEditing(null); load(); };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Posts</h2>
          <p>{posts.length} post{posts.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="topbar-right">
          {canWrite && (
            <button id="open-new-post-modal" className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              New Post
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="page-header-actions">
          <div className="filter-group">
            {['all', 'published', 'draft'].map(f => (
              <button key={f} id={`filter-${f}`} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span style={{marginLeft:4, fontSize:11, opacity:0.6}}>
                    ({posts.filter(p => p.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <span>Loading posts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3>No posts found</h3>
            <p>Try a different filter or create a new post.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {filtered.map(post => (
              <PostCard key={post.id} post={post} user={user} onEdit={() => setEditing(post)} onSaved={load} />
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <PostModal post={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </>
  );
}

function PostCard({ post, user, onEdit }) {
  const canEdit = ['admin', 'editor'].includes(user?.role) || post.authorId === user?.id;

  const bannerColor = post.status === 'published'
    ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)'
    : 'linear-gradient(135deg, #fffbeb, #fef3c7)';

  const BannerIcon = post.status === 'published'
    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

  return (
    <div className="post-card">
      <div className="post-card-image" style={{ background: bannerColor }}>
        {BannerIcon}
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
            <span>·</span>
            <span>Author #{post.authorId}</span>
          </div>
          <div className="post-card-actions">
            {canEdit && (
              <button id={`edit-post-${post.id}`} className="btn btn-secondary btn-xs" onClick={onEdit}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="M15 5l4 4"/></svg>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
