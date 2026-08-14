import { useState } from 'react'
import { PlusCircle, ArrowDownCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function Home({ token, onTransactionLogged }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`${type === 'INVEST' ? 'Invested' : 'Collected'} ₹${parsedAmount.toLocaleString('en-IN')} successfully!`)
        setAmount('')
        setNotes('')
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

  return (
    <div className="glass-card animate-fade-in">
      <div className="accent-glow-top"></div>
      
      <div className="glass-card-header">
        <h1>Quick Entry</h1>
        <p>Log a new investment or cash collection</p>
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
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
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
            disabled={loading}
          />
        </div>

        <div className="flex-row">
          <button
            type="button"
            className="btn btn-invest"
            disabled={loading}
            onClick={() => handleTransaction('INVEST')}
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
            disabled={loading}
            onClick={() => handleTransaction('COLLECT')}
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
        </div>
      </form>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
