import React, { useState } from 'react'
import { getNotifications, markNotificationAsRead } from '../api'
import '../styles/NotificationsPage.css'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, unread, accepted, rejected, commented

  React.useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    setError('')
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (err) {
      setError('Failed to load notifications: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
    } catch (err) {
      setError('Failed to mark notification as read')
    }
  }

  function handleNotificationClick(notification) {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to worker transactions with highlight
    const workerId = localStorage.getItem('userId')
    if (workerId) {
      // Store the transaction ID to highlight
      localStorage.setItem('highlightTransactionId', notification.transactionId)
      // Navigate to worker transactions page
      window.location.href = '/worker-transactions'
    }
  }

  function getFilteredNotifications() {
    return notifications.filter(n => {
      if (filter === 'all') return true
      if (filter === 'unread') return !n.isRead
      if (filter === 'accepted') return n.type === 'ACCEPTED'
      if (filter === 'rejected') return n.type === 'REJECTED'
      return true
    })
  }

  const filtered = getFilteredNotifications()

  function getTypeColor(type) {
    switch (type) {
      case 'ACCEPTED':
        return '#2e7d32'
      case 'REJECTED':
        return '#c62828'
      case 'COMMENTED':
        return '#e65100'
      default:
        return '#666'
    }
  }

  return (
    <div className="notifications-page-container">
      <h2>Notifications</h2>

      <div className="notifications-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({notifications.filter(n => !n.isRead).length})
          </button>
          <button
            className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            Accepted ({notifications.filter(n => n.type === 'ACCEPTED').length})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({notifications.filter(n => n.type === 'REJECTED').length})
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Loading notifications...</div>}

      <div className="notifications-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No notifications {filter !== 'all' ? `with filter "${filter}"` : ''}</p>
          </div>
        ) : (
          filtered.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : 'read'} clickable`}
              onClick={() => handleNotificationClick(notification)}
              title="Click to view transaction"
            >
              <div className="notification-left">
                {!notification.isRead && <div className="unread-indicator"></div>}
              </div>

              <div className="notification-content">
                <div className="notification-header">
                  <span
                    className="notification-type"
                    style={{ borderLeftColor: getTypeColor(notification.type) }}
                  >
                    {notification.type}
                  </span>
                  <span className="notification-date">
                    {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>
                <p className="notification-transaction">
                  Transaction ID: <code>#{notification.transactionId}</code>
                </p>
              </div>

              {!notification.isRead && (
                <button
                  className="mark-read-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkAsRead(notification.id)
                  }}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
