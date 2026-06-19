import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'PostlySecretKey';
const TOKEN_EXPIRY = '1h';
const tokenBlacklist = new Set();

const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
  { id: 2, username: 'author1', password: 'author123', role: 'author', name: 'Author One' },
  { id: 3, username: 'editor1', password: 'editor123', role: 'editor', name: 'Editor One' },
  { id: 4, username: 'reader1', password: 'reader123', role: 'reader', name: 'Reader One' }
];

const posts = [
  { id: 1, title: 'Introducing Postly', content: 'A modern blogging platform with authentication and roles.', authorId: 2, status: 'published' },
  { id: 2, title: 'How to write great posts', content: 'Tips for writing clear blog content and organizing drafts.', authorId: 2, status: 'draft' }
];

function jsonParser(req) {
  return new Promise((resolve) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try { req.body = JSON.parse(body); } catch { req.body = {}; }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return { status: 401, body: { message: 'Missing token' } };
  if (tokenBlacklist.has(token)) return { status: 401, body: { message: 'Token is revoked. Please log in again.' } };
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return null;
  } catch {
    return { status: 401, body: { message: 'Invalid or expired token' } };
  }
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleAPI(req, res) {
  const { method, url } = req;
  const path = url.replace(/\/+$/, '') || '/';

  await jsonParser(req);

  // Auth routes
  if (path === '/api/auth/login' && method === 'POST') {
    const { username, password } = req.body || {};
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return sendJSON(res, 401, { message: 'Invalid username or password' });
    const token = generateToken(user);
    return sendJSON(res, 200, {
      accessToken: token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const authErr = authenticateToken(req);
    if (authErr) return sendJSON(res, authErr.status, authErr.body);
    const token = req.headers['authorization'].split(' ')[1];
    tokenBlacklist.add(token);
    return sendJSON(res, 200, { message: 'Logged out successfully' });
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const authErr = authenticateToken(req);
    if (authErr) return sendJSON(res, authErr.status, authErr.body);
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return sendJSON(res, 401, { message: 'User not found' });
    return sendJSON(res, 200, { id: user.id, username: user.username, name: user.name, role: user.role });
  }

  // Post routes
  if (path === '/api/posts' && method === 'GET') {
    return sendJSON(res, 200, posts);
  }

  const postMatch = path.match(/^\/api\/posts\/(\d+)$/);

  if (postMatch && method === 'GET') {
    const post = posts.find(p => p.id === Number(postMatch[1]));
    if (!post) return sendJSON(res, 404, { message: 'Post not found' });
    return sendJSON(res, 200, post);
  }

  if (path === '/api/posts' && method === 'POST') {
    const authErr = authenticateToken(req);
    if (authErr) return sendJSON(res, authErr.status, authErr.body);
    if (!['admin', 'author', 'editor'].includes(req.user.role)) {
      return sendJSON(res, 403, { message: 'Forbidden: insufficient permissions' });
    }
    const { title, content, status } = req.body || {};
    const newPost = {
      id: posts.length + 1,
      title: title || 'Untitled post',
      content: content || '',
      authorId: req.user.userId,
      status: status || 'draft'
    };
    posts.push(newPost);
    return sendJSON(res, 201, newPost);
  }

  if (postMatch && method === 'PUT') {
    const authErr = authenticateToken(req);
    if (authErr) return sendJSON(res, authErr.status, authErr.body);
    const post = posts.find(p => p.id === Number(postMatch[1]));
    if (!post) return sendJSON(res, 404, { message: 'Post not found' });
    const isOwner = post.authorId === req.user.userId;
    const canEdit = ['admin', 'editor'].includes(req.user.role) || isOwner;
    if (!canEdit) return sendJSON(res, 403, { message: 'Forbidden: cannot update this post' });
    const { title, content, status } = req.body || {};
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (status !== undefined) post.status = status;
    return sendJSON(res, 200, post);
  }

  // User routes
  if (path === '/api/users' && method === 'GET') {
    const authErr = authenticateToken(req);
    if (authErr) return sendJSON(res, authErr.status, authErr.body);
    if (req.user.role !== 'admin') {
      return sendJSON(res, 403, { message: 'Forbidden: insufficient permissions' });
    }
    const safeUsers = users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role }));
    return sendJSON(res, 200, safeUsers);
  }

  sendJSON(res, 404, { message: 'Route not found' });
}

export default function apiPlugin() {
  return {
    name: 'api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api')) {
          await handleAPI(req, res);
        } else {
          next();
        }
      });
    }
  };
}
