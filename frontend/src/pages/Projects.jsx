import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projects } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderKanban, Users, CheckSquare, X, Trash2, ChevronRight } from 'lucide-react';

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const r = await projects.create(form);
      toast('Project created!', 'success');
      onCreate(r.data.project);
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What's this project about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    projects.list().then(r => setList(r.data.projects)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projects.delete(id);
      setList(p => p.filter(pr => pr.id !== id));
      toast('Project deleted', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const filtered = filter === 'all' ? list : list.filter(p => p.status === filter);

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{list.length} project{list.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'active', 'completed', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn btn-ghost btn-sm" style={{
            background: filter === f ? 'var(--bg3)' : 'transparent',
            color: filter === f ? 'var(--text)' : 'var(--text2)',
            borderColor: filter === f ? 'var(--border2)' : 'var(--border)',
            textTransform: 'capitalize'
          }}>{f}</button>
        ))}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects found</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Project
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(p => {
          const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
          return (
            <Link to={`/projects/${p.id}`} key={p.id} className="card" style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, background: 'var(--accent-glow)',
                  border: '1px solid rgba(124,106,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FolderKanban size={18} color="var(--accent2)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                  {(p.my_role === 'admin' || user?.role === 'admin') && (
                    <button onClick={e => handleDelete(e, p.id)} className="btn-icon btn-sm" style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: 16, marginBottom: 4, marginTop: 8 }}>{p.name}</h3>
              {p.description && <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}

              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, margin: '12px 0 8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.5s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
                    <CheckSquare size={12} /> {p.task_count} tasks
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
                    <Users size={12} /> {p.member_count}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct}%</span>
              </div>
            </Link>
          );
        })}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={p => setList(prev => [p, ...prev])} />}
    </div>
  );
}
