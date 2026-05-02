/**
 * Frontend Notification Service (Lecture 7: Notifications and Workflow Integration)
 * Handles real-time notifications using React Toastify and API polling
 */

import { toast } from 'react-toastify'

class NotificationService {
  constructor() {
    this.pollingInterval = null
    this.lastNotificationCheck = null
  }

  /**
   * Show success notification
   */
  showSuccess(message, options = {}) {
    return toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  }

  /**
   * Show error notification
   */
  showError(message, options = {}) {
    return toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  }

  /**
   * Show info notification
   */
  showInfo(message, options = {}) {
    return toast.info(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  }

  /**
   * Show warning notification
   */
  showWarning(message, options = {}) {
    return toast.warning(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    })
  }

  /**
   * Start polling for new notifications from the backend
   */
  startNotificationPolling(api, callback, intervalMs = 30000) {
    // Clear existing polling
    this.stopNotificationPolling()

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await api.get('/api/notifications/')
        const notifications = response || []

        // Only show notifications that are newer than our last check
        const newNotifications = notifications.filter(notification => {
          if (!this.lastNotificationCheck) return true
          return new Date(notification.created_at) > this.lastNotificationCheck
        })

        // Update last check time
        this.lastNotificationCheck = new Date()

        // Show new notifications
        newNotifications.forEach(notification => {
          this.showNotificationFromBackend(notification)
          
          // Call callback with the notification
          if (callback) {
            callback(notification)
          }
        })
      } catch (error) {
        console.error('Error polling notifications:', error)
      }
    }, intervalMs)
  }

  /**
   * Stop polling for notifications
   */
  stopNotificationPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  /**
   * Show notification from backend data
   */
  showNotificationFromBackend(notification) {
    const { title, message, notification_type } = notification

    // Determine toast type based on notification type
    let toastType = 'info'
    let icon = 'ℹ️'

    switch (notification_type) {
      case 'log_submitted':
        toastType = 'info'
        icon = '📝'
        break
      case 'log_reviewed':
        toastType = 'warning'
        icon = '👀'
        break
      case 'log_approved':
        toastType = 'success'
        icon = '✅'
        break
      case 'placement_created':
        toastType = 'success'
        icon = '🏢'
        break
      case 'placement_status_updated':
        toastType = 'info'
        icon = '📊'
        break
      default:
        toastType = 'info'
        icon = '📢'
    }

    // Show the notification with appropriate styling
    const displayMessage = `${icon} ${title}: ${message}`
    
    switch (toastType) {
      case 'success':
        this.showSuccess(displayMessage)
        break
      case 'error':
        this.showError(displayMessage)
        break
      case 'warning':
        this.showWarning(displayMessage)
        break
      default:
        this.showInfo(displayMessage)
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(api, notificationId) {
    try {
      await api.patch(`/api/notifications/${notificationId}/read/`)
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(api) {
    try {
      await api.post('/api/notifications/mark-all-read/')
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(api) {
    try {
      const notifications = await api.get('/api/notifications/')
      const unreadCount = notifications.filter(n => !n.is_read).length
      return unreadCount
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Workflow-specific notification helpers
   */
  notifyLogSubmitted(studentName, weekNumber) {
    this.showInfo(`📝 ${studentName} submitted Week ${weekNumber} log for review`)
  }

  notifyLogReviewed(studentName, weekNumber) {
    this.showWarning(`👀 Week ${weekNumber} log for ${studentName} has been reviewed`)
  }

  notifyLogApproved(studentName, weekNumber) {
    this.showSuccess(`✅ Week ${weekNumber} log for ${studentName} has been approved!`)
  }

  notifyPlacementAssigned(studentName, companyName) {
    this.showSuccess(`🏢 ${studentName} assigned to ${companyName}`)
  }

  notifyPlacementActivated(studentName, companyName) {
    this.showInfo(`📊 ${studentName}'s internship at ${companyName} is now active`)
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.stopNotificationPolling()
    this.lastNotificationCheck = null
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService
