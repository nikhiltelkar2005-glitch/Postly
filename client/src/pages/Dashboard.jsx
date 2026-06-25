import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPosts().then(data => setPosts(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  const published = posts.filter(p => p.status === 'published').length;
  const drafts    = posts.filter(p => p.status === 'draft').length;
  const myPosts   = posts.filter(p => p.authorId === user?.id).length;
  const canWrite  = ['admin', 'author', 'editor'].includes(user?.role);

  const topReacted = [...posts]
    .filter(p => p.status === 'published')
    .sort((a, b) => {
      const sumReactions = obj => Object.values(obj?.reactions || {}).reduce((s, v) => s + v, 0);
      return sumReactions(b) - sumReactions(a);
    })
    .slice(0, 3);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <span>Loading feed…</span>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Dashboard</h2>
          <p>Welcome, {user?.anonymousId || 'Anonymous'}.</p>
        </div>
        <div className="topbar-right">
          {canWrite && (
            <button id="dash-new-post-btn" className="btn btn-primary btn-sm" onClick={() => onNavigate('new-post')}>
              New Post
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-body">
              <div className="stat-value">{posts.length}</div>
              <div className="stat-label">Total Posts</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-body">
              <div className="stat-value">{published}</div>
              <div className="stat-label">Published</div>
              {published > 0 && <div className="stat-trend up">{Math.round(published/Math.max(posts.length,1)*100)}% live</div>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-body">
              <div className="stat-value">{drafts}</div>
              <div className="stat-label">Drafts</div>
              {drafts > 0 && <div className="stat-trend down">Needs posting</div>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-body">
              <div className="stat-value">{myPosts}</div>
              <div className="stat-label">My Posts</div>
              {myPosts > 0 && <div className="stat-trend up">Keep it up!</div>}
            </div>
          </div>
        </div>

        {topReacted.length > 0 && (
          <>
            <div className="page-header-actions">
              <h3 className="section-title">Trending</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('posts')}>See all</button>
            </div>
            <div className="trending-list">
              {topReacted.map((post, i) => {
                const totalReactions = Object.values(post.reactions || {}).reduce((s, v) => s + v, 0);
                return (
                  <div key={post.id} className="trending-item" onClick={() => onNavigate('posts')}>
                    <span className="trending-rank">{['#1','#2','#3'][i]}</span>
                    <div className="trending-content">
                      <div className="trending-title">{post.title}</div>
                      <div className="trending-meta">by {post.authorName || 'Unknown'} &middot; {totalReactions} reactions</div>
                    </div>
                    {post.imageBase64 && (
                      <img src={post.imageBase64} className="trending-thumb" alt="" />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="page-header-actions" style={{ marginTop: 32 }}>
          <h3 className="section-title">Recent Posts</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('posts')}>View All</button>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Be the first to create a post.</p>
            {canWrite && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('new-post')}>
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="feed-grid">
            {posts.slice(0, 4).map(post => (
              <div key={post.id} className="post-card mini-post-card" onClick={() => onNavigate('posts')} style={{ cursor: 'pointer' }}>
                {post.imageBase64 && (
                  <div className="post-card-image-full" style={{ maxHeight: 140 }}>
                    <img src={post.imageBase64} alt={post.title} />
                  </div>
                )}
                <div className="post-card-body">
                  <h4 className="post-card-title">{post.title}</h4>
                  {post.content && <div className="post-card-excerpt" dangerouslySetInnerHTML={{ __html: post.content }} />}
                  <div className="post-reactions" style={{ pointerEvents: 'none' }}>
                    {Object.entries(post.reactions || {}).filter(([,v])=>v>0).map(([emoji, count]) => (
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
