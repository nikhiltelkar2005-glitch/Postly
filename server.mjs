/**
 * Postly College Edition — Backend Server 🎓
 * Drop-in replacement for n8n (runs on port 5678, same webhook paths)
 * Run: node server.mjs
 * 
 * Routes (mirror n8n webhook paths):
 *   POST   /webhook/postly/auth/register
 *   POST   /webhook/postly/auth/login
 *   POST   /webhook/postly/auth/logout
 *   GET    /webhook/postly/auth/me
 *   GET    /webhook/postly/posts
 *   GET    /webhook/postly/posts/:id
 *   POST   /webhook/postly/posts
 *   PUT    /webhook/postly/posts/:id
 *   DELETE /webhook/postly/posts/:id
 *   POST   /webhook/postly/posts/:id/react
 *   GET    /webhook/postly/users
 */

import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir      = dirname(fileURLToPath(import.meta.url));
const PORT       = 5678;
const DATA_FILE  = join(__dir, 'postly-data.json');
const JWT_SECRET = 'PostlyADYPU2024SecretKey';
const COLLEGE    = 'adypu.edu.in';
const CORS_ORIGIN = 'http://localhost:3000';

// ─── Data helpers ──────────────────────────────────────────────────────────
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { users: [], posts: [], tokenBlacklist: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── JWT helpers ───────────────────────────────────────────────────────────
function b64url(s) {
  return Buffer.from(s).toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function signJWT(payload) {
  const h = b64url(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const b = b64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now()/1000),
    exp: Math.floor(Date.now()/1000) + 86400 // 24h
  }));
  const sig = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${h}.${b}`).digest('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return `${h}.${b}.${sig}`;
}
function verifyJWT(token) {
  if (!token) throw new Error('Missing token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [h, b, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${h}.${b}`).digest('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  if (sig !== expected) throw new Error('Invalid token signature');
  const payload = JSON.parse(Buffer.from(b, 'base64').toString());
  if (payload.exp < Math.floor(Date.now()/1000)) throw new Error('Token expired');
  return payload;
}
function getToken(req) {
  return (req.headers['authorization'] || '').replace('Bearer ', '').trim();
}
function authenticate(req) {
  const token = getToken(req);
  const data = readData();
  if (data.tokenBlacklist.includes(token)) throw new Error('Token revoked — please login again');
  return verifyJWT(token);
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(payload);
}
function readBody(req) {
  return new Promise(resolve => {
    if (req.method === 'GET' || req.method === 'DELETE') return resolve({});
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
  });
}

// ─── Password hashing (simple SHA256) ────────────────────────────────────
function hashPwd(pwd) {
  return crypto.createHash('sha256').update(pwd + JWT_SECRET).digest('hex');
}

