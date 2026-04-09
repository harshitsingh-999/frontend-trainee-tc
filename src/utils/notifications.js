const NOTIFICATION_SELECTION_KEY = 'tc_active_notification_id'

const buildBaseUrl = (baseURL) => {
  if (!baseURL) return 'http://localhost:7357'
  return baseURL.replace(/\/api\/v1\/?$/, '')
}

export const getNotificationSelectionKey = () => NOTIFICATION_SELECTION_KEY

export const storeActiveNotificationId = (id) => {
  if (typeof window === 'undefined' || id === undefined || id === null) return
  window.localStorage.setItem(NOTIFICATION_SELECTION_KEY, String(id))
}

export const readActiveNotificationId = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(NOTIFICATION_SELECTION_KEY)
}

export const clearActiveNotificationId = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(NOTIFICATION_SELECTION_KEY)
}

export const getNotificationTarget = (notification, baseURL) => {
  const payload = notification?.data || notification?.payload || {}
  const apiBase = buildBaseUrl(baseURL)
  const fileCandidate =
    notification?.file_url || notification?.document_url || notification?.url ||
    notification?.link_url || payload?.file_url || payload?.document_url ||
    payload?.filePath || payload?.file_path || payload?.document_path || payload?.path || null

  if (typeof fileCandidate === 'string' && fileCandidate.trim()) {
    return /^https?:\/\//i.test(fileCandidate)
      ? fileCandidate
      : `${apiBase}${fileCandidate.startsWith('/') ? '' : '/'}${fileCandidate}`
  }

  return notification?.route || notification?.link || payload?.route || payload?.link || payload?.url || null
}

export const resolveNotificationRoute = (notification, roleId, baseURL) => {
  const target = getNotificationTarget(notification, baseURL)
  if (target) return target

  const text = `${notification?.title || ''} ${notification?.message || ''}`.toLowerCase()
  if (text.includes('leave')) return Number(roleId) === 2 ? '/manager' : '/my-leaves'
  if (text.includes('document')) return Number(roleId) === 1 ? '/admin/documents' : '/notifications'
  if (text.includes('profile')) return Number(roleId) === 1 ? '/admin/profiles' : '/notifications'
  if (text.includes('task')) return Number(roleId) === 2 ? '/manager/view-tasks' : '/my-tasks'
  if (text.includes('attendance')) return '/attendance'
  return '/notifications'
}

export const formatNotificationTime = (notification) => {
  const createdAt = notification?.createdAt || notification?.created_at
  return createdAt ? new Date(createdAt).toLocaleString() : 'Unknown time'
}
