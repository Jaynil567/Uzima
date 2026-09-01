import React, { useState, useEffect } from 'react'
import { X, Calendar, User, FileText, ArrowDownRight, ArrowUpRight, Hash, Clock, Loader2 } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function TransactionDetailModal({ transaction, txId, token, onClose }) {
  const [txData, setTxData] = useState(transaction || null)
  const [loading, setLoading] = useState(!transaction && !!txId)
  const [error, setError] = useState('')

  useEffect(() => {
    if (transaction) {
      setTxData(transaction)
      setLoading(false)
      return
    }

    if (txId && token) {
      setLoading(true)
      fetch(getBackendUrl(`/api/transactions/${txId}/`), {
        headers: {
          'Authorization': `Token ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Could not load transaction details')
          return res.json()
        })
        .then(data => {
          setTxData(data.transaction)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setError('Transaction not found or could not be loaded.')
          setLoading(false)
        })
    }
  }, [transaction, txId, token])

  if (!transaction && !txId) return null

  const isInvest = txData?.type === 'INVEST'

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return null
    }
  }

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content animate-scale-up"
        style={{
          backgroundColor: '#121217',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '400px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--card-border)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isInvest ? 'var(--error)' : 'var(--success)'
            }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Transaction Details
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem' }}>Loading transaction...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--error)', fontSize: '0.95rem' }}>
              {error}
            </div>
          ) : txData ? (
            <>
              {/* Amount Hero Banner */}
              <div style={{
                textAlign: 'center',
                padding: '1.25rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isInvest ? 'var(--error-bg)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${isInvest ? 'var(--error-border)' : 'rgba(16, 185, 129, 0.2)'}`
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                  background: isInvest ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isInvest ? 'var(--error)' : 'var(--success)'
                }}>
                  {isInvest ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  {isInvest ? 'INVESTMENT (-)' : 'CASH COLLECTION (+)'}
                </div>

                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: isInvest ? 'var(--error)' : 'var(--success)',
                  lineHeight: 1.1
                }}>
                  ₹ {parseFloat(txData.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {/* Partner */}
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--card-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <User size={13} />
                    <span>Logged By</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                    {txData.username || 'Partner'}
                  </div>
                </div>

                {/* Date */}
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--card-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <Calendar size={13} />
                    <span>Entry Date</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                    {formatDate(txData.date)}
                  </div>
                </div>
              </div>

              {/* Notes / Narration */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--card-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.75rem' }}>
                  <FileText size={13} />
                  <span>Notes / Narration</span>
                </div>
                <div style={{
                  fontSize: '0.95rem',
                  color: 'var(--foreground)',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontWeight: 500
                }}>
                  {txData.notes || 'No description provided.'}
                </div>
              </div>

              {/* Metadata / ID */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--muted)',
                padding: '0 0.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Hash size={12} />
                  <span>ID: #{txData.id}</span>
                </div>
                {txData.updated_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} />
                    <span>Time: {formatTimestamp(txData.updated_at)}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              width: '100%',
              margin: 0
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
