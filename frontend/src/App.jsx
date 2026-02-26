import React from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import WorkerDashboard from './pages/WorkerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import DirectorDashboard from './pages/DirectorDashboard'
import WorkerPastTransactions from './pages/WorkerPastTransactions'
import ManagerHistoryPage from './pages/ManagerHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import EmployeeManagement from './pages/EmployeeManagement'
import NotificationBadge from './components/NotificationBadge'
import { getProfile, logout } from './api'

export default function App() {
  const navigate = useNavigate()
  const profile = getProfile()

  function doLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <header>
        <h1>Company Finance</h1>
        <nav>
          {!profile && <Link to="/login">Login</Link>}
          {profile && profile.role === 'WORKER' && (
            <>
              <Link to="/worker">Dashboard</Link>
              <Link to="/worker/transactions">Past Transactions</Link>
              <Link to="/worker/notifications">Notifications</Link>
            </>
          )}
          {profile && profile.role === 'MANAGER' && (
            <>
              <Link to="/manager">Dashboard</Link>
              <Link to="/manager/history">Worker History</Link>
            </>
          )}
          {profile && profile.role === 'DIRECTOR' && (
            <>
              <Link to="/director">Dashboard</Link>
              <Link to="/director/employees">Employee Management</Link>
            </>
          )}
          {profile && (
            <>
              <NotificationBadge />
              <button onClick={doLogout}>Logout</button>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/transactions" element={<WorkerPastTransactions />} />
          <Route path="/worker/notifications" element={<NotificationsPage />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/history" element={<ManagerHistoryPage />} />
          <Route path="/director" element={<DirectorDashboard />} />
          <Route path="/director/employees" element={<EmployeeManagement />} />
        </Routes>
      </main>
    </div>
  )
}
