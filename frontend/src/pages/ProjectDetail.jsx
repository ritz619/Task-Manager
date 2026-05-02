import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projects, tasks as tasksApi, auth } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskModal from '../components/TaskModal';
import { Plus, Users, Settings, ArrowLeft, X, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

function AddMemberModal({ projectId, onClose, onAdd }) {
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    auth.users().then(r => setAllUsers(r.data.users));
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      await projects.addMember(projectId, { user_id: selected, role });
      toast('Member added!', 'success');
      onAdd();
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-input" value={selected} onChange={e => setSelected(e.target.value)} required>
              <option value="">Choose a user...</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTask, setShowTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const load = () => Promise.all([
    projects.get(projectId).then(r => { setProject(r.data.project); setMembers(r.data.members); }),
    tasksApi.list({ project_id: projectId }).then(r => setTaskList(r.data.tasks)),
  ]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [projectId]);

  const handleCreateTask = async data => {
    try {
      const r = await tasksApi.create({ ...data, project_id: projectId });
      setTaskList(p => [r.data.task, ...p]);
      toast('Task created!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
      throw err;
    }
  };

  const handleDragStart = (e, taskId) => e.dataTransfer.setData('taskId', taskId);
  const handleDrop = async (e, status) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = taskList.find(t => t.id === taskId);
    if (!task || task.status === status) return;
    setTaskList(p => p.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      await tasksApi.update(taskId, { status });
    } catch { load(); }
  };

  const isAdmin = user?.role === 'admin' || members.find(m => m.id === user?.id)?.project_role === 'admin';

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!project) return <div style={{ padding: 32 }}>Project not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text3)' }}>
            <ArrowLeft size={14} /> Projects
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22 }}>{project.name}</h1>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
            </div>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: 13 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Member avatars */}
            <div style={{ display: 'flex', cursor: 'pointer' }} onClick={() => setShowMembers(true)}>
              {members.slice(0, 4).map((m, i) => (
                <img key={m.id} src={m.avatar} alt={m.name} className="avatar"
                  style={{ width: 28, height: 28, marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg1)', zIndex: members.length - i }} />
              ))}
              {members.length > 4 && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginLeft: -8, border: '2px solid var(--bg1)' }}>+{members.length - 4}</div>}
            </div>
            {isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>
                <UserPlus size={13} /> Add Member
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowTask(true)}>
              <Plus size={13} /> Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
          {['board', 'list'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: activeTab === t ? 'var(--bg3)' : 'transparent',
              color: activeTab === t ? 'var(--text)' : 'var(--text2)',
              border: 'none', cursor: 'pointer', textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Board */}
      {activeTab === 'board' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px', display: 'flex', gap: 16 }}>
          {COLUMNS.map(col => {
            const colTasks = taskList.filter(t => t.status === col.key);
            return (
              <div key={col.key}
                style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, col.key)}>
                {/* Column header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge badge-${col.key}`}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{colTasks.length}</span>
                </div>

                {/* Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                  {colTasks.map(t => {
                    const overdue = t.due_date && isAfter(new Date(), parseISO(t.due_date)) && t.status !== 'done';
                    return (
                      <Link key={t.id} to={`/tasks/${t.id}`} draggable
                        onDragStart={e => handleDragStart(e, t.id)}
                        style={{ textDecoration: 'none' }}>
                        <div style={{
                          background: 'var(--bg1)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                          borderRadius: 10, padding: '12px', cursor: 'grab', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = overdue ? 'var(--red)' : 'var(--border2)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}>
                          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{t.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {t.due_date && (
                                <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                  {overdue && <AlertTriangle size={9} />}
                                  {format(parseISO(t.due_date), 'MMM d')}
                                </span>
                              )}
                              {t.assignee_avatar && (
                                <img src={t.assignee_avatar} alt={t.assignee_name} className="avatar" style={{ width: 20, height: 20 }} title={t.assignee_name} />
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {activeTab === 'list' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {taskList.length === 0 && <div className="empty-state"><p>No tasks yet</p></div>}
            {taskList.map(t => {
              const overdue = t.due_date && isAfter(new Date(), parseISO(t.due_date)) && t.status !== 'done';
              return (
                <Link to={`/tasks/${t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg1)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>}
                    </div>
                    {t.assignee_name && <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <img src={t.assignee_avatar} className="avatar" style={{ width: 18, height: 18 }} alt="" />
                      {t.assignee_name}
                    </span>}
                    {t.due_date && <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>{format(parseISO(t.due_date), 'MMM d')}</span>}
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Members panel */}
      {showMembers && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMembers(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Team Members ({members.length})</h2>
              <button className="btn-icon" onClick={() => setShowMembers(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={m.avatar} alt={m.name} className="avatar" style={{ width: 34, height: 34 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.email}</div>
                  </div>
                  <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
                  {isAdmin && m.id !== user?.id && (
                    <button onClick={async () => {
                      await projects.removeMember(projectId, m.id);
                      await load();
                      toast('Member removed', 'success');
                    }} className="btn-icon" style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTask && <TaskModal onClose={() => setShowTask(false)} onCreate={handleCreateTask} projectId={projectId} projectMembers={members} />}
      {showAddMember && <AddMemberModal projectId={projectId} onClose={() => setShowAddMember(false)} onAdd={load} />}
    </div>
  );
}
