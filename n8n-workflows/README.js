/**
 * n8n Workflows for Postly — College Edition 🎓
 * 
 * HOW TO USE:
 * 1. Open n8n at http://localhost:5678
 * 2. Go to: Menu → Import Workflow
 * 3. Import each file from the /n8n-workflows/ folder
 * 4. Activate each workflow using the toggle in the top-right
 * 
 * DATA FILE: /Users/nikhiltelkar19gmail.com/Desktop/Postly/postly-data.json
 * 
 * COLLEGE DOMAIN: adypu.edu.in
 * JWT SECRET: PostlyADYPU2024SecretKey
 * 
 * START n8n WITH CORS:
 *   N8N_CORS_ALLOWED_ORIGINS=http://localhost:3000 npx n8n
 *
 * WORKFLOWS:
 *   1-auth-register.json   — POST /postly/auth/register
 *   2-auth-login.json      — POST /postly/auth/login
 *   3-auth-logout.json     — POST /postly/auth/logout
 *   4-auth-me.json         — GET  /postly/auth/me
 *   5-posts-list.json      — GET  /postly/posts
 *   6-posts-get-one.json   — GET  /postly/posts/:id
 *   7-posts-create.json    — POST /postly/posts
 *   8-posts-update.json    — PUT  /postly/posts/:id
 *   9-posts-delete.json    — DELETE /postly/posts/:id
 *   10-posts-react.json    — POST /postly/posts/:id/react
 *   11-users-list.json     — GET  /postly/users
 */
