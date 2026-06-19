import { useState, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const MAX_IMAGE_MB = 2;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NewPostPage({ onNavigate }) {
  const { user } = useAuth();
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus]   = useState('published');
  const [imageB64, setImageB64] = useState(null);
  const [imageName, setImageName] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Only image files allowed.');
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`Image too big. Max ${MAX_IMAGE_MB}MB.`);
    setError('');
    const b64 = await fileToBase64(file);
    setImageB64(b64);
    setImageName(file.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleImage(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Give your post a title.');
    setError(''); setSuccess(''); setSaving(true);
    try {
      await api.createPost({
        title: title.trim(),
        content,
        status,
        imageBase64: imageB64 || null,
      });
      setSuccess('Post created successfully.');
      setTitle(''); setContent(''); setStatus('published'); setImageB64(null); setImageName('');
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
          <h2>New Post</h2>
          <p>Create a post for your batchmates.</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('posts')}>Cancel</button>
        </div>
      </div>

      <div className="page-body">
        <div className="new-post-layout">
          <div className="card new-post-card">
            {error && <div className="alert alert-error">{error}</div>}
            {success && (
              <div className="alert alert-success">
                {success}
                <button className="link-btn" style={{ marginLeft: 'auto' }} onClick={() => onNavigate('posts')}>
                  View feed
                </button>
              </div>
            )}

            <form id="new-post-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Image (optional)</label>
                <div
                  className={`image-drop-zone ${dragging ? 'dragging' : ''} ${imageB64 ? 'has-image' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !imageB64 && fileRef.current.click()}
                  style={imageB64 ? { cursor: 'default' } : {}}
                >
                  {imageB64 ? (
                    <div className="image-preview-wrap">
                      <img src={imageB64} alt="preview" className="image-preview" />
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={e => { e.stopPropagation(); setImageB64(null); setImageName(''); }}
                      >Remove</button>
                      <span className="image-name">{imageName}</span>
                    </div>
                  ) : (
                    <div className="image-drop-inner">
                      <p>Drag & drop an image here, or <span className="link-text">click to browse</span></p>
                      <p className="image-drop-hint">Max {MAX_IMAGE_MB}MB &middot; JPG, PNG, GIF, WEBP</p>
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
                <label className="form-label" htmlFor="new-post-title">Title</label>
                <input
                  id="new-post-title"
                  className="form-input form-input-lg"
                  type="text"
                  placeholder="Enter your post title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-post-content">Content</label>
                <textarea
                  id="new-post-content"
                  className="form-textarea"
                  placeholder="Write something..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ minHeight: 180 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-post-status">Visibility</label>
                <select
                  id="new-post-status"
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="published">Post publicly</option>
                  <option value="draft">Save as draft</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  id="new-post-submit-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {saving ? <><span className="spinner" /> Posting…</> : <>{status === 'published' ? 'Post' : 'Save Draft'}</>}
                </button>
                <button
                  id="new-post-cancel-btn"
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate('posts')}
                >Cancel</button>
              </div>
            </form>
          </div>

          <div className="new-post-tips">
            <div className="card tips-card">
              <h4>Post Tips</h4>
              <ul>
                <li>Be specific &mdash; vague posts get ignored.</li>
                <li>Images get more engagement.</li>
                <li>Keep it constructive.</li>
                <li>This is college-only &mdash; no outsiders.</li>
              </ul>
            </div>
            <div className="card tips-card" style={{ marginTop: 16 }}>
              <h4>Posting as</h4>
              <div className="posting-as">
                <div className="user-avatar">{user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
                <div>
                  <div className="user-name">{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email || user?.username}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
