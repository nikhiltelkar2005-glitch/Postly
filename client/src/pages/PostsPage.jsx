import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PostModal from '../components/PostModal';

const REACTIONS = ['😂', '🔥', '💀', '👀'];

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');

  const canWrite = ['admin', 'author', 'editor'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.getPosts().then(data => setPosts(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);
  const handleSaved = () => { setEditing(null); load(); };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Feed</h2>
          <p>{posts.length} post{posts.length !== 1 ? 's' : ''} from your batch</p>
        </div>
        <div className="topbar-right">
          {canWrite && (
            <button id="open-new-post-modal" className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
              New Post
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="filter-group" style={{ marginBottom: 24 }}>
          {['all', 'published', 'draft'].map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Drafts'}
              {f !== 'all' && (
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>
                  ({posts.filter(p => p.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <span>Loading posts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>Be the first to create a post.</p>
            {canWrite && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setEditing({})}>
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="feed-grid">
            {filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                onEdit={() => setEditing(post)}
                onDeleted={load}
                onReacted={load}
              />
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

function PostCard({ post, user, onEdit, onDeleted, onReacted }) {
  const canEdit   = ['admin', 'editor'].includes(user?.role) || post.authorId === user?.id;
  const canDelete = user?.role === 'admin' || post.authorId === user?.id;
  const [deleting, setDeleting] = useState(false);
  const [reacting, setReacting] = useState(false);

  const initials = post.authorName
    ? post.authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try { await api.deletePost(post.id); onDeleted(); }
    catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  };

  const handleReact = async (emoji) => {
    if (reacting) return;
    setReacting(true);
    try { await api.reactPost(post.id, emoji); onReacted(); }
    catch (_) {}
    finally { setReacting(false); }
  };

  return (
    <div className="post-card">
      <div className="post-card-header">
        <div className="post-card-author">
          <div className="user-avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{initials}</div>
          <div>
            <div className="author-name">{post.authorName || `User #${post.authorId}`}</div>
            <div className="post-meta-row">
              <span className={`badge badge-${post.status}`}>{post.status === 'published' ? 'Published' : 'Draft'}</span>
              <span className="post-time">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="post-card-actions-top">
            {canEdit && (
              <button id={`edit-post-${post.id}`} className="btn btn-ghost btn-xs" onClick={onEdit}>Edit</button>
            )}
            {canDelete && (
              <button
                id={`delete-post-${post.id}`}
                className="btn btn-ghost btn-xs"
                onClick={handleDelete}
                disabled={deleting}
              >Delete</button>
            )}
          </div>
        )}
      </div>

      {post.imageBase64 && (
        <div className="post-card-image-full">
          <img src={post.imageBase64} alt={post.title} />
        </div>
      )}

      <div className="post-card-body">
        <h4 className="post-card-title">{post.title}</h4>
        {post.content && <p className="post-card-excerpt">{post.content}</p>}
      </div>

      <div className="post-reactions">
        {REACTIONS.map(emoji => {
          const count = post.reactions?.[emoji] || 0;
          return (
            <button
              key={emoji}
              className={`reaction-btn ${count > 0 ? 'has-count' : ''}`}
              onClick={() => handleReact(emoji)}
              disabled={reacting}
            >
              {emoji} {count > 0 && <span className="reaction-count">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
