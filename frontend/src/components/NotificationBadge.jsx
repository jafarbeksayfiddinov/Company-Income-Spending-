import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUnreadCount, getNotifications, markAllNotificationsAsRead, markNotificationAsRead, getProfile } from '../api'
import '../styles/NotificationBadge.css'

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const profile = getProfile()

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  async function loadUnreadCount() {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }

  async function handleDropdownOpen() {
    setShowDropdown(!showDropdown)
    if (!showDropdown) {
      setLoading(true)
      try {
        const notifs = await getNotifications()
        setNotifications(notifs.slice(0, 5)) // Show top 5
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead()
      setUnreadCount(0)
      loadUnreadCount()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  async function handleNotificationClick(notifId, transactionId) {
    try {
      await markNotificationAsRead(notifId)
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
    
    // Navigate based on user role
    if (profile?.role === 'MANAGER') {
      navigate(`/manager?txId=${transactionId}`)
    } else if (profile?.role === 'WORKER') {
      navigate(`/worker/transactions?txId=${transactionId}`)
    } else {
      navigate(`/director?txId=${transactionId}`)
    }
    setShowDropdown(false)
  }

  return (
    <div className="notification-badge-container">
      <button className="notification-bell" onClick={handleDropdownOpen}>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && <p className="loading">Loading...</p>}
            {!loading && notifications.length === 0 && <p className="empty">No notifications</p>}
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notif.id, notif.transactionId)}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notif.id, notif.transactionId)}
              >
                <div className="notif-badge">{notif.type}</div>
                <p>{notif.message}</p>
                <small>{new Date(notif.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <a href="/worker/notifications">View all notifications</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
