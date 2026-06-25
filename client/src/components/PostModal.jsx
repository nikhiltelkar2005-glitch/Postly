import { useState, useRef } from 'react';
import { api } from '../api';
import RichEditor from './RichEditor';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PostModal({ post, onClose, onSaved }) {
  const isNew = !post?.id;
  const [title,   setTitle]   = useState(post?.title   || '');
  const [content, setContent] = useState(post?.content || '');
  const [status,  setStatus]  = useState(post?.status  || 'draft');
  const [imageB64, setImageB64] = useState(post?.imageBase64 || null);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef();

  const handleImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Images only.');
    if (file.size > 2 * 1024 * 1024) return setError('Max 2MB per image.');
    setError('');
    setImageB64(await fileToBase64(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required.');
    setError(''); setSaving(true);
    try {
      if (isNew) {
        await api.createPost({ title, content, status, imageBase64: imageB64 || null });
      } else {
        await api.updatePost(post.id, { title, content, status, imageBase64: imageB64 || null });
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
            {isNew ? 'New Post' : 'Edit Post'}
          </h3>
          <button id="modal-close-btn" className="modal-close" onClick={onClose}>Close</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Image (optional)</label>
            <div
              className={`image-drop-zone compact ${imageB64 ? 'has-image' : ''}`}
              onClick={() => !imageB64 && fileRef.current.click()}
            >
              {imageB64 ? (
                <div className="image-preview-wrap">
                  <img src={imageB64} alt="preview" className="image-preview" style={{ maxHeight: 120 }} />
                  <button type="button" className="image-remove-btn" onClick={e => { e.stopPropagation(); setImageB64(null); }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="image-drop-inner" style={{ padding: '16px 0' }}>
                  <p style={{ fontSize: 13 }}>Click to add image</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleImage(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-title">Title</label>
            <input id="post-title" className="form-input" type="text" placeholder="Post title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Content</label>
            <RichEditor content={content} onChange={setContent} />
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
              {saving ? <><span className="spinner" /> Saving…</> : (isNew ? 'Post' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
