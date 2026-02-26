import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAllTransactions, getAllTransactionsPaginated, getStatistics, getStatisticsHistory, getTodayHourlyGrowth, updateUserManager, getUsersByRole } from '../api'
import EmployeeManagement from './EmployeeManagement'
import '../styles/DirectorDashboard.css'

export default function DirectorDashboard() {
  const [txs, setTxs] = useState([])
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  })
  const [currentStats, setCurrentStats] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [daysSelected, setDaysSelected] = useState(30)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingTxs, setLoadingTxs] = useState(false)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('dashboard') // 'dashboard' or 'employees'
  const [activeSection, setActiveSection] = useState('overview') // 'overview', 'financial', 'workers', 'managers'
  const [managers, setManagers] = useState([])
  const [editingManager, setEditingManager] = useState(null)

  useEffect(() => {
    loadTransactions()
    loadCurrentStatistics()
    loadHistoricalStatistics(30)
    loadTodayHourlyGrowth()
    loadManagers()
  }, [])

  async function loadTransactions(page = 0, size = 10) {
    setLoadingTxs(true)
    try {
      const data = await getAllTransactionsPaginated(page, size)
      setTxs(data.content)
      setPagination({
        page: data.page,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        first: data.first,
        last: data.last
      })
    } catch (err) {
      setError('Failed to load transactions')
    } finally {
      setLoadingTxs(false)
    }
  }

  async function loadTodayHourlyGrowth() {
    try {
      const data = await getTodayHourlyGrowth()
      setHourlyData(data)
    } catch (err) {
      console.error('Failed to load hourly data:', err)
    }
  }

  async function loadManagers() {
    try {
      const data = await getUsersByRole('MANAGER')
      setManagers(data)
    } catch (err) {
      console.error('Failed to load managers:', err)
    }
  }

  async function loadCurrentStatistics() {
    try {
      const data = await getStatistics()
      setCurrentStats(data)
    } catch (err) {
      setError('Failed to load statistics')
    }
  }

  async function loadHistoricalStatistics(days) {
    setLoadingStats(true)
    try {
      const data = await getStatisticsHistory(days)
      setHistoryData(data)
      setDaysSelected(days)
    } catch (err) {
      setError('Failed to load statistics history')
    } finally {
      setLoadingStats(false)
    }
  }

  function formatCurrency(value) {
    if (!value) return '0'
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  async function handleManagerChange(workerId, newManagerId) {
    try {
      await updateUserManager(workerId, newManagerId)
      // Reload transactions to show updated manager
      loadTransactions()
      setEditingManager(null)
    } catch (err) {
      setError('Failed to update manager: ' + err.message)
    }
  }

  return (
    <div className="director-dashboard-container">
      <div className="dashboard-header">
        <h2>Director Dashboard</h2>
        <div className="director-tabs">
          <button
            className={`director-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            📊 Analytics
          </button>
          <button
            className={`director-tab ${activeView === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveView('employees')}
          >
            👥 Employee Management
          </button>
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <>
      {error && <div className="error-msg">{error}</div>}

      {/* Inner Navigation */}
      <div className="stats-navigation">
        <div className="stats-nav-tabs">
          <button
            className={`stats-nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`stats-nav-tab ${activeSection === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveSection('financial')}
          >
            💰 Financial
          </button>
          <button
            className={`stats-nav-tab ${activeSection === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveSection('workers')}
          >
            👷 Workers
          </button>
          <button
            className={`stats-nav-tab ${activeSection === 'managers' ? 'active' : ''}`}
            onClick={() => setActiveSection('managers')}
          >
            👨‍💼 Managers
          </button>
        </div>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="stats-section overview-section">
          {/* Current Statistics Card */}
          <section className="statistics-card">
            <h3>Current Statistics</h3>
            {currentStats ? (
              <div className="stats-grid">
                <div className="stat-box income">
                  <div className="stat-label">Total Income</div>
                  <div className="stat-value">{formatCurrency(currentStats.totalIncome)} UZS</div>
                  <div className="stat-unit">transactions</div>
                </div>
                <div className="stat-box spending">
                  <div className="stat-label">Total Spending</div>
                  <div className="stat-value">{formatCurrency(currentStats.totalSpending)} UZS</div>
                  <div className="stat-unit">transactions</div>
                </div>
                <div className="stat-box profit">
                  <div className="stat-label">Net Profit</div>
                  <div className="stat-value">{formatCurrency(currentStats.netProfit)} UZS</div>
                  <div className="stat-unit">income - spending</div>
                </div>
                <div className="stat-box count">
                  <div className="stat-label">Transactions</div>
                  <div className="stat-value">{currentStats.transactionCount}</div>
                  <div className="stat-unit">total accepted</div>
                </div>
              </div>
            ) : (
              <div className="loading">Loading current statistics...</div>
            )}
          </section>
        </div>
      )}

      {/* Financial Section */}
      {activeSection === 'financial' && (
        <div className="stats-section financial-section">
          {/* Hourly Growth */}
          <section className="hourly-growth-section">
            <h3>Today's Hourly Growth</h3>
            {hourlyData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={hourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                      stroke="#666"
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name === 'income' ? 'Income' : name === 'spending' ? 'Spending' : 'Net Profit'
                      ]}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#28a745" 
                      strokeWidth={3}
                      dot={{ fill: '#28a745', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spending" 
                      stroke="#dc3545" 
                      strokeWidth={3}
                      dot={{ fill: '#dc3545', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Spending"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netProfit" 
                      stroke="#007bff" 
                      strokeWidth={3}
                      dot={{ fill: '#007bff', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Net Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">No hourly data available yet</div>
            )}
          </section>

          {/* Historical Growth */}
          <section className="historical-growth-section">
            <h3>Historical Growth</h3>
            <div className="history-controls">
              <div className="history-buttons">
                <button
                  className={`history-btn ${daysSelected === 7 ? 'active' : ''}`}
                  onClick={() => loadHistoricalStatistics(7)}
                  disabled={loadingStats}
                >
                  7 days
                </button>
                <button
                  className={`history-btn ${daysSelected === 30 ? 'active' : ''}`}
                  onClick={() => loadHistoricalStatistics(30)}
                  disabled={loadingStats}
                >
                  30 days
                </button>
                <button
                  className={`history-btn ${daysSelected === 90 ? 'active' : ''}`}
                  onClick={() => loadHistoricalStatistics(90)}
                  disabled={loadingStats}
                >
                  90 days
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div className="loading">Loading historical data...</div>
            ) : historyData.length > 0 ? (
              <div className="history-chart">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="right">Income</th>
                      <th className="right">Spending</th>
                      <th className="right">Net Profit</th>
                      <th className="right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
                        <td>{row.asOfDate}</td>
                        <td className="right income-text">{formatCurrency(row.totalIncome)}</td>
                        <td className="right spending-text">{formatCurrency(row.totalSpending)}</td>
                        <td className={`right profit-text ${parseFloat(row.netProfit) >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(row.netProfit)}
                        </td>
                        <td className="right">{row.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="data-note">Showing {historyData.length} days of historical data</p>
              </div>
            ) : (
              <div className="empty-state">No historical data available yet</div>
            )}
          </section>
        </div>
      )}

      {/* Workers Section */}
      {activeSection === 'workers' && (
        <>
        <div className="stats-section workers-section">
          {/* All Transactions */}
          <section className="all-transactions">
            <h3>All Accepted Transactions</h3>
            <div className="transactions-header">
              <div className="transactions-info">
                <span className="count-badge">{pagination.totalElements} total accepted</span>
              </div>
            </div>

            {loadingTxs ? (
              <div className="loading">Loading transactions...</div>
            ) : txs.length > 0 ? (
              <>
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Worker</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map(t => (
                      <tr key={t.id}>
                        <td>{t.product}</td>
                        <td className={t.type.toLowerCase()}>{t.type}</td>
                        <td>{formatCurrency(t.amount)} {t.currency}</td>
                        <td>{t.workerName}</td>
                        <td>{t.managerName}</td>
                        <td className={`status-${t.status.toLowerCase()}`}>{t.status}</td>
                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  disabled={pagination.first || loadingTxs}
                  onClick={() => loadTransactions(pagination.page - 1, pagination.size)}
                >
                  ← Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`page-number ${i === pagination.page ? 'active' : ''}`}
                      onClick={() => loadTransactions(i, pagination.size)}
                      disabled={loadingTxs}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn"
                  disabled={pagination.last || loadingTxs}
                  onClick={() => loadTransactions(pagination.page + 1, pagination.size)}
                >
                  Next →
                </button>
              </div>
            </>
          </section>
        </div>
        </>
      )}

      {/* Managers Section */}
      {activeSection === 'managers' && (
        <>
        <div className="stats-section managers-section">
          <section className="manager-analytics">
            <h3>Manager Performance Analytics</h3>
            <div className="manager-stats-grid">
              <div className="manager-stat-card">
                <h4>Total Managers</h4>
                <div className="manager-stat-value">{managers.length}</div>
              </div>
              <div className="manager-stat-card">
                <h4>Active Managers</h4>
                <div className="manager-stat-value">{managers.filter(m => m.active).length}</div>
              </div>
              <div className="manager-stat-card">
                <h4>Avg. Transactions per Manager</h4>
                <div className="manager-stat-value">
                  {managers.length > 0 ? Math.round(pagination.totalElements / managers.length) : 0}
                </div>
              </div>
            </div>
            <div className="manager-note">
              <p>📊 Detailed manager analytics and approval metrics coming soon</p>
            </div>
          </section>
        </div>
        </>
      )}
        </>
      ) : (
        <EmployeeManagement />
      )}
    </div>
  )
}
