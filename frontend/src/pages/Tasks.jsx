import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasks as tasksApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskModal from '../components/TaskModal';
import { Plus, CheckSquare, AlertTriangle, Clock, Calendar, Filter } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const STATUSES = ['all', 'todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['all', 'urgent', 'high', 'medium', 'low'];

export default function Tasks() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { user } = useAuth();
  const toast = useToast();

  const load = async () => {
    const params = { assignee_id: user.id };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    const r = await tasksApi.list(params);
    setList(r.data.tasks);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  const handleCreate = async data => {
    try {
      const r = await tasksApi.create(data);
      setList(p => [r.data.task, ...p]);
      toast('Task created!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
      throw err;
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      const r = await tasksApi.update(taskId, { status });
      setList(p => p.map(t => t.id === taskId ? r.data.task : t));
    } catch {}
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>My Tasks</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{list.length} task{list.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>STATUS</span>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-ghost btn-sm" style={{
              background: statusFilter === s ? 'var(--bg3)' : 'transparent',
              color: statusFilter === s ? 'var(--text)' : 'var(--text2)',
              textTransform: 'capitalize', fontSize: 12
            }}>{s.replace('_', ' ')}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>PRIORITY</span>
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className="btn btn-ghost btn-sm" style={{
              background: priorityFilter === p ? 'var(--bg3)' : 'transparent',
              color: priorityFilter === p ? 'var(--text)' : 'var(--text2)',
              textTransform: 'capitalize', fontSize: 12
            }}>{p}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>}
      {!loading && list.length === 0 && (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>No tasks found</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map(t => {
          const overdue = t.due_date && isAfter(new Date(), parseISO(t.due_date)) && t.status !== 'done';
          return (
            <div key={t.id} style={{
              background: 'var(--bg1)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'border-color 0.15s'
            }}>
              {/* Quick status toggle */}
              <button onClick={() => updateStatus(t.id, t.status === 'done' ? 'todo' : 'done')} style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                border: `2px solid ${t.status === 'done' ? 'var(--green)' : 'var(--border2)'}`,
                background: t.status === 'done' ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
              }}>
                {t.status === 'done' && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>

              <Link to={`/tasks/${t.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--text3)' : 'var(--text)' }}>
                  {t.title}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.project_name}</span>
                  {t.due_date && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
                      {overdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
                      {format(parseISO(t.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              </Link>

              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
            </div>
          );
        })}
      </div>

      {showCreate && <TaskModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
