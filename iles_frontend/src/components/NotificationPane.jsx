import { useEffect, useMemo, useState } from 'react'
import { getErrorMessage, notificationsAPI } from '../api/api'
import './NotificationPane.css'

const notificationTypeLabels = {
  log_submitted: 'Log submitted',
  log_reviewed: 'Log reviewed',
  log_approved: 'Log approved',
  log_revision_requested: 'Revision requested',
  placement_created: 'Placement assigned',
  placement_status_updated: 'Placement status updated',
  evaluation_submitted: 'Evaluation submitted',
  evaluation_updated: 'Evaluation updated',
}

const formatNotificationTime = (value) => {
  if (!value) {
    return 'Just now'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  return date.toLocaleString()
}

const NotificationPane = ({ title = 'Notifications', subtitle = 'Recent workflow updates', limit = 5 }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  )

  const fetchNotifications = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await notificationsAPI.getNotifications({ limit: 20 })
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load notifications.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const pollingInterval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => {
      clearInterval(pollingInterval)
    }
  }, [])

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId)
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId ? response.data : notification,
        ),
      )
    } catch {
      setError('Unable to mark notification as read.')
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      )
    } catch {
      setError('Unable to mark notifications as read.')
    }
  }

  const visibleNotifications = useMemo(() => {
    return [...notifications]
      .sort((left, right) => {
        if (left.is_read !== right.is_read) {
          return left.is_read ? 1 : -1
        }

        return new Date(right.created_at || 0) - new Date(left.created_at || 0)
      })
      .slice(0, limit)
  }, [notifications, limit])

  return (
    <section className="notification-pane" aria-label={title}>
      <div className="notification-pane-header">
        <div>
          <p className="notification-pane-kicker">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <div className="notification-pane-actions">
          <span className="notification-pane-badge">{unreadNotificationsCount} unread</span>
          <button type="button" className="notification-pane-link" onClick={() => fetchNotifications()}>
            Refresh
          </button>
          <button type="button" className="notification-pane-link" onClick={markAllNotificationsAsRead}>
            Mark all read
          </button>
        </div>
      </div>

      {error ? <div className="notification-pane-empty">{error}</div> : null}

      {loading ? (
        <div className="notification-pane-empty">Loading notifications...</div>
      ) : visibleNotifications.length === 0 ? (
        <div className="notification-pane-empty">
          No log or evaluation updates yet.
        </div>
      ) : (
        <div className="notification-pane-list">
          {visibleNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className={`notification-pane-item ${notification.is_read ? 'is-read' : 'is-unread'}`}
              onClick={() => markNotificationAsRead(notification.id)}
            >
              <div className="notification-pane-item-top">
                <span className={`notification-pane-type ${notification.is_read ? 'is-read' : 'is-unread'}`}>
                  {notificationTypeLabels[notification.notification_type] || notification.notification_type || 'Update'}
                </span>
                <span className="notification-pane-time">{formatNotificationTime(notification.created_at)}</span>
              </div>
              <div className="notification-pane-title">{notification.title}</div>
              <div className="notification-pane-message">{notification.message}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default NotificationPane