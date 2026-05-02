import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasks } from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Clock, AlertTriangle, Activity, TrendingUp, ArrowRight } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasks.dashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /><span style={{ color: 'var(--text2)' }}>Loading dashboard...</span></div>;

  const { stats, recentTasks, projectStats } = data || {};

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: CheckSquare, color: 'var(--accent)' },
    { label: 'My Tasks', value: stats?.myTasks ?? 0, icon: Activity, color: 'var(--blue)' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'var(--yellow)' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertTriangle, color: 'var(--red)' },
  ];

  return (
    <div style={{ padding: '28px 32px', flex: 1, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>
          Good {getGreeting()}, <span style={{ color: 'var(--accent2)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Here's what's happening across your projects today.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Recent Tasks</h3>
            <Link to="/tasks" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent2)' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentTasks?.length === 0 && <p className="empty-state" style={{ padding: '24px 0' }}>No tasks yet</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTasks?.map(t => (
              <Link to={`/tasks/${t.id}`} key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)',
                textDecoration: 'none', transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t.project_name}</div>
                </div>
                <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                {t.due_date && isAfter(new Date(), parseISO(t.due_date)) && t.status !== 'done' && (
                  <AlertTriangle size={12} color="var(--red)" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Project progress */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Project Progress</h3>
            <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent2)' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {projectStats?.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>No projects yet</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {projectStats?.map(p => {
              const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.done}/{p.total}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 3,
                      background: pct === 100 ? 'var(--green)' : 'var(--accent)',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{pct}% complete</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Status Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'To Do', key: 'todo', color: 'var(--text3)', badge: 'todo' },
              { label: 'In Progress', key: 'inProgress', color: 'var(--blue)', badge: 'in_progress' },
              { label: 'Done', key: 'done', color: 'var(--green)', badge: 'done' },
              { label: 'Overdue', key: 'overdue', color: 'var(--red)', badge: null },
            ].map(({ label, key, color, badge }) => (
              <div key={key} style={{ background: 'var(--bg2)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 700, color }}>{stats?.[key] ?? 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
