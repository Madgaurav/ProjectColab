import { useEffect, useState } from 'react'

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

const fallbackNotifications = [
  {
    id: 'n1',
    title: 'New task assignment',
    message: 'You were assigned: Map the core commuter journey in Campus shuttle tracker.',
    notification_type: 'task_assignment',
    related_project_id: 'p1',
    is_read: false,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'n2',
    title: 'You joined a project team',
    message: 'You were accepted for the Frontend developer role in Campus shuttle tracker.',
    notification_type: 'application_accepted',
    related_project_id: 'p1',
    is_read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    title: 'New team announcement',
    message: 'The project brief is ready. Please add your first task before Friday.',
    notification_type: 'team_announcement',
    related_project_id: 'p1',
    is_read: true,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    title: 'New project application',
    message: 'A student has applied to join your project: Campus shuttle tracker.',
    notification_type: 'project_application',
    related_project_id: 'p1',
    is_read: true,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
]

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NotificationsWorkspace({
  user,
  onNavigateWorkspace,
  onNavigateRecruitment,
  onNavigateTeam,
  onNotificationRead,
}) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchNotifications = () => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setNotifications(fallbackNotifications)
      return
    }

    setLoading(true)
    setError('')
    fetch('/api/notifications?limit=50', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || 'Could not load notifications.')
        }
        return res.json()
      })
      .then((data) => {
        if (data?.notifications) {
          setNotifications(data.notifications)
        }
      })
      .catch((err) => {
        setError(err.message || 'Unable to reach notifications service.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchNotifications()
  }, [user])

  // Mark single notification as read
  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    if (onNotificationRead) onNotificationRead()

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.token}` },
      })
    } catch {
      // Quiet fail or background sync
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    if (onNotificationRead) onNotificationRead()

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.token}` },
      })
    } catch {
      fetchNotifications()
    }
  }

  // Handle clicking on a notification for deep linking
  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      markAsRead(item.id)
    }

    const type = item.notification_type || ''
    const projectId = item.related_project_id

    if (type === 'project_application') {
      if (onNavigateRecruitment) onNavigateRecruitment(projectId)
    } else if (type === 'application_accepted') {
      if (onNavigateTeam) onNavigateTeam(projectId)
    } else if (type === 'task_assignment' || type === 'team_announcement') {
      if (onNavigateWorkspace) onNavigateWorkspace(projectId)
    } else if (projectId && onNavigateWorkspace) {
      onNavigateWorkspace(projectId)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'tasks') return n.notification_type === 'task_assignment' || n.notification_type === 'team_announcement'
    if (filter === 'applications') return n.notification_type?.includes('application')
    return true
  })

  const getNotificationCategoryClass = (type) => {
    if (type === 'task_assignment') return 'task'
    if (type === 'application_accepted' || type === 'team') return 'team'
    if (type === 'team_announcement') return 'announcement'
    return 'application'
  }

  return (
    <section className="notifications-page">
      <div className="discover-heading">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Stay close to the work <em>that needs you.</em></h1>
          <p>
            A quieter way to catch project decisions, requests, and updates from{' '}
            <span className="highlight">your teams.</span>
          </p>
        </div>
        <div className="page-actions">
          <button className="outline-button" onClick={() => onNavigateWorkspace && onNavigateWorkspace()}>
            Open workspace
          </button>
        </div>
      </div>

      <div className="notification-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <span>
            {unreadCount
              ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
              : 'You are all caught up'}
          </span>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              ['all', 'All'],
              ['unread', 'Unread'],
              ['tasks', 'Tasks & Notes'],
              ['applications', 'Applications'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`notification-filter-btn ${filter === val ? 'active' : ''}`}
                onClick={() => setFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="mark-read-btn"
          onClick={markAllAsRead}
          disabled={!unreadCount}
        >
          Mark all as read
        </button>
      </div>

      {error && <p className="notice" style={{ marginBottom: '1rem' }}>{error}</p>}

      {loading && (
        <p className="small-copy" style={{ margin: '2rem 0', textAlign: 'center', color: '#888' }}>
          Refreshing notifications...
        </p>
      )}

      {!loading && filteredNotifications.length > 0 && (
        <div className="notification-list">
          {filteredNotifications.map((item) => {
            const catClass = getNotificationCategoryClass(item.notification_type)
            const timeStr = formatRelativeTime(item.created_at)

            return (
              <button
                type="button"
                className={`notification-item ${item.is_read ? 'read' : 'unread'}`}
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                title="Click to view details"
              >
                <span className={`notification-icon ${catClass}`}>•</span>
                <span className="notification-copy">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </span>
                <time>{timeStr}</time>
                {!item.is_read && <i aria-label="Unread" />}
              </button>
            )
          })}
        </div>
      )}

      {!loading && !filteredNotifications.length && (
        <div className="empty-state">
          <h2>No notifications here.</h2>
          <p>
            {filter === 'unread'
              ? 'You have read all your notifications.'
              : 'You have no recent updates. Team invites, task assignments, and announcements will appear here.'}
          </p>
          {filter !== 'all' && (
            <button className="outline-button" onClick={() => setFilter('all')}>
              Show all notifications
            </button>
          )}
        </div>
      )}
    </section>
  )
}
