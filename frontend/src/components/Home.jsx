import { useState, useEffect } from 'react'
import { PlusCircle, ArrowDownCircle, MinusCircle, ArrowRightLeft, Loader2, CheckCircle2, AlertCircle, X, User, FileText, Calendar } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

const getTodayDateString = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function Home({ token, currentUser, onTransactionLogged }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(getTodayDateString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Partner transfer state
  const [partners, setPartners] = useState([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(getBackendUrl('/api/partners/'), {
      headers: {
        'Authorization': `Token ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.partners) {
          setPartners(data.partners)
        }
      })
      .catch(err => console.error('Failed to load partners', err))
  }, [token])

  const addQuickAmount = (val) => {
    const curr = parseFloat(amount) || 0
    setAmount((curr + val).toString())
  }

  const handleTransaction = async (type) => {
    setError('')
    setSuccess('')
    
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (!notes.trim()) {
      setError('Notes are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(getBackendUrl('/api/transactions/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          type,
          amount: parsedAmount,
          notes: notes.trim(),
          date: date,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        let actionLabel = 'Collected'
        if (type === 'INVEST') actionLabel = 'Invested'
        else if (type === 'WITHDRAW') actionLabel = 'Withdrew'

        setSuccess(`${actionLabel} ₹${parsedAmount.toLocaleString('en-IN')} successfully!`)
        setAmount('')
        setNotes('')
        setDate(getTodayDateString())
        if (onTransactionLogged) onTransactionLogged()
      } else {
        setError(data.error || 'Failed to log transaction')
      }
    } catch (err) {
      console.error(err)
      setError('Server connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openTransferModal = () => {
    setError('')
    setSuccess('')
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount to transfer')
      return
    }
    if (!notes.trim()) {
      setError('Notes are required (e.g. cash handed over to partner)')
      return
    }
    setShowTransferModal(true)
  }

  const handleExecuteTransfer = async (receiverId, receiverName) => {
    setError('')
    setSuccess('')
    const parsedAmount = parseFloat(amount)
    setTransferring(true)
    try {
      const response = await fetch(getBackendUrl('/api/transactions/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          type: 'TRANSFER',
          amount: parsedAmount,
          notes: notes.trim(),
          date: date,
          receiver_id: receiverId,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setSuccess(`Transferred ₹${parsedAmount.toLocaleString('en-IN')} to ${receiverName} successfully! ➔`)
        setAmount('')
        setNotes('')
        setDate(getTodayDateString())
        setShowTransferModal(false)
        if (onTransactionLogged) onTransactionLogged()
      } else {
        setError(data.error || 'Failed to complete transfer')
      }
    } catch (err) {
      console.error(err)
      setError('Server connection error. Please try again.')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="glass-card animate-fade-in nav-padding">
      <div className="glass-card-header">
        <h1>Quick Entry</h1>
        <p>Log investments, collections, withdrawals, or partner transfers</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="error-banner" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        {/* HERO AMOUNT INPUT CARD */}
        <div className="hero-amount-card">
          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--foreground-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            Transaction Amount
          </div>
          <div className="hero-amount-display">
            <span className="hero-currency-symbol">₹</span>
            <input
              type="number"
              inputMode="decimal"
              id="amount"
              className="hero-amount-input"
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || transferring}
            />
          </div>

          <div className="quick-amount-pills">
            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(500)}>+ ₹500</button>
            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(1000)}>+ ₹1,000</button>
            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(5000)}>+ ₹5,000</button>
            <button type="button" className="quick-amount-pill" onClick={() => addQuickAmount(10000)}>+ ₹10,000</button>
          </div>
        </div>

        {/* NOTES INPUT */}
        <div className="form-group">
          <label htmlFor="notes">Notes / Item Details</label>
          <div className="input-wrapper">
            <FileText size={16} className="input-icon" />
            <input
              type="text"
              id="notes"
              className="form-control"
              placeholder="What was this transaction for?"
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading || transferring}
            />
          </div>
        </div>

        {/* DATE INPUT */}
        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <label htmlFor="date">Date</label>
          <div className="input-wrapper">
            <Calendar size={16} className="input-icon" />
            <input
              type="date"
              id="date"
              className="form-control"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading || transferring}
            />
          </div>
        </div>

        {/* 4 ACTION BUTTONS IN 2X2 RESPONSIVE FINTECH GRID */}
        <div className="action-buttons-grid">
          <button
            type="button"
            className="btn btn-invest"
            disabled={loading || transferring}
            onClick={() => handleTransaction('INVEST')}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <PlusCircle size={17} />
                Invest (-)
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-collect"
            disabled={loading || transferring}
            onClick={() => handleTransaction('COLLECT')}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <ArrowDownCircle size={17} />
                Collect (+)
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-withdraw"
            disabled={loading || transferring}
            onClick={() => handleTransaction('WITHDRAW')}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <MinusCircle size={17} />
                Withdraw (-)
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-transfer"
            disabled={loading || transferring}
            onClick={openTransferModal}
          >
            <ArrowRightLeft size={17} />
            Transfer ➔
          </button>
        </div>
      </form>

      {/* PARTNER TRANSFER SELECTOR MODAL */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => !transferring && setShowTransferModal(false)}>
          <div className="modal-content animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                  Transfer Cash
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.2rem' }}>
                  Gave ₹{parseFloat(amount || 0).toLocaleString('en-IN')} to which partner?
                </p>
              </div>
              <button
                type="button"
                onClick={() => !transferring && setShowTransferModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {partners
                .filter(p => !currentUser || p.id !== currentUser.id)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={transferring}
                    onClick={() => handleExecuteTransfer(p.id, p.username)}
                    style={{
                      background: 'rgba(14, 165, 233, 0.08)',
                      border: '1px solid rgba(14, 165, 233, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--foreground)',
                      cursor: transferring ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem'
                      }}>
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{p.username}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--foreground-dim)' }}>
                          Tap to transfer ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.25rem' }}>➔</span>
                  </button>
                ))}

              {partners.filter(p => !currentUser || p.id !== currentUser.id).length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
                  No other partners registered yet.
                </div>
              )}
            </div>

            {transferring && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Recording inter-partner transfer...</span>
              </div>
            )}
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