// ─── Route handler ─────────────────────────────────────────────────────────
async function handle(req, res) {
  const method = req.method;
  const url    = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  // ── CORS preflight ──
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  const body = await readBody(req);

  // ── POST /webhook/postly/auth/register ──
  if (url === '/webhook/postly/auth/register' && method === 'POST') {
    const { name, email, password } = body;
    if (!name || !email || !password)
      return json(res, 400, { message: 'Name, email and password required' });
    if (!email.endsWith(`@${COLLEGE}`))
      return json(res, 403, { message: `Only @${COLLEGE} emails allowed` });
    if (password.length < 6)
      return json(res, 400, { message: 'Password must be at least 6 characters' });

    const data = readData();
    if (data.users.find(u => u.email === email))
      return json(res, 409, { message: 'Email already registered' });

    const user = {
      id: Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashPwd(password),
      role: 'author',
      college: COLLEGE,
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    writeData(data);

    const token = signJWT({ userId: user.id, email: user.email, role: user.role, college: user.college });
    const { password: _, ...safeUser } = user;
    return json(res, 201, { accessToken: token, user: safeUser });
  }

  // ── POST /webhook/postly/auth/login ──
  if (url === '/webhook/postly/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password)
      return json(res, 400, { message: 'Email and password required' });
    if (!email.endsWith(`@${COLLEGE}`))
      return json(res, 403, { message: `Only @${COLLEGE} emails allowed` });

    const data = readData();
    const user = data.users.find(u => u.email === email.toLowerCase().trim() && u.password === hashPwd(password));
    if (!user)
      return json(res, 401, { message: 'Wrong email or password' });

    const token = signJWT({ userId: user.id, email: user.email, role: user.role, college: user.college });
    const { password: _, ...safeUser } = user;
    return json(res, 200, { accessToken: token, user: safeUser });
  }

  // ── POST /webhook/postly/auth/logout ──
  if (url === '/webhook/postly/auth/logout' && method === 'POST') {
    const token = getToken(req);
    if (token) {
      const data = readData();
      if (!data.tokenBlacklist.includes(token)) data.tokenBlacklist.push(token);
      // Prune old blacklist entries (keep max 500)
      if (data.tokenBlacklist.length > 500) data.tokenBlacklist = data.tokenBlacklist.slice(-500);
      writeData(data);
    }
    return json(res, 200, { message: 'Logged out' });
  }

  // ── GET /webhook/postly/auth/me ──
  if (url === '/webhook/postly/auth/me' && method === 'GET') {
    try {
      const payload = authenticate(req);
      const data = readData();
      const user = data.users.find(u => u.id === payload.userId);
      if (!user) return json(res, 404, { message: 'User not found' });
      const { password: _, ...safeUser } = user;
      return json(res, 200, safeUser);
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  // ── GET /webhook/postly/posts ──
  if (url === '/webhook/postly/posts' && method === 'GET') {
    try {
      const payload = authenticate(req);
      const data = readData();
      // Only return posts from same college
      const posts = data.posts
        .filter(p => p.college === payload.college)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // Attach author name
      const withNames = posts.map(p => {
        const author = data.users.find(u => u.id === p.authorId);
        return { ...p, authorName: author?.name || 'Unknown' };
      });
      return json(res, 200, withNames);
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  // ── GET /webhook/postly/posts/:id ──
  const singlePost = url.match(/^\/webhook\/postly\/posts\/(\d+)$/);
  if (singlePost && method === 'GET') {
    try {
      const payload = authenticate(req);
      const data = readData();
      const post = data.posts.find(p => p.id === Number(singlePost[1]) && p.college === payload.college);
      if (!post) return json(res, 404, { message: 'Post not found' });
      const author = data.users.find(u => u.id === post.authorId);
      return json(res, 200, { ...post, authorName: author?.name || 'Unknown' });
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  // ── POST /webhook/postly/posts ──
  if (url === '/webhook/postly/posts' && method === 'POST') {
    try {
      const payload = authenticate(req);
      if (!['admin', 'author', 'editor'].includes(payload.role))
        return json(res, 403, { message: 'You do not have permission to post' });

      const { title, content, status, imageBase64 } = body;
      if (!title?.trim()) return json(res, 400, { message: 'Title is required' });

      const data = readData();
      const newPost = {
        id: Date.now(),
        title: title.trim(),
        content: content || '',
        status: status || 'published',
        imageBase64: imageBase64 || null,
        authorId: payload.userId,
        college: payload.college,
        reactions: { '😂': 0, '🔥': 0, '💀': 0, '👀': 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.posts.push(newPost);
      writeData(data);

      const author = data.users.find(u => u.id === newPost.authorId);
      return json(res, 201, { ...newPost, authorName: author?.name });
    } catch (e) {
      return json(res, e.message.includes('token') ? 401 : 400, { message: e.message });
    }
  }

  // ── PUT /webhook/postly/posts/:id ──
  const updatePost = url.match(/^\/webhook\/postly\/posts\/(\d+)$/);
  if (updatePost && method === 'PUT') {
    try {
      const payload = authenticate(req);
      const data = readData();
      const idx = data.posts.findIndex(p => p.id === Number(updatePost[1]) && p.college === payload.college);
      if (idx === -1) return json(res, 404, { message: 'Post not found' });

      const post = data.posts[idx];
      const canEdit = ['admin', 'editor'].includes(payload.role) || post.authorId === payload.userId;
      if (!canEdit) return json(res, 403, { message: 'You cannot edit someone else\'s post' });

      const { title, content, status, imageBase64 } = body;
      if (title !== undefined) post.title = title.trim();
      if (content !== undefined) post.content = content;
      if (status !== undefined) post.status = status;
      if (imageBase64 !== undefined) post.imageBase64 = imageBase64;
      post.updatedAt = new Date().toISOString();

      data.posts[idx] = post;
      writeData(data);
      const author = data.users.find(u => u.id === post.authorId);
      return json(res, 200, { ...post, authorName: author?.name });
    } catch (e) {
      return json(res, e.message.includes('token') ? 401 : 400, { message: e.message });
    }
  }

  // ── DELETE /webhook/postly/posts/:id ──
  const deletePost = url.match(/^\/webhook\/postly\/posts\/(\d+)$/);
  if (deletePost && method === 'DELETE') {
    try {
      const payload = authenticate(req);
      const data = readData();
      const idx = data.posts.findIndex(p => p.id === Number(deletePost[1]) && p.college === payload.college);
      if (idx === -1) return json(res, 404, { message: 'Post not found' });

      const post = data.posts[idx];
      const canDelete = payload.role === 'admin' || post.authorId === payload.userId;
      if (!canDelete) return json(res, 403, { message: 'Not your post to delete' });

      data.posts.splice(idx, 1);
      writeData(data);
      return json(res, 200, { message: 'Post deleted' });
    } catch (e) {
      return json(res, e.message.includes('token') ? 401 : 400, { message: e.message });
    }
  }

  // ── POST /webhook/postly/posts/:id/react ──
  const reactPost = url.match(/^\/webhook\/postly\/posts\/(\d+)\/react$/);
  if (reactPost && method === 'POST') {
    try {
      const payload = authenticate(req);
      const { emoji } = body;
      const allowed = ['😂','🔥','💀','👀'];
      if (!allowed.includes(emoji)) return json(res, 400, { message: 'Unknown reaction' });

      const data = readData();
      const idx = data.posts.findIndex(p => p.id === Number(reactPost[1]) && p.college === payload.college);
      if (idx === -1) return json(res, 404, { message: 'Post not found' });

      if (!data.posts[idx].reactions) data.posts[idx].reactions = {};
      data.posts[idx].reactions[emoji] = (data.posts[idx].reactions[emoji] || 0) + 1;
      writeData(data);
      return json(res, 200, { reactions: data.posts[idx].reactions });
    } catch (e) {
      return json(res, e.message.includes('token') ? 401 : 400, { message: e.message });
    }
  }

  // ── GET /webhook/postly/users ──
  if (url === '/webhook/postly/users' && method === 'GET') {
    try {
      const payload = authenticate(req);
      if (payload.role !== 'admin')
        return json(res, 403, { message: 'Admins only' });
      const data = readData();
      const safeUsers = data.users
        .filter(u => u.college === payload.college)
        .map(({ password: _, ...u }) => u);
      return json(res, 200, safeUsers);
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  // ── 404 ──
  json(res, 404, { message: 'Route not found' });
}

// ─── Start server ──────────────────────────────────────────────────────────
const server = http.createServer(handle);
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🎓 Postly Backend Server — ADYPU Edition                ║');
  console.log(`║  Running at http://localhost:${PORT}                        ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  College domain : @adypu.edu.in                          ║');
  console.log(`║  Data file      : postly-data.json                       ║`);
  console.log('║  Default admin  : admin@adypu.edu.in / admin123          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Endpoints at /webhook/postly/...');
  console.log('  Press Ctrl+C to stop.\n');
});
