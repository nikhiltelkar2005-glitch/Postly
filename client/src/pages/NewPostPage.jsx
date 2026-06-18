import { useState } from 'react';
import { api } from '../api';

export default function NewPostPage({ onNavigate }) {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [status,  setStatus]  = useState('draft');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required.');
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await api.createPost({ title, content, status });
      setSuccess('Post created successfully! 🎉');
      setTitle(''); setContent(''); setStatus('draft');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <h2 className="page-title">Create New Post</h2>
          <p className="page-subtitle">Write and publish your new blog post.</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 680 }}>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && (
            <div className="alert alert-success">
              {success}&nbsp;
              <button
                style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontWeight:600 }}
                onClick={() => onNavigate('posts')}
              >View all posts →</button>
            </div>
          )}

          <form id="new-post-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-post-title">Title</label>
              <input
                id="new-post-title"
                className="form-input"
                type="text"
                placeholder="Enter an engaging post title…"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-post-content">Content</label>
              <textarea
                id="new-post-content"
                className="form-textarea"
                placeholder="Start writing your post…"
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ minHeight: 200 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-post-status">Status</label>
              <select
                id="new-post-status"
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="draft">📋 Draft</option>
                <option value="published">✅ Published</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                id="new-post-submit-btn"
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? <span className="spinner" /> : '🚀'}&nbsp;
                {saving ? 'Publishing…' : 'Publish Post'}
              </button>
              <button
                id="new-post-cancel-btn"
                type="button"
                className="btn btn-ghost"
                onClick={() => onNavigate('posts')}
              >Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
