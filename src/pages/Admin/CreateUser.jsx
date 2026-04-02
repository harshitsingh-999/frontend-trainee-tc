import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import axiosClient from '../../api/axiosClient';

const CreateUser = () => {
  const { createUserData } = useUser();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role_id: 4,
    internship_start: '', internship_end: '',
    manager_id: '', buddy_id: '',
  });
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [managers, setManagers] = useState([]);
  const [buddies,  setBuddies]  = useState([]);

  useEffect(() => {
    axiosClient.get('/admin/users', { params: { limit: 200 } })
      .then(res => {
        const list = res.data?.data?.users || res.data?.data || [];
        setManagers(list.filter(u => Number(u.role_id) === 2));
        setBuddies(list.filter(u => Number(u.role_id) === 3));
      }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldMap = { new_user_email: 'email', new_user_password: 'password' };
    const key = fieldMap[name] || name;
    setFormData({ ...formData, [key]: key === 'role_id' ? parseInt(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const payload = { ...formData };
      if (!payload.internship_start) delete payload.internship_start;
      if (!payload.internship_end)   delete payload.internship_end;
      if (!payload.manager_id)       delete payload.manager_id;
      if (!payload.buddy_id)         delete payload.buddy_id;
      await createUserData(payload);
      setMessage('User created successfully!');
      setFormData({ name: '', email: '', password: '', role_id: 4, internship_start: '', internship_end: '', manager_id: '', buddy_id: '' });
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Error creating user');
    } finally { setLoading(false); }
  };

  const roleInfo = {
    2: { label: 'Manager', desc: 'Manage teams and trainees', color: '#0ea5e9' },
    3: { label: 'Trainee', desc: 'Trainee level access',      color: '#10b981' },
    4: { label: 'Intern',  desc: 'Basic intern access',       color: '#f59e0b' },
  };
  const selected = roleInfo[formData.role_id] || roleInfo[4];
  const showInternFields = formData.role_id === 4 || formData.role_id === 3;

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #dde3f0', borderRadius: 10,
    fontSize: 14, color: '#1f2933', fontFamily: 'inherit',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
  const labelStyle = {
    display: 'block', fontSize: 11.5, fontWeight: 700,
    color: '#374151', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 7,
  };

  return (
    <div style={{ fontFamily: "'Inter','DM Sans',system-ui,sans-serif", display:'flex', flexDirection:'column', gap:22 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#1f2933', margin:'0 0 4px' }}>Create New User</h2>
          <p style={{ fontSize:13, color:'#6b7280', margin:0 }}>Add a new user to the system with a specific role</p>
        </div>
        <a href="/admin/users"
          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px',
                   background:'#fff', border:'1.5px solid #dde3f0', borderRadius:10,
                   fontSize:13, fontWeight:600, color:'#374151', textDecoration:'none' }}>
          ← View All Users
        </a>
      </div>

      <div className="create-user-grid" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:22, alignItems:'start' }}>

        {/* LEFT: Form */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dde3f0',
                      boxShadow:'0 2px 12px rgba(15,23,42,0.07)', padding:28 }}>

          {message && (
            <div style={{ padding:'12px 16px', background:'#d1fae5', border:'1px solid #6ee7b7',
                          borderRadius:10, color:'#065f46', fontSize:13, fontWeight:500, marginBottom:20 }}>
              ✓ {message}
            </div>
          )}
          {error && (
            <div style={{ padding:'12px 16px', background:'#fee2e2', border:'1px solid #fca5a5',
                          borderRadius:10, color:'#991b1b', fontSize:13, fontWeight:500, marginBottom:20 }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <input type="text" name="fake_username" autoComplete="username" tabIndex={-1} style={{ display: 'none' }} />
            <input type="password" name="fake_password" autoComplete="current-password" tabIndex={-1} style={{ display: 'none' }} />

            <div className="form-group">
              <label style={labelStyle}>Full Name</label>
              <input type="text" name="name" placeholder="e.g. John Smith"
                value={formData.name} onChange={handleChange} required disabled={loading} style={inputStyle}
                onFocus={e => e.target.style.borderColor='#00b1b4'} onBlur={e => e.target.style.borderColor='#dde3f0'} />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Email Address</label>
              <input type="email" name="new_user_email" id="new-user-email"
                autoComplete="off" data-lpignore="true" data-1p-ignore="true"
                placeholder="e.g. john@teamcomputers.com"
                value={formData.email} onChange={handleChange} required disabled={loading} style={inputStyle}
                onFocus={e => e.target.style.borderColor='#00b1b4'} onBlur={e => e.target.style.borderColor='#dde3f0'} />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Password</label>
              <div style={{ display:'flex', gap:8 }}>
                <input type={showPass ? 'text' : 'password'} name="new_user_password" id="new-user-password"
                  autoComplete="new-password" data-lpignore="true" data-1p-ignore="true"
                  placeholder="Minimum 8 characters"
                  value={formData.password} onChange={handleChange} required disabled={loading}
                  style={{ ...inputStyle, flex:1, width:'auto' }}
                  onFocus={e => e.target.style.borderColor='#00b1b4'} onBlur={e => e.target.style.borderColor='#dde3f0'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ padding:'0 18px', background:'#f5f7fb', border:'1.5px solid #dde3f0',
                           borderRadius:10, fontSize:13, fontWeight:600, color:'#374151',
                           cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div className="form-group">
              <label style={labelStyle}>Assign Role</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {Object.entries(roleInfo).map(([id, info]) => {
                  const isSelected = formData.role_id === parseInt(id);
                  return (
                    <label key={id} style={{
                      display:'flex', flexDirection:'column', gap:3,
                      padding:'13px 15px', borderRadius:10, cursor:'pointer',
                      border: isSelected ? `2px solid ${info.color}` : '2px solid #dde3f0',
                      background: isSelected ? info.color+'12' : '#fff',
                      transition:'border-color 0.15s, background 0.15s',
                    }}>
                      <input type="radio" name="role_id" value={id}
                        checked={isSelected} onChange={handleChange}
                        style={{ position:'absolute', opacity:0, width:0, height:0 }} />
                      <span style={{ fontSize:13, fontWeight:700, color: isSelected ? info.color : '#374151' }}>
                        {info.label}
                      </span>
                      <span style={{ fontSize:11.5, color:'#6b7280' }}>{info.desc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Internship dates — only for Intern/Trainee */}
            {showInternFields && (
              <>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  <label style={{ ...labelStyle, marginBottom: 14, color: '#00b1b4' }}>
                    Internship Details
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div className="form-group">
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" name="internship_start"
                        value={formData.internship_start} onChange={handleChange}
                        disabled={loading} style={inputStyle}
                        onFocus={e => e.target.style.borderColor='#00b1b4'}
                        onBlur={e => e.target.style.borderColor='#dde3f0'} />
                    </div>
                    <div className="form-group">
                      <label style={labelStyle}>End Date</label>
                      <input type="date" name="internship_end"
                        value={formData.internship_end} onChange={handleChange}
                        disabled={loading} style={inputStyle}
                        onFocus={e => e.target.style.borderColor='#00b1b4'}
                        onBlur={e => e.target.style.borderColor='#dde3f0'} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label style={labelStyle}>Assign Manager</label>
                      <select name="manager_id" value={formData.manager_id} onChange={handleChange}
                        disabled={loading} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">— Select Manager —</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={labelStyle}>Assign Buddy</label>
                      <select name="buddy_id" value={formData.buddy_id} onChange={handleChange}
                        disabled={loading} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">— Select Buddy —</option>
                        {buddies.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                       padding:13, width:'100%',
                       background: loading ? '#9ca3af' : 'linear-gradient(135deg,#00b1b4,#009688)',
                       color:'white', border:'none', borderRadius:10,
                       fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                       fontFamily:'inherit' }}>
              {loading ? (
                <>
                  <span style={{ width:14, height:14, borderRadius:'50%',
                                 border:'2px solid rgba(255,255,255,0.4)',
                                 borderTopColor:'white', display:'inline-block',
                                 animation:'spin 0.8s linear infinite' }} />
                  Creating...
                </>
              ) : '⊕ Create User'}
            </button>
          </form>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dde3f0',
                      boxShadow:'0 2px 12px rgba(15,23,42,0.07)', padding:'24px 20px',
                      display:'flex', flexDirection:'column', alignItems:'center',
                      gap:10, textAlign:'center', position:'sticky', top:90 }}>

          <h4 style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase',
                       letterSpacing:'0.09em', color:'#9ca3af', alignSelf:'flex-start', margin:0 }}>
            Preview
          </h4>

          <div style={{ width:72, height:72, borderRadius:'50%', background: selected.color,
                        color:'white', fontWeight:800, fontSize:28,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 4px 16px rgba(0,0,0,0.15)', marginTop:6 }}>
            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
          </div>

          <div style={{ fontSize:17, fontWeight:700, color:'#1f2933' }}>
            {formData.name || 'Full Name'}
          </div>
          <div style={{ fontSize:12, color:'#6b7280' }}>
            {formData.email || 'email@example.com'}
          </div>

          <div style={{ padding:'4px 16px', borderRadius:99, fontSize:12, fontWeight:700,
                        background: selected.color+'20', color: selected.color }}>
            {selected.label}
          </div>
          <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{selected.desc}</p>

          <div style={{ width:'100%', marginTop:6, borderTop:'1px solid #f1f5f9',
                        paddingTop:14, display:'flex', flexDirection:'column', gap:7 }}>
            {[
              { label:'Name entered',  done: !!formData.name     },
              { label:'Email entered', done: !!formData.email    },
              { label:'Password set',  done: !!formData.password },
              { label:'Role assigned', done: true                },
              ...(showInternFields ? [
                { label:'Start date set', done: !!formData.internship_start },
                { label:'End date set',   done: !!formData.internship_end   },
              ] : []),
            ].map(({ label, done }) => (
              <div key={label}
                style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, padding:'7px 10px',
                         borderRadius:8, background: done ? '#f0fdf4' : '#f8fafc',
                         color: done ? '#1f2933' : '#9ca3af' }}>
                <span style={{ fontWeight:700, color: done ? '#059669' : '#9ca3af' }}>
                  {done ? '✓' : '○'}
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .create-user-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default CreateUser;
