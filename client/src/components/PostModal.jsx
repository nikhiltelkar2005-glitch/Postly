import { useState } from 'react';
import { api } from '../api';

export default function PostModal({ post, onClose, onSaved }) {
  const isNew = !post?.id;
  const [title,   setTitle]   = useState(post?.title   || '');
  const [content, setContent] = useState(post?.content || '');
  const [status,  setStatus]  = useState(post?.status  || 'draft');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required.');
    setError('');
    setSaving(true);
    try {
      if (isNew) {
        await api.createPost({ title, content, status });
      } else {
        await api.updatePost(post.id, { title, content, status });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 className="modal-title" id="modal-title">
            {isNew ? '✏️ New Post' : '🖊️ Edit Post'}
          </h3>
          <button id="modal-close-btn" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="post-title">Title</label>
            <input
              id="post-title"
              className="form-input"
              type="text"
              placeholder="Enter post title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-content">Content</label>
            <textarea
              id="post-content"
              className="form-textarea"
              placeholder="Write your post content…"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-status">Status</label>
            <select
              id="post-status"
              className="form-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button id="modal-cancel-btn" type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button id="modal-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : '💾'}&nbsp;
              {saving ? 'Saving…' : 'Save Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
