========================================
  TASKFLOW — Team Task Manager
  Full-Stack Web Application
========================================

LIVE URL: [Your Railway URL after deployment]
GITHUB: [Your GitHub repo URL]

----------------------------------------
PROJECT OVERVIEW
----------------------------------------
TaskFlow is a full-stack team task management application with role-based
access control (Admin/Member), built with:

  Backend:  Node.js + Express + SQLite (better-sqlite3)
  Frontend: React 18 + Vite + React Router
  Auth:     JWT-based authentication
  Deploy:   Railway (single-service monorepo)

----------------------------------------
KEY FEATURES
----------------------------------------
✅ Authentication (Signup / Login / JWT)
✅ Role-Based Access Control
     - Admin: full access, manage all projects & users
     - Member: access only to joined projects
✅ First registered user auto-assigned Admin role
✅ Project Management
     - Create, edit, delete projects
     - Project status: Active / Completed / Archived
✅ Team Management
     - Add/remove project members
     - Per-project roles (Admin/Member)
✅ Task Management
     - Full CRUD for tasks
     - Status: Todo / In Progress / Review / Done
     - Priority: Low / Medium / High / Urgent
     - Due dates with overdue detection
     - Assign tasks to team members
✅ Kanban Board (drag-and-drop across columns)
✅ Task Comments
✅ Dashboard with stats, overdue count, progress charts
✅ Filters by status and priority

----------------------------------------
REST API ENDPOINTS
----------------------------------------
Auth:
  POST /api/auth/signup      Register new user
  POST /api/auth/login       Login
  GET  /api/auth/me          Current user info
  GET  /api/auth/users       List all users

Projects:
  GET    /api/projects                List projects
  POST   /api/projects                Create project
  GET    /api/projects/:id            Get project + members
  PATCH  /api/projects/:id            Update project
  DELETE /api/projects/:id            Delete project
  POST   /api/projects/:id/members    Add member
  DELETE /api/projects/:id/members/:uid  Remove member

Tasks:
  GET    /api/tasks              List tasks (filterable)
  GET    /api/tasks/dashboard    Dashboard stats
  POST   /api/tasks              Create task
  GET    /api/tasks/:id          Get task + comments
  PATCH  /api/tasks/:id          Update task
  DELETE /api/tasks/:id          Delete task
  POST   /api/tasks/:id/comments Add comment

----------------------------------------
DATABASE SCHEMA
----------------------------------------
Tables: users, projects, project_members, tasks, comments
- Foreign key constraints enforced
- Cascade deletes on parent removal
- Role enum validation at DB level

----------------------------------------
LOCAL DEVELOPMENT
----------------------------------------
Prerequisites: Node.js >= 18

1. Clone the repository
   git clone <your-repo-url>
   cd taskflow

2. Install dependencies
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..

3. Start backend (port 3001)
   cd backend && npm start

4. Start frontend (port 5173)
   cd frontend && npm run dev

5. Open http://localhost:5173

----------------------------------------
DEPLOYMENT ON RAILWAY
----------------------------------------
1. Push code to GitHub

2. Go to https://railway.app
   - New Project → Deploy from GitHub repo
   - Select your taskflow repository

3. Set environment variables in Railway:
   NODE_ENV=production
   JWT_SECRET=your-strong-secret-key-here
   PORT=3001  (Railway sets this automatically)

4. Railway will run:
   Build: npm install (both dirs) + npm run build (frontend)
   Start: node backend/server.js

5. The Express server serves the React build as static files
   in production, so only ONE Railway service is needed.

6. After deploy, your live URL will be something like:
   https://taskflow-production-xxxx.up.railway.app

----------------------------------------
ARCHITECTURE NOTES
----------------------------------------
- SQLite is used for simplicity and zero-cost deployment
- The DB file is stored at the Railway volume path
- For production scale, swap to PostgreSQL with the same
  query patterns (minor SQL adjustments needed)
- JWT tokens expire after 7 days
- Passwords hashed with bcrypt (10 rounds)
- CORS configured for same-origin in production

----------------------------------------
ROLE-BASED ACCESS CONTROL
----------------------------------------
System Roles (global):
  admin  → Can see all projects, all tasks, manage team
  member → Can only see projects they're members of

Project Roles (per-project):
  admin  → Can add/remove members, edit/delete project
  member → Can create tasks, update task status

Task Permissions:
  - Any project member can create tasks
  - Any project member can update task status/details
  - Only task creator or system admin can delete tasks

----------------------------------------
AUTHOR
----------------------------------------
Built for Full-Stack Developer Assignment
Timeline: 8-12 hours
Tech choices rationale:
  - SQLite: zero setup, works perfectly on Railway with volumes
  - Vite: fast builds, great DX
  - No heavy UI library: custom CSS for smaller bundle + control
  - JWT: stateless, works well for this scale
========================================
