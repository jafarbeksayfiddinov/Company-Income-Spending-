import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import '../styles/Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(username, password)
      if (res.role === 'WORKER') navigate('/worker')
      if (res.role === 'MANAGER') navigate('/manager')
      if (res.role === 'DIRECTOR') navigate('/director')
    } catch (err) {
      setError('Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">💼</div>
          <h1>Company Finance</h1>
          <p>Transaction Management System</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-text">Demo Accounts:</p>
          <div className="demo-accounts">
            <div className="demo-item">
              <strong>Worker</strong>
              <code>worker / worker123</code>
            </div>
            <div className="demo-item">
              <strong>Manager</strong>
              <code>manager / manager123</code>
            </div>
            <div className="demo-item">
              <strong>Director</strong>
              <code>director / director123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
