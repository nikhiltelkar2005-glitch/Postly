import { useState } from 'react';
import { api } from '../api';

export default function PostModal({ post, onClose, onSaved }) {
  const isNew = !post?.id;
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [status, setStatus] = useState(post?.status || 'draft');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
              {isNew
                ? <><path d="M12 5v14"/><path d="M5 12h14"/></>
                : <><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="M15 5l4 4"/></>
              }
            </svg>
            {isNew ? 'New Post' : 'Edit Post'}
          </h3>
          <button id="modal-close-btn" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {error}
        </div>}

        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="post-title">Title</label>
            <input id="post-title" className="form-input" type="text" placeholder="Enter an engaging post title…" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-content">Content</label>
            <textarea id="post-content" className="form-textarea" placeholder="Start writing your story…" value={content} onChange={e => setContent(e.target.value)} style={{minHeight: 180}} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-status">Status</label>
            <select id="post-status" className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button id="modal-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="modal-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              )}
              {saving ? 'Saving…' : 'Save Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
