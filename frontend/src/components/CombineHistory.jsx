import { useState, useEffect, useMemo } from 'react'
import { Calendar, Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function CombineHistory({ token, onSelectTransaction }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST') // 'NEWEST' | 'OLDEST'

  const getMonthYear = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

  const fetchAllTransactions = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(getBackendUrl('/api/transactions/'), {
        headers: {
          'Authorization': `Token ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setTransactions(data.transactions || [])
      } else {
        setError(data.error || 'Failed to fetch combine history')
      }
    } catch (err) {
      console.error(err)
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllTransactions()
  }, [])

  // Derive unique users for the filter dropdown
  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.username))).sort()
  }, [transactions])

  // Derive unique months list chronologically (newest first)
  const uniqueMonths = useMemo(() => {
    const months = []
    transactions.forEach(t => {
      const m = getMonthYear(t.date)
      if (!months.includes(m)) months.push(m)
    })
    return months
  }, [transactions])

  // Compute running balance per user chronologically (oldest first)
  const runningBalancesMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (diff !== 0) return diff
      return a.id - b.id
    })

    const userBalances = {}
    const map = {}
    sorted.forEach((tx) => {
      const uKey = tx.user_id || tx.username
      if (userBalances[uKey] === undefined) userBalances[uKey] = 0
      const prevBal = userBalances[uKey]

      if (tx.type === 'COLLECT') {
        userBalances[uKey] += tx.amount
      } else if (tx.type === 'INVEST' || tx.type === 'WITHDRAW') {
        userBalances[uKey] -= tx.amount
      } else if (tx.type === 'TRANSFER') {
        if (tx.transfer_direction === 'IN') {
          userBalances[uKey] += tx.amount
        } else {
          userBalances[uKey] -= tx.amount
        }
      }

      map[tx.id] = {
        balanceBefore: prevBal,
        balanceAfter: userBalances[uKey]
      }
    })
    return map
  }, [transactions])

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    let list = [...transactions]

    // 1. Text Search on Notes
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      list = list.filter(t => t.notes.toLowerCase().includes(term))
    }

    // 2. User Filter
    if (selectedUser !== '') {
      list = list.filter(t => t.username === selectedUser)
    }

    // 3. Type Filter
    if (selectedType !== 'ALL') {
      list = list.filter(t => t.type === selectedType)
    }

    // 4. Month Filter
    if (selectedMonth !== 'ALL') {
      list = list.filter(t => getMonthYear(t.date) === selectedMonth)
    }

    // 5. Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB
    })

    return list
  }, [transactions, searchTerm, selectedUser, selectedType, selectedMonth, sortBy])

  // Group filtered transactions by month
  const groupedTransactions = useMemo(() => {
    const grouped = {}
    filteredTransactions.forEach((tx) => {
      const m = getMonthYear(tx.date)
      if (!grouped[m]) grouped[m] = []
      grouped[m].push(tx)
    })
    return grouped
  }, [filteredTransactions])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    }) + ' • ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate monthly subtotal for a group header
  const getMonthSubtotal = (txList) => {
    const c = txList.filter(t => t.type === 'COLLECT').reduce((acc, t) => acc + t.amount, 0)
    const i = txList.filter(t => t.type === 'INVEST').reduce((acc, t) => acc + t.amount, 0)
    const w = txList.filter(t => t.type === 'WITHDRAW').reduce((acc, t) => acc + t.amount, 0)
    return c - i - w
  }

  return (
    <div className="glass-card animate-fade-in nav-padding">
      <div className="accent-glow-top"></div>

      <div className="glass-card-header">
        <h1>Combine Ledger</h1>
        <p>Unified month-by-month transactions log of all company partners</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        
        {/* Search Input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="input-wrapper">
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search description/notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dropdowns Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
          
          {/* Month Filter */}
          <select
            className="form-control"
            style={{ paddingLeft: '0.50rem', fontSize: '0.85rem', height: '38px', color: selectedMonth !== 'ALL' ? '#c084fc' : 'inherit' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">All Months</option>
            {uniqueMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* User Filter */}
          <select
            className="form-control"
            style={{ paddingLeft: '0.50rem', fontSize: '0.85rem', height: '38px' }}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">All Owners</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            className="form-control"
            style={{ paddingLeft: '0.50rem', fontSize: '0.85rem', height: '38px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="INVEST">Invest</option>
            <option value="COLLECT">Collect</option>
            <option value="WITHDRAW">Withdraw</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          {/* Sort Order */}
          <select
            className="form-control"
            style={{ paddingLeft: '0.50rem', fontSize: '0.85rem', height: '38px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading combined entries...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="history-empty" style={{ padding: '4rem 1rem' }}>
          No matching transactions found.
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
                    const itemClass = isInvest ? 'type-expense' : isWithdraw ? 'type-withdraw' : isTransfer ? 'type-transfer' : 'type-income'
                    const amountColor = isInvest ? 'var(--error)' : isWithdraw ? '#f59e0b' : isTransfer ? '#38bdf8' : 'var(--success)'
                    const amountPrefix = (isInvest || isWithdraw) ? '-' : isTransfer ? '' : '+'

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
                          <span className="history-desc" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes}</span>
                          <div className="history-info-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                            {isTransfer ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.85rem' }}>
                                <span style={{ color: '#38bdf8' }}>{tx.username}</span>
                                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>➔</span>
                                <span style={{ color: '#38bdf8' }}>{tx.related_username || 'Partner'}</span>
                              </span>
                            ) : (
                              <span className="history-user" style={{ color: '#c084fc', fontWeight: 600 }}>{tx.username}</span>
                            )}
                            <span className="history-date" style={{ color: 'rgba(255,255,255,0.45)' }}>• {formatDate(tx.date)}</span>
                            {isWithdraw && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                Withdrawal
                              </span>
                            )}
                            {isTransfer && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                Transfer
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="history-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '0.25rem', flexShrink: 0 }}>
                          <span className="history-amount" style={{ color: amountColor, fontWeight: 700 }}>
                            {amountPrefix}{amountPrefix ? ' ' : ''}₹{tx.amount.toLocaleString('en-IN')}
                          </span>
                          <div 
                            className="balance-chip"
                            title={`${tx.username}'s balance after this entry: ₹${balanceAfter.toLocaleString('en-IN')}`}
                          >
                            <span style={{ color: 'var(--foreground-dim)', fontSize: '0.65rem' }}>Bal:</span>
                            <span style={{ color: balanceColor }}>₹{balanceAfter.toLocaleString('en-IN')}</span>
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

      <button 
        onClick={fetchAllTransactions} 
        className="btn" 
        style={{ 
          background: 'transparent', 
          border: '1px solid var(--input-border)', 
          color: 'var(--muted)', 
          boxShadow: 'none',
          marginTop: '1.5rem'
        }}
        disabled={loading}
      >
        <RefreshCw size={14} /> Refresh Feed
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
