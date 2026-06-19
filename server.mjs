import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';

const __dir      = dirname(fileURLToPath(import.meta.url));
const PORT       = 5678;
const DATA_FILE  = join(__dir, 'postly-data.json');
const JWT_SECRET = 'PostlyADYPU2024SecretKey';
const COLLEGE    = 'adypu.edu.in';
const CORS_ORIGIN = 'http://localhost:3000';

const OTP_STORE = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000;

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let transporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function generateAnonymousId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `Student_${code}`;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { users: [], posts: [], tokenBlacklist: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function b64url(s) {
  return Buffer.from(s).toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function signJWT(payload) {
  const h = b64url(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const b = b64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now()/1000),
    exp: Math.floor(Date.now()/1000) + 86400
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
  if (data.tokenBlacklist.includes(token)) throw new Error('Token revoked');
  return verifyJWT(token);
}

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

async function handle(req, res) {
  const method = req.method;
  const url    = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    return res.end();
  }

  const body = await readBody(req);

  // ── POST /webhook/postly/auth/send-otp ──
  if (url === '/webhook/postly/auth/send-otp' && method === 'POST') {
    const { email } = body;
    if (!email) return json(res, 400, { message: 'Email is required.' });
    if (!email.toLowerCase().endsWith(`@${COLLEGE}`))
      return json(res, 403, { message: `Only @${COLLEGE} emails are allowed.` });

    const otp = generateOTP();
    const key = email.toLowerCase().trim();

    OTP_STORE.set(key, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

    console.log(`\n[OTP] ${key} -> ${otp} (expires in 5 min)`);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Postly" <${EMAIL_USER}>`,
          to: key,
          subject: 'Your Postly OTP Code',
          text: `Your OTP is: ${otp}\n\nThis code expires in 5 minutes.\n\n- Postly Team`,
          html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`,
        });
        console.log(`[OTP] Email sent to ${key}`);
      } catch (err) {
        console.error(`[OTP] Failed to send email: ${err.message}`);
      }
    } else {
      console.log(`[OTP] No email configured. OTP for ${key}: ${otp}`);
    }

    return json(res, 200, { message: 'OTP sent to your email.' });
  }

  // ── POST /webhook/postly/auth/verify-otp ──
  if (url === '/webhook/postly/auth/verify-otp' && method === 'POST') {
    const { email, otp } = body;
    if (!email || !otp) return json(res, 400, { message: 'Email and OTP are required.' });

    const key = email.toLowerCase().trim();
    const stored = OTP_STORE.get(key);

    if (!stored) return json(res, 400, { message: 'No OTP sent. Request one first.' });
    if (Date.now() > stored.expiresAt) {
      OTP_STORE.delete(key);
      return json(res, 400, { message: 'OTP has expired. Request a new one.' });
    }
    if (stored.otp !== otp) return json(res, 400, { message: 'Wrong OTP. Try again.' });

    OTP_STORE.delete(key);

    const data = readData();
    let user = data.users.find(u => u.email === key);

    if (!user) {
      const anonymousId = generateAnonymousId();
      user = {
        id: Date.now(),
        email: key,
        anonymousId,
        role: 'author',
        college: COLLEGE,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      writeData(data);
    }

    const token = signJWT({ userId: user.id, email: user.email, role: user.role, college: user.college, anonymousId: user.anonymousId });
    return json(res, 200, { accessToken: token, user: { id: user.id, anonymousId: user.anonymousId, role: user.role, email: user.email } });
  }

  // ── POST /webhook/postly/auth/logout ──
  if (url === '/webhook/postly/auth/logout' && method === 'POST') {
    const token = getToken(req);
    if (token) {
      const data = readData();
      if (!data.tokenBlacklist.includes(token)) data.tokenBlacklist.push(token);
      if (data.tokenBlacklist.length > 500) data.tokenBlacklist = data.tokenBlacklist.slice(-500);
      writeData(data);
    }
    return json(res, 200, { message: 'Logged out.' });
  }

  // ── GET /webhook/postly/auth/me ──
  if (url === '/webhook/postly/auth/me' && method === 'GET') {
    try {
      const payload = authenticate(req);
      const data = readData();
      const user = data.users.find(u => u.id === payload.userId);
      if (!user) return json(res, 404, { message: 'User not found.' });
      return json(res, 200, { id: user.id, anonymousId: user.anonymousId, role: user.role, email: user.email });
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  // ── GET /webhook/postly/posts ──
  if (url === '/webhook/postly/posts' && method === 'GET') {
    try {
      const payload = authenticate(req);
      const data = readData();
      const posts = data.posts
        .filter(p => p.college === payload.college)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const withAuthors = posts.map(p => {
        const author = data.users.find(u => u.id === p.authorId);
        return { ...p, authorName: author?.anonymousId || 'Unknown' };
      });
      return json(res, 200, withAuthors);
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
      if (!post) return json(res, 404, { message: 'Post not found.' });
      const author = data.users.find(u => u.id === post.authorId);
      return json(res, 200, { ...post, authorName: author?.anonymousId || 'Unknown' });
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  // ── POST /webhook/postly/posts ──
  if (url === '/webhook/postly/posts' && method === 'POST') {
    try {
      const payload = authenticate(req);
      if (!['admin', 'author', 'editor'].includes(payload.role))
        return json(res, 403, { message: 'You do not have permission to post.' });

      const { title, content, status, imageBase64 } = body;
      if (!title?.trim()) return json(res, 400, { message: 'Title is required.' });

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
      return json(res, 201, { ...newPost, authorName: author?.anonymousId || 'Unknown' });
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
      if (idx === -1) return json(res, 404, { message: 'Post not found.' });

      const post = data.posts[idx];
      const canEdit = ['admin', 'editor'].includes(payload.role) || post.authorId === payload.userId;
      if (!canEdit) return json(res, 403, { message: 'You cannot edit someone else\'s post.' });

      const { title, content, status, imageBase64 } = body;
      if (title !== undefined) post.title = title.trim();
      if (content !== undefined) post.content = content;
      if (status !== undefined) post.status = status;
      if (imageBase64 !== undefined) post.imageBase64 = imageBase64;
      post.updatedAt = new Date().toISOString();

      data.posts[idx] = post;
      writeData(data);
      const author = data.users.find(u => u.id === post.authorId);
      return json(res, 200, { ...post, authorName: author?.anonymousId || 'Unknown' });
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
      if (idx === -1) return json(res, 404, { message: 'Post not found.' });

      const post = data.posts[idx];
      const canDelete = payload.role === 'admin' || post.authorId === payload.userId;
      if (!canDelete) return json(res, 403, { message: 'Not your post to delete.' });

      data.posts.splice(idx, 1);
      writeData(data);
      return json(res, 200, { message: 'Post deleted.' });
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
      if (!allowed.includes(emoji)) return json(res, 400, { message: 'Unknown reaction.' });

      const data = readData();
      const idx = data.posts.findIndex(p => p.id === Number(reactPost[1]) && p.college === payload.college);
      if (idx === -1) return json(res, 404, { message: 'Post not found.' });

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
        return json(res, 403, { message: 'Admins only.' });
      const data = readData();
      const safeUsers = data.users
        .filter(u => u.college === payload.college)
        .map(u => ({ id: u.id, anonymousId: u.anonymousId, role: u.role, email: u.email }));
      return json(res, 200, safeUsers);
    } catch (e) {
      return json(res, 401, { message: e.message });
    }
  }

  json(res, 404, { message: 'Route not found.' });
}

const server = http.createServer(handle);
server.listen(PORT, () => {
  console.log('');
  console.log('  Postly Backend Server');
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  College: @${COLLEGE}`);
  console.log(`  Data: postly-data.json`);
  if (transporter) {
    console.log('  Email: configured (Gmail)');
  } else {
    console.log('  Email: NOT configured — OTPs will be logged to console');
    console.log('  Set EMAIL_USER and EMAIL_PASS env vars to enable email.');
  }
  console.log('');
});
