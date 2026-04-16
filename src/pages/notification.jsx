import React, { useEffect, useState } from 'react'
import { FaBell, FaChevronRight, FaInbox } from 'react-icons/fa'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/api'
import { formatNotificationTime } from '../utils/notifications.js'
import toast from 'react-hot-toast'

function Notification() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await getNotifications()
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
      setNotifications(data)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  const handleNotificationClick = async (notification) => {
    const nextExpanded = expandedId === notification.id ? null : notification.id
    setExpandedId(nextExpanded)

    if (notification.is_read) return

    try {
      await markNotificationRead(notification.id)
      setNotifications((prev) =>
        prev.map((item) => item.id === notification.id ? { ...item, is_read: true } : item)
      )
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all notifications as read')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: '20px 22px',
          borderRadius: 22,
          background: '#fff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 14px 36px rgba(15, 23, 42, 0.06)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #003b5c, #00b1b4)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <FaBell />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 1rem + 0.8vw, 1.8rem)', color: '#111827' }}>
              Notifications
            </h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
              {notifications.length} total notifications
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 999,
              background: unreadCount > 0 ? '#fff7ed' : '#f3f4f6',
              color: unreadCount > 0 ? '#9a3412' : '#4b5563',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {unreadCount} unread
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                padding: '11px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #003b5c, #00b1b4)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            borderRadius: 24,
            padding: 48,
            background: '#fff',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: '#f3f4f6',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#003b5c',
            }}
          >
            <FaInbox />
          </div>
          <h3 style={{ margin: 0, color: '#1f2937' }}>No notifications yet</h3>
          <p style={{ marginTop: 8 }}>When new alerts arrive from the system, they will show up here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {notifications.map((notification) => {
            const isExpanded = expandedId === notification.id

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: notification.is_read ? '#fff' : '#eef8ff',
                  border: `1px solid ${notification.is_read ? '#e5e7eb' : '#bfdbfe'}`,
                  borderRadius: 20,
                  padding: 18,
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 18,
                  flexWrap: 'wrap',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: notification.is_read ? '#cbd5e1' : '#00b1b4',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>
                        {notification.is_read ? 'Read' : 'New'}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      {formatNotificationTime(notification)}
                    </span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                      {notification.title}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: '#4b5563',
                        display: '-webkit-box',
                        WebkitLineClamp: isExpanded ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        whiteSpace: isExpanded ? 'normal' : 'initial',
                      }}
                    >
                      {notification.message}
                    </div>
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: '#f8fafc',
                          border: '1px solid #e5e7eb',
                          color: '#4b5563',
                          fontSize: 13,
                          lineHeight: 1.7,
                        }}
                      >
                        Click again to collapse this notification.
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#00b1b4',
                    fontWeight: 700,
                    fontSize: 13,
                    flex: '0 0 auto',
                  }}
                >
                  {isExpanded ? 'Collapse' : 'View more'}
                  <FaChevronRight style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Notification
