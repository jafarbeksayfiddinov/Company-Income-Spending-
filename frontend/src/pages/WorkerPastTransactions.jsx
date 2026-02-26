import React, { useState } from 'react'
import { getWorkerHistory } from '../api'
import '../styles/PastTransactions.css'

const STATUSES = ['ALL', 'ACCEPTED', 'REJECTED']

export default function WorkerPastTransactions() {
  const [status, setStatus] = useState('ALL')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [highlightedTransactionId, setHighlightedTransactionId] = useState(null)
  const [error, setError] = useState('')

  React.useEffect(() => {
    loadTransactions(status)
    // Check for highlighted transaction from localStorage
    const highlightId = localStorage.getItem('highlightTransactionId')
    if (highlightId) {
      setHighlightedTransactionId(parseInt(highlightId))
      // Clear the stored highlight ID after using it
      localStorage.removeItem('highlightTransactionId')
    }
  }, [status])

  async function loadTransactions(filterStatus) {
    setLoading(true)
    setError('')
    try {
      const data = await getWorkerHistory(filterStatus)
      const filtered = data.filter(t => t.status !== 'PENDING')
      
      // Sort by time (newest first)
      const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setTransactions(sorted)
      
      // If there's a highlighted transaction, select it
      if (highlightedTransactionId) {
        const highlightedTransaction = sorted.find(t => t.id === highlightedTransactionId)
        if (highlightedTransaction) {
          setSelectedTransaction(highlightedTransaction)
          // Scroll to the highlighted transaction
          setTimeout(() => {
            const element = document.querySelector(`.transaction-row.highlighted`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }
      }
    } catch (err) {
      setError('Failed to load transactions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
  }

  return (
    <div className="past-transactions-container">
      <h2>My Transaction History</h2>
      <div className="sort-indicator">
        <span className="sort-info">⏰ Sorted by time (newest first)</span>
      </div>

      <div className="status-filters">
        {STATUSES.map(s => (
          <button
            key={s}
            className={`filter-btn ${status === s ? 'active' : ''}`}
            onClick={() => handleStatusChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="transactions-content">
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <p className="empty">No transactions found</p>
          ) : (
            transactions.map(t => (
              <div
                key={t.id}
                className={`transaction-row ${selectedTransaction?.id === t.id ? 'selected' : ''} ${highlightedTransactionId === t.id ? 'highlighted' : ''}`}
                onClick={() => setSelectedTransaction(t)}
              >
                <div className="row-cols">
                  <span className="col-product">{t.product}</span>
                  <span className={`col-type ${t.type.toLowerCase()}`}>{t.type}</span>
                  <span className="col-amount">{t.amount} {t.currency}</span>
                  <span className={`col-status status-${t.status.toLowerCase()}`}>{t.status}</span>
                  <span className="col-date">{formatDateTime(t.createdAt)}</span>
                </div>
                {highlightedTransactionId === t.id && (
                  <div className="highlight-indicator">
                    <span className="highlight-badge">🔔 Notified Transaction</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedTransaction && (
          <div className="transaction-details">
            <h3>Transaction Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Product</label>
                <p>{selectedTransaction.product}</p>
              </div>
              <div className="detail-item">
                <label>Type</label>
                <p>{selectedTransaction.type}</p>
              </div>
              <div className="detail-item">
                <label>Amount</label>
                <p>{selectedTransaction.amount} {selectedTransaction.currency}</p>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <p className={`status-${selectedTransaction.status.toLowerCase()}`}>
                  {selectedTransaction.status}
                </p>
              </div>
              <div className="detail-item">
                <label>Source</label>
                <p>{selectedTransaction.source}</p>
              </div>
              <div className="detail-item">
                <label>Weight</label>
                <p>{selectedTransaction.weightKg} kg</p>
              </div>
              <div className="detail-item full-width">
                <label>Description</label>
                <p>{selectedTransaction.description || 'N/A'}</p>
              </div>
              {selectedTransaction.managerComment && (
                <div className="detail-item full-width">
                  <label>Manager Comment</label>
                  <p className="manager-comment">{selectedTransaction.managerComment}</p>
                </div>
              )}
              <div className="detail-item full-width">
                <label>Created</label>
                <p>{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
              </div>
              {selectedTransaction.reviewedAt && (
                <div className="detail-item full-width">
                  <label>Reviewed</label>
                  <p>{new Date(selectedTransaction.reviewedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
            <button className="close-btn" onClick={() => setSelectedTransaction(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
