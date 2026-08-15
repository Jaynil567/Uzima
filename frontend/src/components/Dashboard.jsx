import { useState, useEffect } from 'react'
import { Users, FileText, ArrowRight, Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { getBackendUrl } from '../utils/api'

export default function Dashboard({ token, onUserClick, onCombineHistoryClick }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')



  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(getBackendUrl('/api/dashboard/'), {
        headers: {
          'Authorization': `Token ${token}`,
        },
      })
      const resData = await response.json()
      if (response.ok) {
        setData(resData)
      } else {
        setError(resData.error || 'Failed to fetch dashboard summary')
      }
    } catch (err) {
      console.error(err)
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Dynamic SVG Chart Renderer
  const renderSVGChart = (trends) => {
    if (!trends || trends.length === 0) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Not enough historical logs to render chart yet.
        </div>
      )
    }

    // SVG Layout Config
    const w = 500
    const h = 200
    const padL = 40
    const padR = 15
    const padT = 15
    const padB = 25

    const chartW = w - padL - padR
    const chartH = h - padT - padB

    // Get max value to scale Y axis
    const maxVal = Math.max(
      ...trends.map(t => Math.max(t.invest, t.collect)),
      100 // default minimum height
    )

    const pointsCount = trends.length
    const getX = (index) => {
      if (pointsCount <= 1) return padL + chartW / 2
      return padL + (index / (pointsCount - 1)) * chartW
    }
    const getY = (val) => {
      return padT + chartH - (val / maxVal) * chartH
    }

    // Generate path descriptions
    let investPath = ''
    let collectPath = ''

    trends.forEach((t, i) => {
      const x = getX(i)
      const yInvest = getY(t.invest)
      const yCollect = getY(t.collect)

      if (i === 0) {
        investPath = `M ${x} ${yInvest}`
        collectPath = `M ${x} ${yCollect}`
      } else {
        investPath += ` L ${x} ${yInvest}`
        collectPath += ` L ${x} ${yCollect}`
      }
    })

    // Formatting date helper for labels (first, middle, last)
    const getLabelDate = (dateStr) => {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    }

    return (
      <div className="glass-card chart-card animate-fade-in" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Daily Transactions Trend (Last 30 Days)
        </h3>

        <svg viewBox={`0 0 ${w} ${h}`} className="svg-chart-container">
          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padT + ratio * chartH
            const labelValue = Math.round(maxVal * (1 - ratio))
            return (
              <g key={index}>
                <line x1={padL} y1={y} x2={w - padR} y2={y} className="chart-grid-line" />
                <text x={padL - 8} y={y + 3} textAnchor="end" className="chart-text">
                  {labelValue >= 1000 ? `${(labelValue / 1000).toFixed(1)}k` : labelValue}
                </text>
              </g>
            )
          })}

          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} className="chart-axis-line" />
          <line x1={padL} y1={padT + chartH} x2={w - padR} y2={padT + chartH} className="chart-axis-line" />

          {/* Lines paths */}
          {pointsCount > 0 && (
            <>
              <path d={investPath} className="chart-line-invest" />
              <path d={collectPath} className="chart-line-collect" />
            </>
          )}

          {/* Render points circle nodes */}
          {trends.map((t, i) => {
            const x = getX(i)
            return (
              <g key={i}>
                {t.invest > 0 && <circle cx={x} cy={getY(t.invest)} r="3" className="chart-point-invest" />}
                {t.collect > 0 && <circle cx={x} cy={getY(t.collect)} r="3" className="chart-point-collect" />}
              </g>
            )
          })}

          {/* X axis labels (Dates) */}
          {pointsCount > 0 && (
            <>
              <text x={getX(0)} y={padT + chartH + 15} textAnchor="start" className="chart-text">
                {getLabelDate(trends[0].date)}
              </text>
              {pointsCount > 2 && (
                <text x={getX(Math.floor(pointsCount / 2))} y={padT + chartH + 15} textAnchor="middle" className="chart-text">
                  {getLabelDate(trends[Math.floor(pointsCount / 2)].date)}
                </text>
              )}
              {pointsCount > 1 && (
                <text x={getX(pointsCount - 1)} y={padT + chartH + 15} textAnchor="end" className="chart-text">
                  {getLabelDate(trends[pointsCount - 1].date)}
                </text>
              )}
            </>
          )}
        </svg>

        {/* Chart Legend */}
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-dot invest"></span>
            <span>Invest (₹)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-dot collect"></span>
            <span>Collect (₹)</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card animate-fade-in nav-padding">
      <div className="accent-glow-top"></div>

      <div className="glass-card-header">
        <h1>Company Dashboard</h1>
        <p>Comprehensive aggregated balances of all partners</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Fetching stats...</span>
        </div>
      ) : !data ? (
        <div className="history-empty" style={{ padding: '3rem 1rem' }}>
          No data available.
        </div>
      ) : (
        <div>
          {/* Company Totals Cards */}
          <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="metric-card invest-card">
              <span className="label">Company Invest</span>
              <span className="value">
                ₹{data.users.reduce((acc, u) => acc + u.total_invest, 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="metric-card collect-card">
              <span className="label">Company Collect</span>
              <span className="value">
                ₹{data.users.reduce((acc, u) => acc + u.total_collect, 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="metric-card balance-card">
              <span className="label">Company Balance</span>
              <span className="value">
                ₹{(data.users.reduce((acc, u) => acc + u.total_collect, 0) - data.users.reduce((acc, u) => acc + u.total_invest, 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* All Users Ledger */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: '#c084fc' }} /> Partners Balances
          </h2>
          
          <div className="users-ledger">
            {data.users.map((u) => (
              <div key={u.user_id} className="user-ledger-row">
                <span 
                  className="user-name" 
                  onClick={() => onUserClick(u.user_id, u.username)}
                >
                  {u.username}
                </span>

                <div className="user-totals">
                  <div>
                    <span className="label">Invested</span>
                    <span className="val" style={{ color: 'var(--error)' }}>₹{u.total_invest.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="label">Collected</span>
                    <span className="val" style={{ color: 'var(--success)' }}>₹{u.total_collect.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '0.75rem' }}>
                    <span className="label">Net Balance</span>
                    <span className="val" style={{ color: u.balance >= 0 ? '#c084fc' : 'var(--error)' }}>₹{u.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', marginBottom: '2.5rem' }}>
            <button 
              onClick={onCombineHistoryClick} 
              className="btn btn-primary"
              style={{ 
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
                display: 'inline-flex',
                gap: '0.5rem',
                alignItems: 'center',
                flex: 1
              }}
            >
              <FileText size={16} /> Combine History Ledger <ArrowRight size={16} />
            </button>
          </div>

          {/* Render Custom SVG line chart at the bottom */}
          {renderSVGChart(data.trends)}
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
