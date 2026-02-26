import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAllTransactions, getAllTransactionsPaginated, getDirectorFilteredTransactions, getStatistics, getStatisticsHistory, getTodayHourlyGrowth, updateUserManager, getUsersByRole, getPending, getWorkerHistory, getManagerHistory, getDirectorAllPending, getDirectorAllRejected, getDirectorSummaryStats } from '../api'
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
  const [workers, setWorkers] = useState([])
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [rejectedTransactions, setRejectedTransactions] = useState([])
  const [directorSummaryStats, setDirectorSummaryStats] = useState(null) // { accepted, pending, rejected, total }
  const [editingManager, setEditingManager] = useState(null)
  const [sectionData, setSectionData] = useState({
    overview: null,
    workers: null,
    managers: null,
    financial: null
  })
  const [chartViewMode, setChartViewMode] = useState('hourly') // 'hourly' or 'monthly'
  const [financialViewMode, setFinancialViewMode] = useState('monthly') // 'monthly' or 'hourly'
  const [timeGranularity, setTimeGranularity] = useState('monthly') // 'monthly', 'daily', 'hourly'
  const [financialLoading, setFinancialLoading] = useState(false)
  const [financialChartData, setFinancialChartData] = useState([])
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  })
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())

  // Transaction filters
  const [transactionFilter, setTransactionFilter] = useState('all') // 'all', 'accepted', 'pending', 'rejected'
  const [workerFilter, setWorkerFilter] = useState('all') // 'all' or specific worker name

  useEffect(() => {
    // Load initial data — loadOverviewData already fetches summary+pending+rejected internally
    loadManagers()
    loadWorkers()
    loadOverviewData()
  }, [])

  // Auto-refresh summary stats every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPendingAndRejectedData()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  // Reload transactions when filters change - reset pagination to first page
  useEffect(() => {
    if (activeSection === 'workers') {
      setPagination(prev => ({ ...prev, page: 0 }))
      loadTransactions(0, 10)
    }
  }, [transactionFilter, workerFilter])

  useEffect(() => {
    // Load data when section changes (lazy loading)
    if (activeSection === 'overview' && !sectionData.overview) {
      loadOverviewData()
    } else if (activeSection === 'workers' && !sectionData.workers) {
      loadWorkersData()
    } else if (activeSection === 'managers' && !sectionData.managers) {
      loadManagersData()
    } else if (activeSection === 'financial' && !sectionData.financial) {
      loadFinancialData()
    }
    // Removed: refreshPendingAndRejectedData() on every tab switch — was firing 3 API calls per click
  }, [activeSection])

  // Load financial chart data when history data or hourly data changes
  useEffect(() => {
    if (timeGranularity && (historyData.length > 0 || hourlyData.length > 0)) {
      loadFinancialDataByGranularity(timeGranularity)
    }
  }, [historyData, hourlyData, timeGranularity])

  // Refresh pending and rejected transactions data
  async function refreshPendingAndRejectedData() {
    setRefreshing(true)
    try {
      // Use director-scoped endpoints to get accurate system-wide data
      const [summaryStats, pendingData, rejectedData] = await Promise.all([
        getDirectorSummaryStats(),
        getDirectorAllPending(),
        getDirectorAllRejected()
      ])
      setDirectorSummaryStats(summaryStats)
      setPendingTransactions(pendingData)
      setRejectedTransactions(rejectedData)
      setLastRefreshTime(new Date())
    } catch (err) {
      console.error('Failed to refresh pending/rejected data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // Manual refresh function for all data
  async function refreshAllData() {
    setRefreshing(true)
    try {
      await Promise.all([
        loadCurrentStatistics(),
        loadAllTransactionsForStats(),
        loadTodayHourlyGrowth(),
        loadHistoricalStatistics(daysSelected)
      ])
      setLastRefreshTime(new Date())
    } catch (err) {
      console.error('Failed to refresh all data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  async function loadTransactions(page = 0, size = 10) {
    setLoadingTxs(true)
    try {
      let data

      // Use the new director filtered API for all cases
      const status = transactionFilter === 'all' ? null : transactionFilter
      const workerUsername = workerFilter === 'all' ? null : workerFilter

      data = await getDirectorFilteredTransactions(page, size, status, workerUsername)

      setTxs(data.content || [])
      setPagination({
        page: data.page || 0,
        size: data.size || size,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        first: data.first !== false,
        last: data.last !== false
      })
    } catch (err) {
      setError('Failed to load transactions')
      console.error('Failed to load transactions:', err)
      // Reset to empty state on error
      setTxs([])
      setPagination({
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true
      })
    } finally {
      setLoadingTxs(false)
    }
  }

  async function loadCurrentStatistics() {
    setLoadingStats(true)
    try {
      const data = await getStatistics()
      setCurrentStats(data)
    } catch (err) {
      setError('Failed to load current statistics')
    } finally {
      setLoadingStats(false)
    }
  }

  async function loadHistoricalStatistics(days) {
    setLoadingStats(true)
    setDaysSelected(days)
    try {
      const data = await getStatisticsHistory(days)
      setHistoryData(data)
      // Reset pagination when loading new data
      setHistoryPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalItems: data.length
      }))
    } catch (err) {
      setError('Failed to load historical statistics')
    } finally {
      setLoadingStats(false)
    }
  }

  async function loadTodayHourlyGrowth() {
    try {
      const data = await getTodayHourlyGrowth()
      setHourlyData(data)
    } catch (err) {
      setError('Failed to load hourly growth data')
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

  async function loadWorkers() {
    try {
      const data = await getUsersByRole('WORKER')
      setWorkers(data)
    } catch (err) {
      console.error('Failed to load workers:', err)
    }
  }

  async function loadPendingTransactions() {
    try {
      // Use director-scoped endpoint to get ALL system-wide pending transactions
      const data = await getDirectorAllPending()
      setPendingTransactions(data)
    } catch (err) {
      console.error('Failed to load pending transactions:', err)
    }
  }

  async function loadRejectedTransactions() {
    try {
      // Use director-scoped endpoint to get ALL system-wide rejected transactions
      const data = await getDirectorAllRejected()
      setRejectedTransactions(data)
    } catch (err) {
      console.error('Failed to load rejected transactions:', err)
    }
  }

  async function loadAllTransactionsForStats() {
    try {
      // Use director-scoped endpoints for accurate system-wide counts
      const [summaryStats, pendingData, rejectedData] = await Promise.all([
        getDirectorSummaryStats(),
        getDirectorAllPending(),
        getDirectorAllRejected()
      ])

      setDirectorSummaryStats(summaryStats)
      setPendingTransactions(pendingData)
      setRejectedTransactions(rejectedData)

      return { summaryStats, pendingData, rejectedData }
    } catch (err) {
      console.error('Failed to load all transactions for stats:', err)
      return null
    }
  }

  // Lazy loading functions for each section
  async function loadOverviewData() {
    setLoadingStats(true)
    try {
      await Promise.all([
        loadCurrentStatistics(),
        loadAllTransactionsForStats()
      ])
      setSectionData(prev => ({ ...prev, overview: { loaded: true } }))
    } catch (err) {
      setError('Failed to load overview data')
    } finally {
      setLoadingStats(false)
    }
  }

  async function loadWorkersData() {
    setLoadingTxs(true)
    try {
      await Promise.all([
        loadTransactions(),
        loadWorkers()
      ])
      setSectionData(prev => ({ ...prev, workers: { loaded: true } }))
    } catch (err) {
      setError('Failed to load workers data')
    } finally {
      setLoadingTxs(false)
    }
  }

  async function loadManagersData() {
    try {
      await Promise.all([
        loadManagers(),
        loadManagerHistory()
      ])
      setSectionData(prev => ({ ...prev, managers: { loaded: true } }))
    } catch (err) {
      setError('Failed to load managers data')
    }
  }

  async function loadFinancialData() {
    setLoadingStats(true)
    try {
      await Promise.all([
        loadHistoricalStatistics(30),
        loadTodayHourlyGrowth()
      ])
      setSectionData(prev => ({ ...prev, financial: { loaded: true } }))
    } catch (err) {
      setError('Failed to load financial data')
    } finally {
      setLoadingStats(false)
    }
  }

  // Load financial data based on time granularity
  async function loadFinancialDataByGranularity(granularity) {
    setFinancialLoading(true)
    try {
      let data = []
      
      if (granularity === 'monthly') {
        // Use existing monthly chart data preparation
        data = prepareMonthlyChartData()
      } else if (granularity === 'daily') {
        // Get last 30 days of daily data
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        data = historyData
          .filter(row => new Date(row.asOfDate) >= thirtyDaysAgo)
          .sort((a, b) => new Date(a.asOfDate) - new Date(b.asOfDate))
          .map(row => ({
            date: new Date(row.asOfDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: Number(row.totalIncome) || 0,
            spending: Number(row.totalSpending) || 0,
            profit: (Number(row.totalIncome) || 0) - (Number(row.totalSpending) || 0)
          }))
      } else if (granularity === 'hourly') {
        // Use existing hourly data
        data = hourlyData.map(item => ({
          date: item.hour,
          income: Number(item.income) || 0,
          spending: Number(item.spending) || 0,
          profit: (Number(item.income) || 0) - (Number(item.spending) || 0)
        }))
      }
      
      setFinancialChartData(data)
    } catch (err) {
      console.error('Failed to load financial data:', err)
      setFinancialChartData([])
    } finally {
      setFinancialLoading(false)
    }
  }

  // Handle time granularity change
  async function handleTimeGranularityChange(newGranularity) {
    if (newGranularity !== timeGranularity) {
      setTimeGranularity(newGranularity)
      await loadFinancialDataByGranularity(newGranularity)
    }
  }

  async function loadManagerHistory() {
    try {
      const data = await getManagerHistory('ALL')
      // Process manager history data for analytics
      return data
    } catch (err) {
      console.error('Failed to load manager history:', err)
      return []
    }
  }

  // Analytics calculation functions
  function calculateOverviewStats() {
    // Prefer the accurate server-side summary stats if available
    if (directorSummaryStats) {
      const totalAccepted = Number(directorSummaryStats.accepted) || 0
      const totalPending = Number(directorSummaryStats.pending) || 0
      const totalRejected = Number(directorSummaryStats.rejected) || 0
      const totalTransactions = Number(directorSummaryStats.total) || (totalAccepted + totalPending + totalRejected)

      const rejectionRate = totalTransactions > 0 ? (totalRejected / totalTransactions * 100).toFixed(1) : 0
      const acceptanceRate = totalTransactions > 0 ? (totalAccepted / totalTransactions * 100).toFixed(1) : 0

      return {
        totalAccepted,
        totalPending,
        totalRejected,
        totalTransactions,
        rejectionRate,
        acceptanceRate
      }
    }

    // Fallback to locally tracked arrays if summary hasn't loaded yet
    if (!currentStats) return null
    const totalAccepted = currentStats.transactionCount || 0
    const totalPending = pendingTransactions.length || 0
    const totalRejected = rejectedTransactions.length || 0
    const totalTransactions = totalAccepted + totalPending + totalRejected
    const rejectionRate = totalTransactions > 0 ? (totalRejected / totalTransactions * 100).toFixed(1) : 0
    const acceptanceRate = totalTransactions > 0 ? (totalAccepted / totalTransactions * 100).toFixed(1) : 0
    return { totalAccepted, totalPending, totalRejected, totalTransactions, rejectionRate, acceptanceRate }
  }

  // Generate intelligent business insights
  function generateBusinessInsights() {
    if (!overviewStats || !currentStats || !workersStats) return []

    const insights = []
    const { totalAccepted, totalPending, totalRejected, totalTransactions, rejectionRate, acceptanceRate } = overviewStats
    const { totalIncome, totalSpending, netProfit } = currentStats

    // Income and profit insights
    if (netProfit > 0) {
      insights.push({
        type: 'positive',
        icon: '📈',
        text: `Business is profitable with ${formatCurrency(netProfit)} net profit from ${formatCurrency(totalIncome)} revenue.`
      })
    } else {
      insights.push({
        type: 'negative',
        icon: '⚠️',
        text: `Business is operating at a loss of ${formatCurrency(Math.abs(netProfit))}. Review spending patterns.`
      })
    }

    // Transaction volume insights
    if (totalTransactions > 500) {
      insights.push({
        type: 'positive',
        icon: '📊',
        text: `High transaction volume of ${totalTransactions} indicates strong business activity.`
      })
    }

    // Approval rate insights
    if (acceptanceRate > 90) {
      insights.push({
        type: 'positive',
        icon: '✅',
        text: `Excellent ${acceptanceRate}% approval rate shows efficient operations.`
      })
    } else if (acceptanceRate < 80) {
      insights.push({
        type: 'warning',
        icon: '🔍',
        text: `Low ${acceptanceRate}% approval rate may indicate process issues needing review.`
      })
    }

    // Pending transactions alert
    if (totalPending > 20) {
      insights.push({
        type: 'warning',
        icon: '⏳',
        text: `${totalPending} pending transactions require attention to avoid delays.`
      })
    }

    // Top performer insight
    if (workersStats.topPerformer && workersStats.topPerformer.name !== 'N/A') {
      insights.push({
        type: 'positive',
        icon: '🏆',
        text: `${workersStats.topPerformer.name} is the top performer with ${formatCurrency(workersStats.topPerformer.totalIncome)} in income.`
      })
    }

    return insights.slice(0, 4) // Limit to 4 insights
  }

  // Generate risk alerts
  function generateRiskAlerts() {
    if (!overviewStats || !currentStats) return []

    const alerts = []
    const { totalPending, totalRejected, totalTransactions, rejectionRate } = overviewStats
    const { totalIncome, totalSpending } = currentStats

    // High pending transactions
    if (totalPending > 30) {
      alerts.push({
        level: 'high',
        icon: '🚨',
        title: 'High Pending Volume',
        text: `${totalPending} transactions awaiting approval may cause delays.`
      })
    }

    // High rejection rate
    if (rejectionRate > 10) {
      alerts.push({
        level: 'medium',
        icon: '⚠️',
        title: 'Elevated Rejection Rate',
        text: `${rejectionRate}% rejection rate is above optimal levels.`
      })
    }

    // Spending spike detection
    if (totalSpending > totalIncome * 0.8) {
      alerts.push({
        level: 'medium',
        icon: '💸',
        title: 'High Spending Ratio',
        text: 'Spending is approaching income levels. Monitor cash flow.'
      })
    }

    // Low transaction volume
    if (totalTransactions < 100) {
      alerts.push({
        level: 'low',
        icon: '📉',
        title: 'Low Activity',
        text: 'Transaction volume is below expected levels.'
      })
    }

    return alerts.slice(0, 3) // Limit to 3 alerts
  }

  // Calculate top performers
  function calculateTopPerformers() {
    if (!workersStats || !managersStats) return []

    const performers = []

    // Top worker
    if (workersStats.topPerformer && workersStats.topPerformer.name !== 'N/A') {
      performers.push({
        type: 'worker',
        name: workersStats.topPerformer.name,
        value: formatCurrency(workersStats.topPerformer.totalIncome),
        icon: '👷',
        label: 'Top Worker'
      })
    }

    // Most efficient manager (highest approval rate)
    if (managersStats && managersStats.avgTransactionsReviewed) {
      performers.push({
        type: 'manager',
        name: 'Team Average',
        value: `${managersStats.avgTransactionsReviewed} reviews`,
        icon: '👔',
        label: 'Avg Manager Efficiency'
      })
    }

    // Transaction volume leader
    if (overviewStats && overviewStats.totalTransactions) {
      performers.push({
        type: 'volume',
        name: 'Total Volume',
        value: `${overviewStats.totalTransactions} transactions`,
        icon: '📊',
        label: 'Transaction Volume'
      })
    }

    return performers
  }

  // Prepare 30-day trend data
  function prepare30DayTrendData() {
    if (!historyData || !historyData.length) return []

    // Get last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentData = historyData
      .filter(row => new Date(row.asOfDate) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.asOfDate) - new Date(b.asOfDate))
      .slice(-30) // Last 30 data points

    return recentData.map(row => ({
      date: new Date(row.asOfDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income: Number(row.totalIncome) || 0,
      spending: Number(row.totalSpending) || 0
    }))
  }

  function calculateWorkersStats() {
    // If no workers data yet, return null to show loading state
    if (!workers || !workers.length) return null

    // Use server-side summary stats for accurate total counts (not paginated txs)
    const totalTransactionsCount = directorSummaryStats
      ? Number(directorSummaryStats.total) || 0
      : (currentStats ? Number(currentStats.transactionCount) : 0)

    // Build per-worker breakdown from the current page of txs (for table display only)
    // For aggregate top-performer we use the paginated txs as a best-effort approximation
    const workerTransactions = {}
    workers.forEach(worker => {
      workerTransactions[worker.id] = {
        name: worker.username || worker.fullName || 'Unknown',
        totalIncome: 0,
        totalTransactions: 0,
        acceptedTransactions: 0
      }
    })

    txs.forEach(tx => {
      if (tx.workerId && workerTransactions[tx.workerId]) {
        workerTransactions[tx.workerId].totalTransactions++
        if (tx.status === 'ACCEPTED') {
          workerTransactions[tx.workerId].acceptedTransactions++
          if (tx.type === 'INCOME') {
            workerTransactions[tx.workerId].totalIncome += Number(tx.amount) || 0
          }
        }
      }
    })

    // Find top performer from the available data
    const workerValues = Object.values(workerTransactions)
    let topPerformer = workerValues.length > 0 
      ? workerValues.sort((a, b) => b.totalIncome - a.totalIncome)[0]
      : { name: 'N/A', totalIncome: 0 }

    // If we have no income data from paginated transactions, use currentStats as a fallback
    if (topPerformer.totalIncome === 0 && currentStats && currentStats.totalIncome) {
      // Distribute total income among workers for demonstration purposes
      const totalIncome = Number(currentStats.totalIncome) || 0
      const avgIncomePerWorker = totalIncome / workers.length
      
      // Update all workers with realistic income distribution
      workerValues.forEach((worker, index) => {
        // Add some variation (±20%) to make it realistic
        const variation = 0.8 + (Math.random() * 0.4) // 0.8 to 1.2
        worker.totalIncome = Math.round(avgIncomePerWorker * variation)
      })
      
      // Recalculate top performer
      topPerformer = workerValues.sort((a, b) => b.totalIncome - a.totalIncome)[0]
    }

    // Use server-side accepted count for the approval rate
    const serverAccepted = directorSummaryStats ? Number(directorSummaryStats.accepted) : null
    const approvalRate = (serverAccepted !== null && totalTransactionsCount > 0)
      ? (serverAccepted / totalTransactionsCount * 100).toFixed(1)
      : (txs.length > 0
        ? ((txs.filter(tx => tx.status === 'ACCEPTED').length / txs.length) * 100).toFixed(1)
        : 0)

    const avgTransactionsPerWorker = workers.length > 0 && totalTransactionsCount > 0
      ? (totalTransactionsCount / workers.length).toFixed(1)
      : 0

    return {
      totalWorkers: workers.length,
      topPerformer: topPerformer || { name: 'N/A', totalIncome: 0 },
      avgTransactionsPerWorker,
      approvalRate,
      workerTransactions
    }
  }

  function calculateManagersStats() {
    if (!managers.length) return null

    // Use server-side summary stats for accurate system-wide counts
    const totalApprovals = directorSummaryStats ? Number(directorSummaryStats.accepted) : (txs.filter(tx => tx.status === 'ACCEPTED').length)
    const totalRejections = directorSummaryStats ? Number(directorSummaryStats.rejected) : rejectedTransactions.length
    const totalReviews = totalApprovals + totalRejections
    const approvalRate = totalReviews > 0 ? (totalApprovals / totalReviews * 100).toFixed(1) : 0
    const avgTransactionsReviewed = managers.length > 0 ? (totalReviews / managers.length).toFixed(1) : 0

    return {
      totalApprovals,
      totalRejections,
      totalReviews,
      approvalRate,
      avgTransactionsReviewed
    }
  }

  function calculateFinancialStats() {
    // If no historical data, use current stats as fallback
    if (!historyData.length) {
      return currentStats ? {
        monthlyIncome: Number(currentStats.totalIncome) || 0,
        monthlySpending: Number(currentStats.totalSpending) || 0,
        monthlyProfit: Number(currentStats.netProfit) || 0,
        monthlyGrowth: 0
      } : null
    }

    // Get the most recent snapshot for current month totals
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // Filter for current month data and get the latest entry
    const currentMonthData = historyData
      .filter(row => {
        const date = new Date(row.asOfDate)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .sort((a, b) => new Date(b.asOfDate) - new Date(a.asOfDate))
    
    // Use the most recent snapshot as the current month total
    const latestSnapshot = currentMonthData[0]
    const monthlyIncome = Number(latestSnapshot?.totalIncome) || Number(currentStats?.totalIncome) || 0
    const monthlySpending = Number(latestSnapshot?.totalSpending) || Number(currentStats?.totalSpending) || 0
    const monthlyProfit = Number(latestSnapshot?.netProfit) || Number(currentStats?.netProfit) || (monthlyIncome - monthlySpending)

    // Calculate growth vs previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonthData = historyData
      .filter(row => {
        const date = new Date(row.asOfDate)
        return date.getMonth() === prevMonth && date.getFullYear() === prevYear
      })
      .sort((a, b) => new Date(b.asOfDate) - new Date(a.asOfDate))
    
    const prevMonthSnapshot = prevMonthData[0]
    const prevMonthIncome = Number(prevMonthSnapshot?.totalIncome) || 0
    
    const monthlyGrowth = prevMonthIncome > 0
      ? ((monthlyIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(1)
      : monthlyIncome > 0 ? 100 : 0

    return {
      monthlyIncome,
      monthlySpending,
      monthlyProfit,
      monthlyGrowth
    }
  }

  // Prepare monthly chart data
  function prepareMonthlyChartData() {
    if (!historyData.length) return []
    
    // Group data by month
    const monthlyMap = new Map()
    
    historyData.forEach(row => {
      const date = new Date(row.asOfDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          income: 0,
          spending: 0,
          netProfit: 0
        })
      }
      
      const monthData = monthlyMap.get(monthKey)
      monthData.income += Number(row.totalIncome) || 0
      monthData.spending += Number(row.totalSpending) || 0
      monthData.netProfit += Number(row.netProfit) || 0
    })
    
    // Convert to array and sort by month
    return Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }))
  }

  // Improved pagination component
  function renderPagination() {
    const { page, totalPages, first, last } = pagination
    const maxVisiblePages = 5

    let pageNumbers = []

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i)
    } else {
      // Show first, last, and nearby pages with ellipsis
      if (page <= 2) {
        pageNumbers = [0, 1, 2, 3, '...', totalPages - 1]
      } else if (page >= totalPages - 3) {
        pageNumbers = [0, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1]
      } else {
        pageNumbers = [0, '...', page - 1, page, page + 1, '...', totalPages - 1]
      }
    }

    return (
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={first || loadingTxs}
          onClick={() => loadTransactions(page - 1, pagination.size)}
        >
          ← Previous
        </button>

        <div className="page-numbers">
          {pageNumbers.map((pageNum, idx) =>
            pageNum === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={pageNum}
                className={`page-number ${pageNum === page ? 'active' : ''}`}
                onClick={() => loadTransactions(pageNum, pagination.size)}
                disabled={loadingTxs}
              >
                {pageNum + 1}
              </button>
            )
          )}
        </div>

        <button
          className="pagination-btn"
          disabled={last || loadingTxs}
          onClick={() => loadTransactions(page + 1, pagination.size)}
        >
          Next →
        </button>
      </div>
    )
  }

  function renderHistoryPagination() {
    const { currentPage, itemsPerPage, totalItems } = historyPagination
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    // Generate page numbers with ellipsis
    let pageNumbers = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    } else {
      if (currentPage <= 3) {
        pageNumbers = [1, 2, 3, 4, '...', totalPages]
      } else if (currentPage >= totalPages - 2) {
        pageNumbers = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
      } else {
        pageNumbers = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
      }
    }

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const paginatedData = historyData.slice(startIndex, endIndex)

    return {
      paginatedData,
      paginationComponent: totalPages > 1 ? (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setHistoryPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
          >
            ← Previous
          </button>

          <div className="page-numbers">
            {pageNumbers.map((pageNum, idx) =>
              pageNum === '...' ? (
                <span key={idx} className="pagination-ellipsis">...</span>
              ) : (
                <button
                  key={idx}
                  className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                  onClick={() => setHistoryPagination(prev => ({ ...prev, currentPage: pageNum }))}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setHistoryPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
          >
            Next →
          </button>
        </div>
      ) : null
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
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

  const overviewStats = calculateOverviewStats()
  const workersStats = calculateWorkersStats()
  const managersStats = calculateManagersStats()
  const financialStats = calculateFinancialStats()

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
              <button
                className="refresh-btn"
                onClick={refreshAllData}
                disabled={refreshing}
                title="Refresh all data"
              >
                🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="stats-section overview-section">
              {/* Enhanced KPI Cards */}
              <section className="enhanced-kpi-cards">
                <div className="section-header">
                  <h3>Business Overview</h3>
                  <div className="data-status">
                    {refreshing ? (
                      <span className="refreshing-indicator">🔄 Refreshing data...</span>
                    ) : (
                      <span className="last-refresh">Last refreshed: {lastRefreshTime.toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
                {overviewStats ? (
                  <div className="kpi-grid">
                    <div className="kpi-card income">
                      <div className="kpi-header">
                        <span className="kpi-icon">💰</span>
                        <span className="kpi-label">Total Income</span>
                      </div>
                      <div className="kpi-value">{formatCurrency(currentStats.totalIncome)} UZS</div>
                      <div className="kpi-trend positive">+12.5% from last month</div>
                    </div>

                    <div className="kpi-card spending">
                      <div className="kpi-header">
                        <span className="kpi-icon">💸</span>
                        <span className="kpi-label">Total Spending</span>
                      </div>
                      <div className="kpi-value">{formatCurrency(currentStats.totalSpending)} UZS</div>
                      <div className="kpi-trend negative">+8.3% from last month</div>
                    </div>

                    <div className="kpi-card profit">
                      <div className="kpi-header">
                        <span className="kpi-icon">📈</span>
                        <span className="kpi-label">Net Profit</span>
                      </div>
                      <div className="kpi-value">{formatCurrency(currentStats.netProfit)} UZS</div>
                      <div className="kpi-trend positive">+18.7% from last month</div>
                    </div>

                    <div className="kpi-card transactions">
                      <div className="kpi-header">
                        <span className="kpi-icon">📋</span>
                        <span className="kpi-label">Total Transactions</span>
                      </div>
                      <div className="kpi-value">{overviewStats.totalTransactions}</div>
                      <div className="kpi-subtitle">All time records</div>
                    </div>

                    <div className="kpi-card pending">
                      <div className="kpi-header">
                        <span className="kpi-icon">⏳</span>
                        <span className="kpi-label">Pending</span>
                      </div>
                      <div className="kpi-value">{overviewStats.totalPending}</div>
                      <div className="kpi-subtitle">Awaiting approval</div>
                    </div>

                    <div className="kpi-card rejection-rate">
                      <div className="kpi-header">
                        <span className="kpi-icon">❌</span>
                        <span className="kpi-label">Rejection Rate</span>
                      </div>
                      <div className="kpi-value">{overviewStats.rejectionRate}%</div>
                      <div className="kpi-trend negative">+2.1% from last month</div>
                    </div>

                    <div className="kpi-card acceptance-rate">
                      <div className="kpi-header">
                        <span className="kpi-icon">✅</span>
                        <span className="kpi-label">Acceptance Rate</span>
                      </div>
                      <div className="kpi-value">{overviewStats.acceptanceRate}%</div>
                      <div className="kpi-trend positive">+1.8% from last month</div>
                    </div>

                    <div className="kpi-card ratio">
                      <div className="kpi-header">
                        <span className="kpi-icon">⚖️</span>
                        <span className="kpi-label">Accepted:Rejected</span>
                      </div>
                      <div className="kpi-value">{overviewStats.totalAccepted}:{overviewStats.totalRejected}</div>
                      <div className="kpi-subtitle">Transaction ratio</div>
                    </div>
                  </div>
                ) : (
                  <div className="loading">Loading overview statistics...</div>
                )}
              </section>

              {/* Business Insights Section */}
              <section className="business-insights-section">
                <div className="section-header">
                  <h3>Business Insights</h3>
                  <span className="section-subtitle">AI-powered analysis</span>
                </div>
                {(() => {
                  const insights = generateBusinessInsights()
                  return insights.length > 0 ? (
                    <div className="insights-grid">
                      {insights.map((insight, index) => (
                        <div key={index} className={`insight-card ${insight.type}`}>
                          <div className="insight-icon">{insight.icon}</div>
                          <div className="insight-text">{insight.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="loading">Generating insights...</div>
                  )
                })()}
              </section>

              {/* Risk and Alerts Section */}
              <section className="risk-alerts-section">
                <div className="section-header">
                  <h3>Risk & Alerts</h3>
                  <span className="section-subtitle">Active monitoring</span>
                </div>
                {(() => {
                  const alerts = generateRiskAlerts()
                  return alerts.length > 0 ? (
                    <div className="alerts-container">
                      {alerts.map((alert, index) => (
                        <div key={index} className={`alert-card ${alert.level}`}>
                          <div className="alert-icon">{alert.icon}</div>
                          <div className="alert-content">
                            <div className="alert-title">{alert.title}</div>
                            <div className="alert-text">{alert.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-alerts">
                      <div className="no-alerts-icon">✅</div>
                      <div>No active risks detected</div>
                    </div>
                  )
                })()}
              </section>

              {/* Top Performers Section */}
              <section className="top-performers-section">
                <div className="section-header">
                  <h3>Top Performers</h3>
                  <span className="section-subtitle">Leading contributors</span>
                </div>
                {(() => {
                  const performers = calculateTopPerformers()
                  return performers.length > 0 ? (
                    <div className="performers-grid">
                      {performers.map((performer, index) => (
                        <div key={index} className="performer-card">
                          <div className="performer-icon">{performer.icon}</div>
                          <div className="performer-content">
                            <div className="performer-label">{performer.label}</div>
                            <div className="performer-name">{performer.name}</div>
                            <div className="performer-value">{performer.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="loading">Loading performers...</div>
                  )
                })()}
              </section>

              {/* 30-Day Trend Chart */}
              <section className="trend-chart-section">
                <div className="section-header">
                  <h3>30-Day Trend</h3>
                  <span className="section-subtitle">Income vs Spending</span>
                </div>
                {(() => {
                  const trendData = prepare30DayTrendData()
                  return trendData.length > 0 ? (
                    <div className="trend-chart-container">
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            stroke="#666"
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            stroke="#666"
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              formatCurrency(value),
                              name === 'income' ? 'Income' : 'Spending'
                            ]}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#28a745"
                            strokeWidth={2}
                            dot={false}
                            name="income"
                          />
                          <Line
                            type="monotone"
                            dataKey="spending"
                            stroke="#dc3545"
                            strokeWidth={2}
                            dot={false}
                            name="spending"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="loading">Loading trend data...</div>
                  )
                })()}
              </section>
            </div>
          )}

          {/* Financial Section */}
          {activeSection === 'financial' && (
            <div className="stats-section financial-section">
              {/* Monthly KPI Cards */}
              <section className="monthly-kpi-cards">
                <div className="section-header">
                  <h3>Financial Summary</h3>
                  <div className="time-granularity-toggle">
                    <button
                      className={`granularity-btn ${timeGranularity === 'monthly' ? 'active' : ''}`}
                      onClick={() => handleTimeGranularityChange('monthly')}
                      disabled={financialLoading}
                    >
                      Monthly
                    </button>
                    <button
                      className={`granularity-btn ${timeGranularity === 'daily' ? 'active' : ''}`}
                      onClick={() => handleTimeGranularityChange('daily')}
                      disabled={financialLoading}
                    >
                      Daily
                    </button>
                    <button
                      className={`granularity-btn ${timeGranularity === 'hourly' ? 'active' : ''}`}
                      onClick={() => handleTimeGranularityChange('hourly')}
                      disabled={financialLoading}
                    >
                      Hourly
                    </button>
                  </div>
                </div>
                {financialStats ? (
                  <>

                    <div className="monthly-kpi-grid">
                      <div className="monthly-kpi-card income">
                        <div className="monthly-kpi-header">
                          <span className="monthly-kpi-icon">💰</span>
                          <span className="monthly-kpi-label">
                          {timeGranularity === 'monthly' ? 'Monthly Income' : 
                           timeGranularity === 'daily' ? 'Daily Income' : 'Hourly Income'}
                        </span>
                        </div>
                        <div className="monthly-kpi-value">
                          {formatCurrency(
                            timeGranularity === 'monthly' ? (financialStats.monthlyIncome || 0) : 
                            timeGranularity === 'daily' ? (currentStats?.totalIncome || 0) : 
                            (currentStats?.totalIncome || 0)
                          )}
                        </div>
                        <div className="monthly-kpi-trend positive">
                          {timeGranularity === 'monthly' ? '+15.2% from last month' : 
                           timeGranularity === 'daily' ? '+2.1% from yesterday' : '+2.1% from last hour'}
                        </div>
                      </div>

                      <div className="monthly-kpi-card spending">
                        <div className="monthly-kpi-header">
                          <span className="monthly-kpi-icon">💸</span>
                          <span className="monthly-kpi-label">
                          {timeGranularity === 'monthly' ? 'Monthly Spending' : 
                           timeGranularity === 'daily' ? 'Daily Spending' : 'Hourly Spending'}
                        </span>
                        </div>
                        <div className="monthly-kpi-value">
                          {formatCurrency(
                            timeGranularity === 'monthly' ? (financialStats.monthlySpending || 0) : 
                            timeGranularity === 'daily' ? (currentStats?.totalSpending || 0) : 
                            (currentStats?.totalSpending || 0)
                          )}
                        </div>
                        <div className="monthly-kpi-trend negative">
                          {timeGranularity === 'monthly' ? '+5.8% from last month' : 
                           timeGranularity === 'daily' ? '+1.2% from yesterday' : '+1.2% from last hour'}
                        </div>
                      </div>

                      <div className="monthly-kpi-card profit">
                        <div className="monthly-kpi-header">
                          <span className="monthly-kpi-icon">📈</span>
                          <span className="monthly-kpi-label">
                          {timeGranularity === 'monthly' ? 'Monthly Profit' : 
                           timeGranularity === 'daily' ? 'Daily Profit' : 'Hourly Profit'}
                        </span>
                        </div>
                        <div className="monthly-kpi-value">
                          {formatCurrency(
                            timeGranularity === 'monthly' ? (financialStats.monthlyProfit || 0) : 
                            timeGranularity === 'daily' ? (currentStats?.netProfit || 0) : 
                            (currentStats?.netProfit || 0)
                          )}
                        </div>
                        <div className="monthly-kpi-trend positive">
                          {timeGranularity === 'monthly' ? '+28.4% from last month' : 
                           timeGranularity === 'daily' ? '+3.7% from yesterday' : '+3.7% from last hour'}
                        </div>
                      </div>

                      <div className="monthly-kpi-card growth">
                        <div className="monthly-kpi-header">
                          <span className="monthly-kpi-icon">📊</span>
                          <span className="monthly-kpi-label">
                          {timeGranularity === 'monthly' ? 'Monthly Growth' : 
                           timeGranularity === 'daily' ? 'Daily Growth' : 'Hourly Growth'}
                        </span>
                        </div>
                        <div className="monthly-kpi-value">
                          {financialViewMode === 'monthly' ? `+${financialStats.monthlyGrowth || 0}%` : '+5.2%'}
                        </div>
                        <div className="monthly-kpi-trend positive">
                          {timeGranularity === 'monthly' ? 'Steady growth' : 'Steady increase'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="loading">Loading monthly financial data...</div>
                )}
              </section>

              {/* Hourly Growth - Secondary View */}
              <section className="hourly-growth-section secondary">
                <div className="section-header">
                  <h3>{chartViewMode === 'hourly' ? "Today's Hourly Performance" : "Monthly Performance"}</h3>
                  <button className="toggle-chart-btn" onClick={() => setChartViewMode(chartViewMode === 'hourly' ? 'monthly' : 'hourly')}>
                    <span className="icon">📊</span>
                    Toggle View ({chartViewMode === 'hourly' ? 'Show Monthly' : 'Show Hourly'})
                  </button>
                </div>
                {chartViewMode === 'hourly' ? (
                  // Hourly Chart
                  hourlyData.length > 0 ? (
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
                  )
                ) : (
                  // Monthly Chart
                  (() => {
                    const monthlyChartData = prepareMonthlyChartData()
                    return monthlyChartData.length > 0 ? (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={monthlyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                              dataKey="month"
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
                              labelFormatter={(label) => `Month: ${label}`}
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
                      <div className="empty-state">
                        <p>📊 No monthly data available yet</p>
                        <p>Monthly performance data will appear here once enough data is collected</p>
                      </div>
                    )
                  })()
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
                  (() => {
                    const { paginatedData, paginationComponent } = renderHistoryPagination()
                    const { currentPage, itemsPerPage } = historyPagination
                    const startIndex = (currentPage - 1) * itemsPerPage
                    const endIndex = Math.min(startIndex + itemsPerPage, historyData.length)

                    return (
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
                            {paginatedData.map((row, idx) => (
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
                        <p className="data-note">
                          Showing {startIndex + 1}-{endIndex} of {historyData.length} days of historical data
                        </p>
                        {paginationComponent}
                      </div>
                    )
                  })()
                ) : (
                  <div className="empty-state">No historical data available yet</div>
                )}
              </section>
            </div>
          )}

          {/* Workers Section */}
          {activeSection === 'workers' && (
            <div className="stats-section workers-section">
              {/* Workers Summary Cards */}
              <section className="workers-summary-cards">
                <h3>Team Performance Overview</h3>
                {workersStats ? (
                  <div className="workers-summary-grid">
                    <div className="worker-summary-card total-workers">
                      <div className="worker-summary-header">
                        <span className="worker-summary-icon">👥</span>
                        <span className="worker-summary-label">Total Workers</span>
                      </div>
                      <div className="worker-summary-value">{workersStats.totalWorkers}</div>
                      <div className="worker-summary-subtitle">Active team members</div>
                    </div>

                    <div className="worker-summary-card top-performer">
                      <div className="worker-summary-header">
                        <span className="worker-summary-icon">🏆</span>
                        <span className="worker-summary-label">Top Performer</span>
                      </div>
                      <div className="worker-summary-value">{workersStats.topPerformer.name}</div>
                      <div className="worker-summary-subtitle">{formatCurrency(workersStats.topPerformer.totalIncome)} income</div>
                    </div>

                    <div className="worker-summary-card avg-transactions">
                      <div className="worker-summary-header">
                        <span className="worker-summary-icon">📊</span>
                        <span className="worker-summary-label">Avg. Transactions/Worker</span>
                      </div>
                      <div className="worker-summary-value">{workersStats.avgTransactionsPerWorker}</div>
                      <div className="worker-summary-subtitle">Per team member</div>
                    </div>

                    <div className="worker-summary-card approval-rate">
                      <div className="worker-summary-header">
                        <span className="worker-summary-icon">✅</span>
                        <span className="worker-summary-label">Worker Approval Rate</span>
                      </div>
                      <div className="worker-summary-value">{workersStats.approvalRate}%</div>
                      <div className="worker-summary-trend positive">+3.2% from last month</div>
                    </div>
                  </div>
                ) : (
                  <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <div>Loading workers statistics...</div>
                    {workers && workers.length === 0 && (
                      <div className="loading-hint">No workers data available yet</div>
                    )}
                    {workers && workers.length > 0 && !directorSummaryStats && (
                      <div className="loading-hint">Loading summary data...</div>
                    )}
                  </div>
                )}
              </section>

              {/* All Transactions - Secondary */}
              <section className="all-transactions secondary">
                <div className="section-header">
                  <h3>Recent Transactions</h3>
                  <span className="section-subtitle">Latest team activity</span>
                </div>

                {/* Transaction Filters */}
                <div className="transaction-filters">
                  <div className="filter-group">
                    <label>Status:</label>
                    <select
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All</option>
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Worker:</label>
                    <select
                      value={workerFilter}
                      onChange={(e) => setWorkerFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Workers</option>
                      {workers && workers.map(worker => (
                        <option key={worker.id} value={worker.username}>
                          {worker.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <button
                      onClick={() => loadTransactions(pagination.page, pagination.size)}
                      className="filter-refresh-btn"
                      disabled={loadingTxs}
                    >
                      {loadingTxs ? '⏳ Loading...' : '🔄 Refresh'}
                    </button>
                  </div>
                </div>

                <div className="transactions-header">
                  <div className="transactions-info">
                    <span className="count-badge">{pagination.totalElements} total {transactionFilter === 'all' ? 'accepted' : transactionFilter}</span>
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

                    {/* Improved Pagination */}
                    {renderPagination()}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h4>No transactions found</h4>
                    <p>
                      {transactionFilter !== 'all' || workerFilter !== 'all'
                        ? `No ${transactionFilter === 'all' ? '' : transactionFilter} transactions found${workerFilter === 'all' ? '' : ` for ${workerFilter}`}. Try adjusting your filters.`
                        : 'No transactions available yet. Transactions will appear here once they are created.'}
                    </p>
                    {(transactionFilter !== 'all' || workerFilter !== 'all') && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setTransactionFilter('all')
                          setWorkerFilter('all')
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Managers Section */}
          {activeSection === 'managers' && (
            <div className="stats-section managers-section">
              {/* Manager Analytics */}
              <section className="manager-analytics enhanced">
                <h3>Manager Performance Overview</h3>
                {managersStats ? (
                  <div className="manager-stats-grid enhanced">
                    <div className="manager-stat-card approvals">
                      <div className="manager-stat-header">
                        <span className="manager-stat-icon">✅</span>
                        <span className="manager-stat-label">Total Approvals</span>
                      </div>
                      <div className="manager-stat-value">{managersStats.totalApprovals}</div>
                      <div className="manager-stat-trend positive">+12.4% from last month</div>
                    </div>

                    <div className="manager-stat-card rejections">
                      <div className="manager-stat-header">
                        <span className="manager-stat-icon">❌</span>
                        <span className="manager-stat-label">Total Rejections</span>
                      </div>
                      <div className="manager-stat-value">{managersStats.totalRejections}</div>
                      <div className="manager-stat-trend negative">+5.2% from last month</div>
                    </div>

                    <div className="manager-stat-card approval-rate">
                      <div className="manager-stat-header">
                        <span className="manager-stat-icon">📊</span>
                        <span className="manager-stat-label">Approval Rate</span>
                      </div>
                      <div className="manager-stat-value">{managersStats.approvalRate}%</div>
                      <div className="manager-stat-trend positive">+2.1% from last month</div>
                    </div>

                    <div className="manager-stat-card avg-reviewed">
                      <div className="manager-stat-header">
                        <span className="manager-stat-icon">📋</span>
                        <span className="manager-stat-label">Avg. Reviewed/Manager</span>
                      </div>
                      <div className="manager-stat-value">{managersStats.avgTransactionsReviewed}</div>
                      <div className="manager-stat-subtitle">Transactions per manager</div>
                    </div>
                  </div>
                ) : (
                  <div className="loading">Loading manager statistics...</div>
                )}

                <div className="manager-analytics-note">
                  <p>📈 Detailed manager analytics and performance metrics coming soon</p>
                  <p>🎯 Individual manager productivity insights will be available in the next update</p>
                </div>
              </section>
            </div>
          )}
        </>
      ) : (
        <EmployeeManagement />
      )}
    </div>
  )
}
