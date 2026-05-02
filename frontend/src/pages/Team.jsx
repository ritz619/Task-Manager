import { useState, useEffect } from 'react';
import { auth } from '../api';
import { Users, Shield, User } from 'lucide-react';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.users().then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Team Members</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>{users.length} member{users.length !== 1 ? 's' : ''} in total</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={u.avatar} alt={u.name} className="avatar" style={{ width: 44, height: 44 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
            <span className={`badge badge-${u.role}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
