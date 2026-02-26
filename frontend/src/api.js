const API = '/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: 'Bearer ' + token } : {}
}

export async function login(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('profile', JSON.stringify({ username: data.username, role: data.role }))
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('profile')
}

export function getProfile() {
  const s = localStorage.getItem('profile')
  return s ? JSON.parse(s) : null
}

export async function createTransaction(payload) {
  const res = await fetch(`${API}/transactions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Create failed')
  return res.json()
}

export async function getPending() {
  const res = await fetch(`${API}/transactions/pending`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch pending')
  return res.json()
}

export async function reviewTransaction(id, action, comment) {
  const res = await fetch(`${API}/transactions/${id}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action, comment })
  })
  if (!res.ok) throw new Error('Review failed')
  return res.json()
}

export async function getAllTransactions() {
  const res = await fetch(`${API}/transactions/all-accepted`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export async function getAllTransactionsPaginated(page = 0, size = 10) {
  const res = await fetch(`${API}/transactions/all-accepted-paginated?page=${page}&size=${size}`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export async function getDirectorFilteredTransactions(page = 0, size = 10, status = null, workerUsername = null) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  if (status && status !== 'all') params.append('status', status)
  if (workerUsername && workerUsername !== 'all') params.append('workerUsername', workerUsername)
  
  const res = await fetch(`${API}/transactions/director-filtered?${params}`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch filtered transactions')
  return res.json()
}

export async function getStatistics() {
  const res = await fetch(`${API}/transactions/statistics`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

// Notification APIs
export async function getNotifications() {
  const res = await fetch(`${API}/notifications`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export async function getUnreadCount() {
  const res = await fetch(`${API}/notifications/unread-count`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch unread count')
  return res.json()
}

export async function markNotificationAsRead(id) {
  const res = await fetch(`${API}/notifications/${id}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to mark as read')
  return res.json()
}

export async function markAllNotificationsAsRead() {
  const res = await fetch(`${API}/notifications/read-all`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to mark all as read')
  return res.json()
}

// Transaction History APIs
export async function getWorkerHistory(status = 'ALL') {
  const res = await fetch(`${API}/transactions/history?status=${status}`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function getManagerHistory(status = 'ALL') {
  const res = await fetch(`${API}/transactions/manager-history?status=${status}`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

// Statistics History API
export async function getStatisticsHistory(days = 30) {
  const res = await fetch(`${API}/transactions/statistics/history?days=${days}`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

// Today's Hourly Growth API
export async function getTodayHourlyGrowth() {
  const res = await fetch(`${API}/transactions/statistics/today-hourly`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch hourly data')
  return res.json()
}

// Director-scoped system-wide queries (accurate counts across all workers/managers)
export async function getDirectorAllPending() {
  const res = await fetch(`${API}/transactions/director/all-pending`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch all pending')
  return res.json()
}

export async function getDirectorAllRejected() {
  const res = await fetch(`${API}/transactions/director/all-rejected`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch all rejected')
  return res.json()
}

export async function getDirectorSummaryStats() {
  const res = await fetch(`${API}/transactions/director/summary-stats`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch director summary stats')
  return res.json()
}

// User/Employee Management APIs
export async function getAllUsers() {
  const res = await fetch(`${API}/users`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function getUsersByRole(role) {
  // Get all users and filter by role on frontend due to security restrictions
  const res = await fetch(`${API}/users`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Failed to fetch users')
  const allUsers = await res.json()
  return allUsers.filter(user => user.role === role)
}

export async function createUser(userData) {
  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(userData)
  })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json()
}

export async function updateUser(userId, userData) {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(userData)
  })
  if (!res.ok) throw new Error('Failed to update user')
  return res.json()
}

export async function deleteUser(userId) {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to delete user')
  return res.json()
}

export async function assignManagerToWorker(workerId, managerId) {
  const res = await fetch(`${API}/users/${workerId}/assign-manager`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ managerId })
  })
  if (!res.ok) throw new Error('Failed to assign manager')
  return res.json()
}

export async function updateUserManager(userId, managerId) {
  const res = await fetch(`${API}/users/${userId}/update-manager`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ managerId })
  })
  if (!res.ok) throw new Error('Failed to update manager')
  return res.json()
}
