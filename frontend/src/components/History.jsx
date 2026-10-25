import { useState, useEffect, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Trash2, Edit, X, Loader2, AlertCircle, TrendingUp, TrendingDown, Layers } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function History({ userId, username, token, currentUserId, onDataChanged, onSelectTransaction }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editType, setEditType] = useState('INVEST')
  const [editError, setEditError] = useState('')
  const [updating, setUpdating] = useState(false)

  const isSelf = userId === currentUserId

  const getMonthYear = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

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
        const txList = data.transactions || []
        setTransactions(txList)
        
        // Auto-select latest month if not already selected
        if (txList.length > 0) {
          const latestMonth = getMonthYear(txList[0].date)
          setSelectedMonth(prev => prev || latestMonth)
        } else {
          setSelectedMonth('ALL')
        }
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

  // Derive unique months list chronologically (newest first)
  const uniqueMonths = useMemo(() => {
    const months = []
    transactions.forEach(t => {
      const m = getMonthYear(t.date)
      if (!months.includes(m)) months.push(m)
    })
    return months
  }, [transactions])

  // Active transactions based on selected month
  const activeTransactions = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'ALL') {
      return transactions
    }
    return transactions.filter(t => getMonthYear(t.date) === selectedMonth)
  }, [transactions, selectedMonth])

  // Transactions from the beginning of history up to the end of the selected month
  const cumulativeTransactions = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'ALL') {
      return transactions
    }
    const targetTx = transactions.find(t => getMonthYear(t.date) === selectedMonth)
    if (!targetTx) return transactions

    const targetDate = new Date(targetTx.date)
    const targetVal = targetDate.getFullYear() * 12 + targetDate.getMonth()

    return transactions.filter(t => {
      const d = new Date(t.date)
      const val = d.getFullYear() * 12 + d.getMonth()
      return val <= targetVal
    })
  }, [transactions, selectedMonth])

  // Calculate dynamic metrics for the selected month/period:
  // - Month Invest, Month Collect, Month Withdraw: from the selected month only (activeTransactions)
  // - Balance: cumulative from beginning up to the end of the selected month (cumulativeTransactions)
  const metrics = useMemo(() => {
    const totalInvest = activeTransactions.filter(t => t.type === 'INVEST').reduce((acc, t) => acc + t.amount, 0)
    const totalCollect = activeTransactions.filter(t => t.type === 'COLLECT').reduce((acc, t) => acc + t.amount, 0)
    const totalWithdraw = activeTransactions.filter(t => t.type === 'WITHDRAW').reduce((acc, t) => acc + t.amount, 0)

    const cumInvest = cumulativeTransactions.filter(t => t.type === 'INVEST').reduce((acc, t) => acc + t.amount, 0)
    const cumCollect = cumulativeTransactions.filter(t => t.type === 'COLLECT').reduce((acc, t) => acc + t.amount, 0)
    const cumWithdraw = cumulativeTransactions.filter(t => t.type === 'WITHDRAW').reduce((acc, t) => acc + t.amount, 0)
    const cumTransferIn = cumulativeTransactions.filter(t => t.type === 'TRANSFER' && t.transfer_direction === 'IN').reduce((acc, t) => acc + t.amount, 0)
    const cumTransferOut = cumulativeTransactions.filter(t => t.type === 'TRANSFER' && t.transfer_direction === 'OUT').reduce((acc, t) => acc + t.amount, 0)
    const balance = (cumCollect + cumTransferIn) - (cumInvest + cumWithdraw + cumTransferOut)

    return { totalInvest, totalCollect, totalWithdraw, balance }
  }, [activeTransactions, cumulativeTransactions])

  // Compute running balance after each transaction chronologically (oldest to newest)
  const runningBalancesMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (diff !== 0) return diff
      return a.id - b.id
    })

    let currentBalance = 0
    const map = {}
    sorted.forEach((tx) => {
      const prevBal = currentBalance
      if (tx.type === 'COLLECT') {
        currentBalance += tx.amount
      } else if (tx.type === 'INVEST' || tx.type === 'WITHDRAW') {
        currentBalance -= tx.amount
      } else if (tx.type === 'TRANSFER') {
        if (tx.transfer_direction === 'IN') {
          currentBalance += tx.amount
        } else {
          currentBalance -= tx.amount
        }
      }
      map[tx.id] = {
        balanceBefore: prevBal,
        balanceAfter: currentBalance
      }
    })
    return map
  }, [transactions])

  // Group active transactions by month for structured rendering
  const groupedTransactions = useMemo(() => {
    const grouped = {}
    activeTransactions.forEach((tx) => {
      const m = getMonthYear(tx.date)
      if (!grouped[m]) grouped[m] = []
      grouped[m].push(tx)
    })
    return grouped
  }, [activeTransactions])

  // Month navigation helpers
  const currentMonthIndex = uniqueMonths.indexOf(selectedMonth)
  const hasNewerMonth = currentMonthIndex > 0
  const hasOlderMonth = currentMonthIndex >= 0 && currentMonthIndex < uniqueMonths.length - 1

  const handlePrevMonth = () => {
    if (selectedMonth === 'ALL') {
      if (uniqueMonths.length > 0) setSelectedMonth(uniqueMonths[0])
      return
    }
    if (hasOlderMonth) {
      setSelectedMonth(uniqueMonths[currentMonthIndex + 1])
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 'ALL') {
      if (uniqueMonths.length > 0) setSelectedMonth(uniqueMonths[0])
      return
    }
    if (hasNewerMonth) {
      setSelectedMonth(uniqueMonths[currentMonthIndex - 1])
    }
  }

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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate monthly subtotal for a group header
  const getMonthSubtotal = (txList) => {
    const c = txList.filter(t => t.type === 'COLLECT').reduce((acc, t) => acc + t.amount, 0)
    const i = txList.filter(t => t.type === 'INVEST').reduce((acc, t) => acc + t.amount, 0)
    const w = txList.filter(t => t.type === 'WITHDRAW').reduce((acc, t) => acc + t.amount, 0)
    const tin = txList.filter(t => t.type === 'TRANSFER' && t.transfer_direction === 'IN').reduce((acc, t) => acc + t.amount, 0)
    const tout = txList.filter(t => t.type === 'TRANSFER' && t.transfer_direction === 'OUT').reduce((acc, t) => acc + t.amount, 0)
    return (c + tin) - (i + w + tout)
  }

  return (
    <div className="glass-card animate-fade-in nav-padding">
      <div className="accent-glow-top"></div>

      <div className="glass-card-header">
        <h1>{username}'s Ledger</h1>
        <p>{isSelf ? 'Personal month-by-month financial ledger' : 'Auditable business history'}</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* MONTH PICKER & STEPPER BAR */}
      {uniqueMonths.length > 0 && (
        <div className="month-picker-bar">
          <button 
            className="month-picker-btn"
            onClick={handlePrevMonth}
            disabled={!hasOlderMonth && selectedMonth !== 'ALL'}
            title="Older Month"
          >
            <ChevronLeft size={16} />
          </button>

          <select 
            className="month-select-dropdown"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">🗓️ All Time (All Months)</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>
                📅 {m}
              </option>
            ))}
          </select>

          <button 
            className="month-picker-btn"
            onClick={handleNextMonth}
            disabled={!hasNewerMonth && selectedMonth !== 'ALL'}
            title="Newer Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* DYNAMIC MONTH METRICS (4 CARDS) */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div className="metric-card invest-card">
          <span className="label">
            {selectedMonth === 'ALL' ? 'Total Invest' : 'Month Invest'}
          </span>
          <span className="value">₹{metrics.totalInvest.toLocaleString('en-IN')}</span>
        </div>
        
        <div className="metric-card collect-card">
          <span className="label">
            {selectedMonth === 'ALL' ? 'Total Collect' : 'Month Collect'}
          </span>
          <span className="value">₹{metrics.totalCollect.toLocaleString('en-IN')}</span>
        </div>

        <div className="metric-card withdraw-card">
          <span className="label">
            {selectedMonth === 'ALL' ? 'Total Withdraw' : 'Month Withdraw'}
          </span>
          <span className="value">₹{metrics.totalWithdraw.toLocaleString('en-IN')}</span>
        </div>

        <div className="metric-card balance-card" title={selectedMonth === 'ALL' ? 'Total Net Balance' : `Cumulative balance from start up to end of ${selectedMonth}`}>
          <span className="label">
            {selectedMonth === 'ALL' ? 'Net Balance' : 'Closing Balance'}
          </span>
          <span className="value" style={{ color: metrics.balance >= 0 ? '#c084fc' : 'var(--error)' }}>
            ₹{metrics.balance.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading entries...</span>
        </div>
      ) : activeTransactions.length === 0 ? (
        <div className="history-empty" style={{ padding: '3rem 1rem' }}>
          No transactions found for {selectedMonth === 'ALL' ? 'this user' : selectedMonth}.
        </div>
      ) : (
        <div className="history-list">
          {Object.keys(groupedTransactions).map((monthYear) => {
            const txList = groupedTransactions[monthYear]
            const monthNet = getMonthSubtotal(txList)

            return (
              <div key={monthYear} className="history-group">
                <div className="history-group-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} style={{ color: '#c084fc' }} />
                    <span>{monthYear}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 500 }}>
                      ({txList.length})
                    </span>
                  </div>

                  <span 
                    className="month-summary-tag"
                    style={{
                      color: monthNet >= 0 ? 'var(--success)' : 'var(--error)',
                      background: monthNet >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(244, 63, 94, 0.1)'
                    }}
                  >
                    Net: {monthNet >= 0 ? '+' : ''}₹{monthNet.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {txList.map((tx) => {
                    const isInvest = tx.type === 'INVEST'
                    const isWithdraw = tx.type === 'WITHDRAW'
                    const isTransfer = tx.type === 'TRANSFER'
                    const isTransferOut = isTransfer && tx.transfer_direction === 'OUT'
                    const isTransferIn = isTransfer && tx.transfer_direction === 'IN'

                    let itemClass = 'type-income'
                    let amountColor = 'var(--success)'
                    let amountPrefix = '+'

                    if (isInvest) {
                      itemClass = 'type-expense'
                      amountColor = 'var(--error)'
                      amountPrefix = '-'
                    } else if (isWithdraw) {
                      itemClass = 'type-withdraw'
                      amountColor = '#f59e0b'
                      amountPrefix = '-'
                    } else if (isTransferOut) {
                      itemClass = 'type-transfer-out'
                      amountColor = '#38bdf8'
                      amountPrefix = '-'
                    } else if (isTransferIn) {
                      itemClass = 'type-transfer-in'
                      amountColor = '#38bdf8'
                      amountPrefix = '+'
                    }

                    const balInfo = runningBalancesMap[tx.id]
                    const balanceAfter = balInfo?.balanceAfter ?? 0
                    const balanceBefore = balInfo?.balanceBefore ?? 0
                    const balanceColor = balanceAfter >= 0 ? '#c084fc' : 'var(--error)'

                    const txWithBalances = {
                      ...tx,
                      balanceAfter,
                      balanceBefore
                    }

                    return (
                      <div 
                        key={tx.id} 
                        className={`history-item ${itemClass}`}
                        style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}
                        onClick={() => onSelectTransaction && onSelectTransaction(txWithBalances)}
                      >
                        <div className="history-info" style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                          <span className="history-desc" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.notes}
                          </span>
                          <div className="history-info-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                            <span className="history-date" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDate(tx.date)}</span>
                            {isWithdraw && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                Withdrawal
                              </span>
                            )}
                            {isTransferOut && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span>➔</span> Gave to {tx.related_username || 'Partner'}
                              </span>
                            )}
                            {isTransferIn && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span>←</span> From {tx.related_username || 'Partner'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="history-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '0.25rem', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="history-amount" style={{ color: amountColor, fontWeight: 700 }}>
                              {amountPrefix} ₹{tx.amount.toLocaleString('en-IN')}
                            </span>
                            
                            {isSelf && (!isTransfer || isTransferOut) && (
                              <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.25rem' }}>
                                <button 
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.3rem', background: 'rgba(147, 51, 234, 0.1)', border: '1px solid var(--card-border-glow)', color: '#c084fc', width: 'auto', minWidth: 'auto' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditModal(tx)
                                  }}
                                  title="Edit"
                                >
                                  <Edit size={12} />
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '0.3rem', width: 'auto', minWidth: 'auto' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(tx.id)
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div 
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: balanceColor,
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                            title={`Balance after this entry: ₹${balanceAfter.toLocaleString('en-IN')}`}
                          >
                            <span style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>Bal:</span>
                            <span>₹{balanceAfter.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
                {selectedTx?.type === 'TRANSFER' ? (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#38bdf8',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span>➔</span>
                    <span>Partner Transfer to {selectedTx.related_username || 'Partner'}</span>
                  </div>
                ) : (
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
                )}
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
