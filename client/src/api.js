// API base URL — Vite proxy forwards /api → http://localhost:4000
const BASE = '/api';

function getToken() {
  return localStorage.getItem('postly_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  login:   (username, password) => request('POST', '/auth/login', { username, password }),
  logout:  ()                   => request('POST', '/auth/logout'),
  me:      ()                   => request('GET',  '/auth/me'),
  getPosts: ()                  => request('GET',  '/posts'),
  getPost:  (id)                => request('GET',  `/posts/${id}`),
  createPost: (data)            => request('POST', '/posts', data),
  updatePost: (id, data)        => request('PUT',  `/posts/${id}`, data),
  getUsers:   ()                => request('GET',  '/users'),
};
