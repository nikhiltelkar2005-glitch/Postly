const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Allow Vite dev server to call the API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

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

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token is revoked. Please log in again.' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = payload;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

function getPostById(postId) {
  return posts.find(post => post.id === Number(postId));
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = generateToken(user);
  return res.json({
    accessToken: token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  tokenBlacklist.add(token);
  return res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }
  return res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
});

app.get('/api/posts', (req, res) => {
  return res.json(posts);
});

app.get('/api/posts/:id', (req, res) => {
  const post = getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  return res.json(post);
});

app.post('/api/posts', authenticateToken, authorizeRoles('admin', 'author', 'editor'), (req, res) => {
  const { title, content, status } = req.body;
  const newPost = {
    id: posts.length + 1,
    title: title || 'Untitled post',
    content: content || '',
    authorId: req.user.userId,
    status: status || 'draft'
  };
  posts.push(newPost);
  return res.status(201).json(newPost);
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const post = getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const isOwner = post.authorId === req.user.userId;
  const canEdit = ['admin', 'editor'].includes(req.user.role) || isOwner;

  if (!canEdit) {
    return res.status(403).json({ message: 'Forbidden: cannot update this post' });
  }

  const { title, content, status } = req.body;
  post.title = title !== undefined ? title : post.title;
  post.content = content !== undefined ? content : post.content;
  post.status = status !== undefined ? status : post.status;

  return res.json(post);
});

app.get('/api/users', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const safeUsers = users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role }));
  return res.json(safeUsers);
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Postly backend running on http://localhost:${PORT}`);
});
