import React, { useState, useEffect } from 'react'
import { getUsersByRole, createUser, updateUser, deleteUser, assignManagerToWorker } from '../api'
import '../styles/EmployeeManagement.css'

export default function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState('managers') // managers or workers
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editingWorkerManager, setEditingWorkerManager] = useState(null) // Track which worker's manager is being edited
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '' })
  const [managersList, setManagersList] = useState([])
  const [selectedManagerForWorker, setSelectedManagerForWorker] = useState(null)

  useEffect(() => {
    loadEmployees(activeTab)
  }, [activeTab])

  async function loadEmployees(role) {
    setLoading(true)
    setMsg('')
    try {
      const roleStr = role === 'managers' ? 'MANAGER' : 'WORKER'
      const data = await getUsersByRole(roleStr)
      setEmployees(data)
      if (role === 'workers') {
        const managers = await getUsersByRole('MANAGER')
        setManagersList(managers)
      }
    } catch (err) {
      setMsg('Failed to load employees: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAddClick() {
    setEditingEmployee(null)
    setFormData({ fullName: '', username: '', password: '' })
    setShowForm(true)
  }

  function handleEditClick(employee) {
    setEditingEmployee(employee)
    setFormData({ fullName: employee.fullName, username: employee.username, password: '' })
    setShowForm(true)
  }

  async function handleSaveEmployee() {
    if (!formData.fullName || !formData.username) {
      setMsg('Please fill all required fields')
      return
    }

    try {
      const roleStr = activeTab === 'managers' ? 'MANAGER' : 'WORKER'
      if (editingEmployee) {
        const updatePayload = { fullName: formData.fullName }
        if (formData.password) updatePayload.password = formData.password
        await updateUser(editingEmployee.id, updatePayload)
        setMsg('✓ Employee updated successfully')
      } else {
        await createUser({
          fullName: formData.fullName,
          username: formData.username,
          password: formData.password,
          role: roleStr
        })
        setMsg('✓ Employee created successfully')
      }
      setShowForm(false)
      setTimeout(() => loadEmployees(activeTab), 500)
    } catch (err) {
      setMsg('✗ Error: ' + err.message)
    }
  }

  async function handleDelete(employeeId) {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      await deleteUser(employeeId)
      setMsg('✓ Employee deleted successfully')
      setTimeout(() => loadEmployees(activeTab), 500)
    } catch (err) {
      setMsg('✗ Error: ' + err.message)
    }
  }

  async function handleAssignManager(workerId, managerId) {
    try {
      await assignManagerToWorker(workerId, managerId)
      setMsg('✓ Manager assigned successfully')
      setSelectedManagerForWorker(null)
      setTimeout(() => loadEmployees('workers'), 500)
    } catch (err) {
      setMsg('✗ Error assigning manager: ' + err.message)
    }
  }

  return (
    <div className="employee-management-container">
      <h2>👥 Employee Management</h2>
      <p className="subtitle">Manage workers and managers in your organization</p>

      {msg && <div className={msg.includes('✓') ? 'status' : 'error'}>{msg}</div>}

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'managers' ? 'active' : ''}`}
          onClick={() => setActiveTab('managers')}
        >
          📋 Managers
        </button>
        <button
          className={`tab-btn ${activeTab === 'workers' ? 'active' : ''}`}
          onClick={() => setActiveTab('workers')}
        >
          👷 Workers
        </button>
      </div>

      <div className="content-section">
        <div className="content-header">
          <h3>{activeTab === 'managers' ? 'Managers List' : 'Workers List'}</h3>
          <button className="btn-add" onClick={handleAddClick}>
            + Add {activeTab === 'managers' ? 'Manager' : 'Worker'}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="empty-state">No {activeTab} found. Add one to get started!</div>
        ) : (
          <div className="employees-table">
            <div className="table-header">
              <div className="col col-name">Name</div>
              <div className="col col-username">Username</div>
              {activeTab === 'workers' && <div className="col col-manager">Assigned Manager</div>}
              <div className="col col-actions">Actions</div>
            </div>
            {employees.map(emp => (
              <div key={emp.id} className="table-row">
                <div className="col col-name">{emp.fullName}</div>
                <div className="col col-username">{emp.username}</div>
                {activeTab === 'workers' && (
                  <div className="col col-manager">
                    {editingWorkerManager === emp.id ? (
                      <select
                        className="manager-select"
                        value={emp.assignedManagerId || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignManager(emp.id, parseInt(e.target.value))
                          }
                        }}
                        onBlur={() => setEditingWorkerManager(null)}
                      >
                        <option value="">Select Manager</option>
                        {managersList.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.fullName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="manager-display">
                        {emp.assignedManagerName || 'No Manager'}
                      </span>
                    )}
                  </div>
                )}
                <div className="col col-actions">
                  {activeTab === 'workers' && (
                    <button 
                      className="btn-small edit-manager" 
                      onClick={() => setEditingWorkerManager(emp.id)}
                      title="Edit Assigned Manager"
                    >
                      👤 Manager
                    </button>
                  )}
                  <button className="btn-small edit" onClick={() => handleEditClick(emp)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-small delete" onClick={() => handleDelete(emp.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingEmployee ? 'Edit' : 'Add'} {activeTab === 'managers' ? 'Manager' : 'Worker'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveEmployee()
              }}
            >
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g., johndoe"
                  disabled={!!editingEmployee}
                />
              </div>
              <div className="form-group">
                <label>Password {editingEmployee ? '(leave blank to keep current)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
