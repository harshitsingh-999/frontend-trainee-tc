import React from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export function TaskDonutChart({ tasks = [] }) {
  const data = [
    { name: 'Todo',        value: tasks.filter(t => t.status === 'todo').length,        color: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#2563eb' },
    { name: 'Review',      value: tasks.filter(t => t.status === 'review').length,      color: '#7c3aed' },
    { name: 'Completed',   value: tasks.filter(t => t.status === 'completed').length,   color: '#16a34a' },
    { name: 'Blocked',     value: tasks.filter(t => t.status === 'blocked').length,     color: '#dc2626' },
  ].filter(d => d.value > 0)

  if (!data.length) return <p style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No tasks yet</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip formatter={(v, n) => [v + ' tasks', n]} />
        <Legend iconType="circle" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function AttendanceLineChart({ history = [] }) {
  const toHour = t => t ? parseInt(t.split(':')[0]) + parseInt(t.split(':')[1]) / 60 : null
  const fmt    = v => { if (!v) return ''; const h = Math.floor(v); const m = Math.round((v-h)*60); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` }

  const data = [...history].slice(0,7).reverse().map(r => ({
    date: new Date(r.attendance_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    in:   toHour(r.check_in_time),
    out:  toHour(r.check_out_time),
  }))

  if (!data.length) return <p style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No attendance history yet</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[7, 20]} tickFormatter={fmt} tick={{ fontSize: 11 }} width={70} />
        <Tooltip formatter={fmt} />
        <Legend />
        <Line type="monotone" dataKey="in"  name="Check In"  stroke="#00b1b4" strokeWidth={2} dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey="out" name="Check Out" stroke="#003b5c" strokeWidth={2} dot={{ r: 4 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function InternProgressChart({ interns = [], tasks = [] }) {
  const data = interns.map(intern => {
    const t = tasks.filter(t => t.assigned_to === intern.user_id)
    return {
      name:     intern.user?.name?.split(' ')[0] || 'Intern',
      progress: t.length ? Math.round(t.reduce((s, t) => s + (t.completion_percentage||0), 0) / t.length) : 0,
    }
  })

  if (!data.length) return <p style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No interns yet</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0,100]} tickFormatter={v => v+'%'} tick={{ fontSize: 12 }} />
        <Tooltip formatter={v => v+'%'} />
        <Bar dataKey="progress" name="Avg Completion" fill="#00b1b4" radius={[6,6,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TaskStatusBarChart({ tasks = [] }) {
  const COLORS = { todo:'#94a3b8', 'in progress':'#2563eb', review:'#7c3aed', completed:'#16a34a', blocked:'#dc2626' }
  const data = ['todo','in_progress','review','completed','blocked']
    .map(s => ({ name: s.replace('_',' '), count: tasks.filter(t=>t.status===s).length }))
    .filter(d => d.count > 0)

  if (!data.length) return <p style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No tasks yet</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" name="Tasks" radius={[6,6,0,0]}>
          {data.map((e,i) => <Cell key={i} fill={COLORS[e.name]||'#00b1b4'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}