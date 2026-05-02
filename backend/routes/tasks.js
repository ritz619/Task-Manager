const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

// GET /api/tasks?project_id=&assignee_id=&status=&priority=
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { project_id, assignee_id, status, priority } = req.query;
  let query = `
    SELECT t.*, 
      u.name as assignee_name, u.avatar as assignee_avatar,
      c.name as creator_name,
      p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.creator_id
    JOIN projects p ON p.id = t.project_id
  `;
  const conditions = [];
  const vals = [];

  if (req.user.role !== 'admin') {
    conditions.push('t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)');
    vals.push(req.user.id);
  }
  if (project_id) { conditions.push('t.project_id = ?'); vals.push(project_id); }
  if (assignee_id) { conditions.push('t.assignee_id = ?'); vals.push(assignee_id); }
  if (status) { conditions.push('t.status = ?'); vals.push(status); }
  if (priority) { conditions.push('t.priority = ?'); vals.push(priority); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...vals);
  res.json({ tasks });
});

// GET /api/tasks/dashboard — summary stats for current user
router.get('/dashboard', authenticate, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const projectFilter = isAdmin ? '1=1' : 'project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
  const pArgs = isAdmin ? [] : [userId];

  const total = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${projectFilter}`).get(...pArgs).c;
  const myTasks = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ?').get(userId).c;
  const overdue = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${projectFilter} AND due_date < date('now') AND status != 'done'`).get(...pArgs).c;
  const inProgress = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${projectFilter} AND status = 'in_progress'`).get(...pArgs).c;
  const done = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${projectFilter} AND status = 'done'`).get(...pArgs).c;
  const todo = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${projectFilter} AND status = 'todo'`).get(...pArgs).c;

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN projects p ON p.id = t.project_id
    WHERE ${projectFilter}
    ORDER BY t.updated_at DESC LIMIT 5
  `).all(...pArgs);

  const projectStats = db.prepare(`
    SELECT p.name, p.id,
      COUNT(t.id) as total,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    ${isAdmin ? '' : 'JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?'}
    GROUP BY p.id ORDER BY total DESC LIMIT 5
  `).all(...(isAdmin ? [] : [userId]));

  res.json({ stats: { total, myTasks, overdue, inProgress, done, todo }, recentTasks, projectStats });
});

// POST /api/tasks
router.post('/', authenticate, (req, res) => {
  const { title, description, project_id, assignee_id, due_date, priority, status } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id required' });

  const db = getDb();
  // Check project membership
  const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(project_id, req.user.id);
  if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Not a member of this project' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, title, description, project_id, assignee_id, creator_id, due_date, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', project_id, assignee_id || null, req.user.id, due_date || null, priority || 'medium', status || 'todo');

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.creator_id
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(id);
  res.status(201).json({ task });
});

// GET /api/tasks/:taskId
router.get('/:taskId', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.creator_id
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar
    FROM comments cm JOIN users u ON u.id = cm.user_id
    WHERE cm.task_id = ? ORDER BY cm.created_at ASC
  `).all(req.params.taskId);

  res.json({ task, comments });
});

// PATCH /api/tasks/:taskId
router.patch('/:taskId', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { title, description, status, priority, assignee_id, due_date } = req.body;
  const updates = ['updated_at = CURRENT_TIMESTAMP'];
  const vals = [];
  if (title) { updates.push('title = ?'); vals.push(title); }
  if (description !== undefined) { updates.push('description = ?'); vals.push(description); }
  if (status) { updates.push('status = ?'); vals.push(status); }
  if (priority) { updates.push('priority = ?'); vals.push(priority); }
  if (assignee_id !== undefined) { updates.push('assignee_id = ?'); vals.push(assignee_id || null); }
  if (due_date !== undefined) { updates.push('due_date = ?'); vals.push(due_date || null); }

  vals.push(req.params.taskId);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...vals);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.creator_id JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.taskId);
  res.json({ task: updated });
});

// DELETE /api/tasks/:taskId
router.delete('/:taskId', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.taskId);
  res.json({ message: 'Task deleted' });
});

// POST /api/tasks/:taskId/comments
router.post('/:taskId/comments', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.taskId, req.user.id, content);
  const comment = db.prepare('SELECT cm.*, u.name as user_name, u.avatar FROM comments cm JOIN users u ON u.id = cm.user_id WHERE cm.id = ?').get(id);
  res.status(201).json({ comment });
});

module.exports = router;
