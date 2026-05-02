import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasks as tasksApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TaskModal from '../components/TaskModal';
import { ArrowLeft, Edit, Trash2, Send, Calendar, User, Flag, Folder } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function TaskDetail() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = () => tasksApi.get(taskId).then(r => { setTask(r.data.task); setComments(r.data.comments); });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [taskId]);

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      toast('Task deleted', 'success');
      navigate(-1);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      const r = await tasksApi.comment(taskId, { content: comment });
      setComments(p => [...p, r.data.comment]);
      setComment('');
    } catch {} finally { setSending(false); }
  };

  const handleUpdate = async data => {
    try {
      const r = await tasksApi.update(taskId, data);
      setTask(r.data.task);
      toast('Task updated!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
      throw err;
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!task) return <div style={{ padding: 32 }}>Task not found</div>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Task header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
              <Edit size={12} /> Edit
            </button>
            {(task.creator_id === user?.id || user?.role === 'admin') && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>

        <h1 style={{ fontSize: 22, marginBottom: 8 }}>{task.title}</h1>
        {task.description && <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{task.description}</p>}

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { icon: Folder, label: 'Project', value: task.project_name, link: `/projects/${task.project_id}` },
            { icon: User, label: 'Assignee', value: task.assignee_name || 'Unassigned' },
            { icon: User, label: 'Created by', value: task.creator_name },
            { icon: Calendar, label: 'Due Date', value: task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'No due date' },
          ].map(({ icon: Icon, label, value, link }) => (
            <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px' }}>
              <Icon size={13} color="var(--text3)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                {link ? <Link to={link} style={{ fontSize: 13, color: 'var(--accent2)' }}>{value}</Link>
                  : <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Quick status buttons */}
        <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
          {['todo', 'in_progress', 'review', 'done'].map(s => (
            <button key={s} onClick={() => handleUpdate({ status: s })} className="btn btn-ghost btn-sm" style={{
              background: task.status === s ? 'var(--bg3)' : 'transparent',
              color: task.status === s ? 'var(--text)' : 'var(--text3)',
              textTransform: 'capitalize', fontSize: 12
            }}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Comments ({comments.length})</h3>

        {comments.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>No comments yet. Be the first!</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <img src={c.avatar} alt={c.user_name} className="avatar" style={{ width: 30, height: 30, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.user_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{format(parseISO(c.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <div style={{ background: 'var(--bg2)', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', fontSize: 13, lineHeight: 1.5 }}>
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment form */}
        <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <img src={user?.avatar} alt="" className="avatar" style={{ width: 30, height: 30, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <textarea className="form-input" placeholder="Write a comment..." value={comment} onChange={e => setComment(e.target.value)} rows={2} style={{ minHeight: 'unset', resize: 'none' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e); }}} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending || !comment.trim()} style={{ height: 40 }}>
            {sending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
          </button>
        </form>
      </div>

      {showEdit && (
        <TaskModal task={task} onClose={() => setShowEdit(false)} onCreate={async data => { await handleUpdate(data); }} projectMembers={[]} />
      )}
    </div>
  );
}
