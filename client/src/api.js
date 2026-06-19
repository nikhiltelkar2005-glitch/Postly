const BASE = '/api';

const COLLEGE_DOMAIN = 'adypu.edu.in';

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

export const COLLEGE = COLLEGE_DOMAIN;

export const api = {
  sendOtp:    (email)                 => request('POST', '/auth/send-otp', { email }),
  verifyOtp:  (email, otp)            => request('POST', '/auth/verify-otp', { email, otp }),
  logout:     ()                      => request('POST', '/auth/logout'),
  me:         ()                      => request('GET',  '/auth/me'),

  getPosts:   ()                      => request('GET',  '/posts'),
  getPost:    (id)                    => request('GET',  `/posts/${id}`),
  createPost: (data)                  => request('POST', '/posts', data),
  updatePost: (id, data)              => request('PUT',  `/posts/${id}`, data),
  deletePost: (id)                    => request('DELETE', `/posts/${id}`),
  reactPost:  (id, emoji)             => request('POST', `/posts/${id}/react`, { emoji }),

  getUsers:   ()                      => request('GET',  '/users'),
};
