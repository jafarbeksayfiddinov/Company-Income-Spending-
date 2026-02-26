import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPending, reviewTransaction } from '../api'
import '../styles/ManagerDashboard.css'

export default function ManagerDashboard() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
  const [searchParams] = useSearchParams()
  const highlightedTxId = searchParams.get('txId')

  useEffect(()=> {
    load()
    const interval = setInterval(() => {
      load()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    setRefreshing(true)
    setLoading(true)
    try {
      const res = await getPending()
      setPending(res)
      setLastRefreshTime(new Date())
      console.log('Manager dashboard refreshed:', res.length, 'pending transactions')
    } catch (e) {
      setMsg('Failed to load')
    } finally { 
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function doReview(id, action) {
    let comment = ''
    if (action === 'REJECT') {
      comment = prompt('Reason for rejection:') || ''
      if (!comment) return
    }
    try {
      await reviewTransaction(id, action, comment)
      setMsg('✓ Transaction ' + action.toLowerCase() + 'ed')
      setTimeout(() => load(), 500)
    } catch (err) {
      setMsg('✗ Error: ' + err.message)
    }
  }

  if (loading) return <div className="loading">Loading...</div>
  return (
    <div className="manager-dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>📋 Pending Transactions</h2>
          <p className="subtitle">Review and approve/reject worker submissions</p>
        </div>
        <div className="refresh-status">
          {refreshing ? (
            <span className="refreshing-indicator">🔄 Refreshing...</span>
          ) : (
            <span className="last-refresh">Last: {lastRefreshTime.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
      {msg && <div className={msg.includes('✓') ? 'status' : 'error'}>{msg}</div>}
      {pending.length === 0 ? (
        <div className="empty-state">✅ All caught up! No pending transactions.</div>
      ) : (
        <div className="transactions-grid">
          {pending.map(t => (
            <div key={t.id} className={`transaction-card ${highlightedTxId === t.id.toString() ? 'highlighted' : ''}`}>
              <div className="card-header">
                <h3>{t.product}</h3>
                <span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Worker:</span>
                  <span className="value">{t.workerName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Amount:</span>
                  <span className="value amount">{t.amount} {t.currency}</span>
                </div>
                <div className="info-row">
                  <span className="label">Source:</span>
                  <span className="value">{t.source}</span>
                </div>
                {t.description && (
                  <div className="info-row full-width">
                    <span className="label">Description:</span>
                    <p className="description">{t.description}</p>
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button className="btn btn-accept" onClick={()=>doReview(t.id,'ACCEPT')}>✓ Accept</button>
                <button className="btn btn-reject" onClick={()=>doReview(t.id,'REJECT')}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
