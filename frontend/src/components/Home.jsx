import { useState, useEffect } from 'react'
import { PlusCircle, ArrowDownCircle, MinusCircle, ArrowRightLeft, Loader2, CheckCircle2, AlertCircle, X, User } from 'lucide-react'
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
    <div className="glass-card animate-fade-in">
      <div className="accent-glow-top"></div>
      
      <div className="glass-card-header">
        <h1>Quick Entry</h1>
        <p>Log investment, collection, withdrawal, or partner transfer</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="error-banner" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#86efac' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="amount">Amount (Rupees)</label>
          <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>₹</span>
            <input
              type="number"
              inputMode="decimal"
              id="amount"
              className="form-control"
              style={{ paddingLeft: '1.75rem' }}
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || transferring}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notes / Item Details</label>
          <input
            type="text"
            id="notes"
            className="form-control"
            style={{ paddingLeft: '0.75rem' }}
            placeholder="What was this for?"
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading || transferring}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            className="form-control"
            style={{ paddingLeft: '0.75rem' }}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading || transferring}
          />
        </div>

        {/* 4 Action Buttons in a clean 2x2 responsive grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-invest"
            disabled={loading || transferring}
            onClick={() => handleTransaction('INVEST')}
            style={{ padding: '0.85rem 0.5rem', fontSize: '0.88rem', margin: 0 }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <PlusCircle size={16} />
                Invest
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-collect"
            disabled={loading || transferring}
            onClick={() => handleTransaction('COLLECT')}
            style={{ padding: '0.85rem 0.5rem', fontSize: '0.88rem', margin: 0 }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <ArrowDownCircle size={16} />
                Collect
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-withdraw"
            disabled={loading || transferring}
            onClick={() => handleTransaction('WITHDRAW')}
            style={{ padding: '0.85rem 0.5rem', fontSize: '0.88rem', margin: 0 }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <MinusCircle size={16} />
                Withdraw
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-transfer"
            disabled={loading || transferring}
            onClick={openTransferModal}
            style={{ padding: '0.85rem 0.5rem', fontSize: '0.88rem', margin: 0 }}
          >
            <ArrowRightLeft size={16} />
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
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  Gave ₹{parseFloat(amount || 0).toLocaleString('en-IN')} to which partner?
                </p>
              </div>
              <button
                type="button"
                onClick={() => !transferring && setShowTransferModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
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
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
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
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}>
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.username}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                          Tap to transfer ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.25rem' }}>➔</span>
                  </button>
                ))}

              {partners.filter(p => !currentUser || p.id !== currentUser.id).length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  No other partners registered yet.
                </div>
              )}
            </div>

            {transferring && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', color: '#38bdf8', fontSize: '0.85rem' }}>
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
