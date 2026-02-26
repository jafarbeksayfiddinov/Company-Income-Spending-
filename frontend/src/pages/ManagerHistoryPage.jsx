import React, { useState } from 'react'
import { getManagerHistory } from '../api'
import '../styles/ManagerHistory.css'

const STATUSES = ['ALL', 'ACCEPTED', 'REJECTED']

export default function ManagerHistoryPage() {
  const [status, setStatus] = useState('ALL')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [error, setError] = useState('')

  React.useEffect(() => {
    loadTransactions(status)
  }, [status])

  async function loadTransactions(filterStatus) {
    setLoading(true)
    setError('')
    try {
      const data = await getManagerHistory(filterStatus)
      setTransactions(data)
    } catch (err) {
      setError('Failed to load transactions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleStatusChange(newStatus) {
    setStatus(newStatus)
    setSelectedTransaction(null)
  }

  return (
    <div className="manager-history-container">
      <h2>Worker Transactions History</h2>
      <p className="subtitle">View all transactions from your assigned workers</p>

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

      <div className="history-content">
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <p className="empty">No transactions found</p>
          ) : (
            transactions.map(t => (
              <div
                key={t.id}
                className={`transaction-row ${selectedTransaction?.id === t.id ? 'selected' : ''}`}
                onClick={() => setSelectedTransaction(t)}
              >
                <div className="row-cols">
                  <span className="col-worker">{t.workerName}</span>
                  <span className="col-product">{t.product}</span>
                  <span className={`col-type ${t.type.toLowerCase()}`}>{t.type}</span>
                  <span className="col-amount">{t.amount} {t.currency}</span>
                  <span className={`col-status status-${t.status.toLowerCase()}`}>{t.status}</span>
                  <span className="col-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedTransaction && (
          <div className="transaction-details">
            <h3>Transaction Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Worker</label>
                <p className="worker-name">{selectedTransaction.workerName}</p>
              </div>
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
                  <label>Your Review Comment</label>
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
