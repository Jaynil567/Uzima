import { useState, useEffect } from 'react'
import { Calendar, Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function CombineHistory({ token }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST') // 'NEWEST' | 'OLDEST'



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
        setTransactions(data.transactions)
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
  const uniqueUsers = Array.from(new Set(transactions.map(t => t.username))).sort()

  // Apply filters and sorting
  const getFilteredTransactions = () => {
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

    // 4. Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB
    })

    return list
  }

  const filteredTransactions = getFilteredTransactions()

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    }) + ' • ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="glass-card animate-fade-in nav-padding">
      <div className="accent-glow-top"></div>

      <div className="glass-card-header">
        <h1>Combine Ledger</h1>
        <p>Unified chronological transactions log of all company users</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTransactions.map((tx) => {
            const isInvest = tx.type === 'INVEST'
            return (
              <div 
                key={tx.id} 
                className={`history-item ${isInvest ? 'type-expense' : 'type-income'}`}
                style={{ padding: '0.85rem 1rem' }}
              >
                <div className="history-info">
                  <span className="history-desc">{tx.notes}</span>
                  <div className="history-info-meta">
                    <span className="history-user" style={{ color: '#c084fc', fontWeight: 600 }}>{tx.username}</span>
                    <span className="history-date" style={{ color: 'rgba(255,255,255,0.45)' }}>• {formatDate(tx.date)}</span>
                  </div>
                </div>

                <div className="history-right" style={{ gap: '0.5rem' }}>
                  <span className="history-amount" style={{ color: isInvest ? 'var(--error)' : 'var(--success)' }}>
                    {isInvest ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                  </span>
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
