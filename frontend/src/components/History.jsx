import { useState, useEffect } from 'react'
import { Calendar, Trash2, Edit, X, Loader2, AlertCircle, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function History({ userId, username, token, currentUserId, onDataChanged, onSelectTransaction }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editType, setEditType] = useState('INVEST')
  const [editError, setEditError] = useState('')
  const [updating, setUpdating] = useState(false)

  const isSelf = userId === currentUserId

  const fetchUserHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(getBackendUrl(`/api/transactions/?user_id=${userId}`), {
        headers: {
          'Authorization': `Token ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setTransactions(data.transactions)
      } else {
        setError(data.error || 'Failed to fetch history')
      }
    } catch (err) {
      console.error(err)
      setError('Connection error. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserHistory()
  }, [userId])

  // Delete transaction
  const handleDelete = async (txId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await fetch(getBackendUrl(`/api/transactions/${txId}/`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      })

      if (response.ok) {
        fetchUserHistory()
        if (onDataChanged) onDataChanged()
      } else {
        alert('Failed to delete transaction')
      }
    } catch (err) {
      console.error(err)
      alert('Network error')
    }
  }

  // Open edit modal
  const openEditModal = (tx) => {
    setSelectedTx(tx)
    setEditAmount(tx.amount.toString())
    setEditNotes(tx.notes)
    setEditType(tx.type)
    setEditError('')
    setShowEditModal(true)
  }

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')

    const parsedAmount = parseFloat(editAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setEditError('Please enter a valid amount')
      return
    }

    if (!editNotes.trim()) {
      setEditError('Notes are required')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(getBackendUrl(`/api/transactions/${selectedTx.id}/`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          type: editType,
          amount: parsedAmount,
          notes: editNotes.trim(),
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchUserHistory()
        if (onDataChanged) onDataChanged()
      } else {
        const data = await response.json()
        setEditError(data.error || 'Failed to update transaction')
      }
    } catch (err) {
      console.error(err)
      setEditError('Network error')
    } finally {
      setUpdating(false)
    }
  }

  // Calculate metrics: Net Balance = Total Collect - Total Invest - Total Withdraw
  const totalInvest = transactions.filter(t => t.type === 'INVEST').reduce((acc, t) => acc + t.amount, 0)
  const totalCollect = transactions.filter(t => t.type === 'COLLECT').reduce((acc, t) => acc + t.amount, 0)
  const totalWithdraw = transactions.filter(t => t.type === 'WITHDRAW').reduce((acc, t) => acc + t.amount, 0)
  const balance = totalCollect - totalInvest - totalWithdraw

  // Group transactions by month
  const groupedTransactions = {};
  transactions.forEach((tx) => {
    const date = new Date(tx.date)
    const monthYear = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    if (!groupedTransactions[monthYear]) {
      groupedTransactions[monthYear] = []
    }
    groupedTransactions[monthYear].push(tx)
  })

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="glass-card animate-fade-in nav-padding">
      <div className="accent-glow-top"></div>

      <div className="glass-card-header">
        <h1>{username}'s Ledger</h1>
        <p>{isSelf ? 'Personal financial transactions overview' : 'Auditable business history'}</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid (4 Cards) */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
        <div className="metric-card invest-card">
          <span className="label">Total Invest</span>
          <span className="value">₹{totalInvest.toLocaleString('en-IN')}</span>
        </div>
        
        <div className="metric-card collect-card">
          <span className="label">Total Collect</span>
          <span className="value">₹{totalCollect.toLocaleString('en-IN')}</span>
        </div>

        <div className="metric-card withdraw-card">
          <span className="label">Total Withdraw</span>
          <span className="value">₹{totalWithdraw.toLocaleString('en-IN')}</span>
        </div>

        <div className="metric-card balance-card">
          <span className="label">Net Balance</span>
          <span className="value" style={{ color: balance >= 0 ? '#c084fc' : 'var(--error)' }}>
            ₹{balance.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading entries...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="history-empty" style={{ padding: '4rem 1rem' }}>
          No logged transactions found for this user.
        </div>
      ) : (
        <div className="history-list">
          {Object.keys(groupedTransactions).map((monthYear) => (
            <div key={monthYear} className="history-group">
              <div className="history-group-header">
                <span>{monthYear}</span>
                <span style={{ fontSize: '0.7rem' }}>{groupedTransactions[monthYear].length} entries</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedTransactions[monthYear].map((tx) => {
                  const isInvest = tx.type === 'INVEST'
                  const isWithdraw = tx.type === 'WITHDRAW'
                  const itemClass = isInvest ? 'type-expense' : isWithdraw ? 'type-withdraw' : 'type-income'
                  const amountColor = isInvest ? 'var(--error)' : isWithdraw ? '#f59e0b' : 'var(--success)'
                  const amountPrefix = (isInvest || isWithdraw) ? '-' : '+'

                  return (
                    <div 
                      key={tx.id} 
                      className={`history-item ${itemClass}`}
                      style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}
                      onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                    >
                      <div className="history-info">
                        <span className="history-desc">{tx.notes}</span>
                        <div className="history-info-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="history-date" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDate(tx.date)}</span>
                          {isWithdraw && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              Withdrawal
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="history-right">
                        <span className="history-amount" style={{ color: amountColor }}>
                          {amountPrefix} ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                        
                        {isSelf && (
                          <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                            <button 
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.35rem', background: 'rgba(147, 51, 234, 0.1)', border: '1px solid var(--card-border-glow)', color: '#c084fc' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(tx)
                              }}
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.35rem' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(tx.id)
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
              <span>Edit Entry</span>
              <X 
                size={18} 
                style={{ cursor: 'pointer', color: 'var(--muted)' }} 
                onClick={() => setShowEditModal(false)} 
              />
            </h2>

            {editError && (
              <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={14} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Type</label>
                <div className="tab-group" style={{ marginBottom: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={`tab-btn ${editType === 'INVEST' ? 'active' : ''}`}
                    style={{ background: editType === 'INVEST' ? 'var(--error)' : '', boxShadow: 'none', padding: '0.4rem 0.2rem', fontSize: '0.75rem' }}
                    onClick={() => setEditType('INVEST')}
                  >
                    <TrendingDown size={11} /> Invest
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${editType === 'COLLECT' ? 'active' : ''}`}
                    style={{ background: editType === 'COLLECT' ? 'var(--success)' : '', boxShadow: 'none', padding: '0.4rem 0.2rem', fontSize: '0.75rem' }}
                    onClick={() => setEditType('COLLECT')}
                  >
                    <TrendingUp size={11} /> Collect
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${editType === 'WITHDRAW' ? 'active' : ''}`}
                    style={{ background: editType === 'WITHDRAW' ? '#f59e0b' : '', boxShadow: 'none', padding: '0.4rem 0.2rem', fontSize: '0.75rem' }}
                    onClick={() => setEditType('WITHDRAW')}
                  >
                    <TrendingDown size={11} /> Withdraw
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editAmount">Amount (Rupees)</label>
                <div className="input-wrapper">
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    id="editAmount"
                    className="form-control"
                    style={{ paddingLeft: '1.75rem' }}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label htmlFor="editNotes">Notes / Description</label>
                <input
                  type="text"
                  id="editNotes"
                  className="form-control"
                  style={{ paddingLeft: '0.75rem' }}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  disabled={updating}
                />
              </div>

              <div className="flex-row">
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: 'transparent', border: '1px solid var(--input-border)', color: 'var(--muted)', boxShadow: 'none' }}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
