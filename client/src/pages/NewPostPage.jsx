import { useState } from 'react';
import { api } from '../api';

export default function NewPostPage({ onNavigate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required.');
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.createPost({ title, content, status });
      setSuccess('Post created successfully!');
      setTitle('');
      setContent('');
      setStatus('draft');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Create Post</h2>
          <p>Write and publish a new blog post.</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('posts')}>
            Cancel
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 720 }}>
          {error && <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>}

          {success && (
            <div className="alert alert-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {success}
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }} onClick={() => onNavigate('posts')}>
                View all posts →
              </button>
            </div>
          )}

          <form id="new-post-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-post-title">Title</label>
              <input id="new-post-title" className="form-input" type="text" placeholder="Enter an engaging post title…" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-post-content">Content</label>
              <textarea id="new-post-content" className="form-textarea" placeholder="Start writing your story…" value={content} onChange={e => setContent(e.target.value)} style={{ minHeight: 240 }} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-post-status">Status</label>
              <select id="new-post-status" className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button id="new-post-submit-btn" type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                )}
                {saving ? 'Publishing…' : status === 'published' ? 'Publish Post' : 'Save Draft'}
              </button>
              <button id="new-post-cancel-btn" type="button" className="btn btn-secondary" onClick={() => onNavigate('posts')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
