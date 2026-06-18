import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PostModal from '../components/PostModal';

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);
  const [filter, setFilter]     = useState('all');

  const canWrite = ['admin','author','editor'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.getPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all'
    ? posts
    : posts.filter(p => p.status === filter);

  const handleSaved = () => { setEditing(null); load(); };

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <h2 className="page-title">All Posts</h2>
          <p className="page-subtitle">{posts.length} posts total</p>
        </div>
      </div>

      <div className="page-body">
        <div className="page-header-actions">
          <div className="header-right">
            {['all','published','draft'].map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {canWrite && (
            <button
              id="open-new-post-modal"
              className="btn btn-primary btn-sm"
              onClick={() => setEditing({})}
            >✏️ New Post</button>
          )}
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <span>Loading posts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No posts found</h3>
            <p>Try a different filter or create a new post.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                onEdit={() => setEditing(post)}
                onSaved={load}
              />
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <PostModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

function PostCard({ post, user, onEdit, onSaved }) {
  const canEdit = ['admin','editor'].includes(user?.role) || post.authorId === user?.id;

  return (
    <div className="post-card">
      <div className="post-card-header">
        <h4 className="post-title">{post.title}</h4>
        <span className={`badge badge-${post.status}`}>{post.status}</span>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-card-footer">
        <span className="post-meta">Post #{post.id} · Author #{post.authorId}</span>
        <div className="post-actions">
          {canEdit && (
            <button
              id={`edit-post-${post.id}`}
              className="btn btn-ghost btn-sm"
              onClick={onEdit}
            >✏️ Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}
