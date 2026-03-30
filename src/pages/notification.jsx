import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/api'
import toast from 'react-hot-toast'

function Notification() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await getNotifications()
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
      setNotifications(data)
    } catch (err) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleNotificationClick = async (notif) => {
    try {
      await markNotificationRead(notif.id)
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
      
      if (notif.link) {
        navigate(notif.link)
      }
    } catch (err) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2>Notifications</h2>
          {unreadCount > 0 && <p style={{ color: '#6b7280', fontSize: 14 }}>You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
          <p style={{ fontSize: 16, margin: 0 }}>No notifications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(notif => {
            const createdAt = notif.createdAt || notif.created_at
            const timestamp = createdAt ? new Date(createdAt).toLocaleString() : 'Unknown time'
            
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  padding: 16,
                  background: notif.is_read ? '#fff' : '#eff6ff',
                  border: `1px solid ${notif.is_read ? '#e5e7eb' : '#bfdbfe'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = notif.is_read ? '#f9fafb' : '#dbeafe'
                  e.currentTarget.style.borderColor = notif.is_read ? '#d1d5db' : '#93c5fd'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notif.is_read ? '#fff' : '#eff6ff'
                  e.currentTarget.style.borderColor = notif.is_read ? '#e5e7eb' : '#bfdbfe'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#1f2937' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {timestamp}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <div style={{
                      width: 12,
                      height: 12,
                      background: '#3b82f6',
                      borderRadius: '50%',
                      marginLeft: 12,
                      marginTop: 2,
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Notification