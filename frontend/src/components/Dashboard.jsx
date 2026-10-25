import { useState, useEffect } from 'react'
import { Users, FileText, ArrowRight, Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, MinusCircle, ChevronRight } from 'lucide-react'
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
      ...trends.map(t => Math.max(t.invest || 0, t.collect || 0, t.withdraw || 0)),
      100 // default minimum height
    )

    const pointsCount = trends.length
    const getX = (index) => {
      if (pointsCount <= 1) return padL + chartW / 2
      return padL + (index / (pointsCount - 1)) * chartW
    }
    const getY = (val) => {
      return padT + chartH - ((val || 0) / maxVal) * chartH
    }

    // Generate path descriptions
    let investPath = ''
    let collectPath = ''
    let withdrawPath = ''

    trends.forEach((t, i) => {
      const x = getX(i)
      const yInvest = getY(t.invest)
      const yCollect = getY(t.collect)
      const yWithdraw = getY(t.withdraw)

      if (i === 0) {
        investPath = `M ${x} ${yInvest}`
        collectPath = `M ${x} ${yCollect}`
        withdrawPath = `M ${x} ${yWithdraw}`
      } else {
        investPath += ` L ${x} ${yInvest}`
        collectPath += ` L ${x} ${yCollect}`
        withdrawPath += ` L ${x} ${yWithdraw}`
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
              <path d={withdrawPath} className="chart-line-withdraw" />
            </>
          )}

          {/* Render points circle nodes */}
          {trends.map((t, i) => {
            const x = getX(i)
            return (
              <g key={i}>
                {t.invest > 0 && <circle cx={x} cy={getY(t.invest)} r="3" className="chart-point-invest" />}
                {t.collect > 0 && <circle cx={x} cy={getY(t.collect)} r="3" className="chart-point-collect" />}
                {t.withdraw > 0 && <circle cx={x} cy={getY(t.withdraw)} r="3" className="chart-point-withdraw" />}
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
          <div className="chart-legend-item">
            <span className="chart-dot withdraw"></span>
            <span>Withdraw (₹)</span>
          </div>
        </div>
      </div>
    )
  }

  const companyTotalInvest = data?.users ? data.users.reduce((acc, u) => acc + (u.total_invest || 0), 0) : 0
  const companyTotalCollect = data?.users ? data.users.reduce((acc, u) => acc + (u.total_collect || 0), 0) : 0
  const companyTotalWithdraw = data?.users ? data.users.reduce((acc, u) => acc + (u.total_withdraw || 0), 0) : 0
  const companyNetBalance = companyTotalCollect - companyTotalInvest - companyTotalWithdraw

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
          {/* Company Totals Cards (4 Grid Cards) */}
          <div className="metrics-grid">
            <div className="metric-card invest-card">
              <span className="label">
                <TrendingDown size={12} />
                Company Invest
              </span>
              <span className="value">
                ₹{companyTotalInvest.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="metric-card collect-card">
              <span className="label">
                <TrendingUp size={12} />
                Company Collect
              </span>
              <span className="value">
                ₹{companyTotalCollect.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="metric-card withdraw-card">
              <span className="label">
                <MinusCircle size={12} />
                Partners Withdraw
              </span>
              <span className="value">
                ₹{companyTotalWithdraw.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="metric-card balance-card">
              <span className="label">
                <Wallet size={12} />
                Company Balance
              </span>
              <span className="value" style={{ color: companyNetBalance >= 0 ? '#a5b4fc' : 'var(--error)' }}>
                ₹{companyNetBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* All Users Ledger */}
          <div className="partners-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 0.85rem 0' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', margin: 0 }}>
              <Users size={18} style={{ color: 'var(--primary)' }} /> Partners Balances
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--foreground-dim)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {data.users.length} Partners
            </span>
          </div>
          
          <div className="users-ledger">
            {data.users.map((u) => {
              const balanceVal = u.balance || 0
              const isPositive = balanceVal >= 0
              const formattedBalance = `${balanceVal < 0 ? '-' : ''}₹${Math.abs(balanceVal).toLocaleString('en-IN')}`

              return (
                <div 
                  key={u.user_id} 
                  className="partner-card"
                  onClick={() => onUserClick(u.user_id, u.username)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Top Row: Avatar + Name (Left) & Net Balance + Arrow (Right) */}
                  <div className="partner-card-header">
                    <div className="partner-identity">
                      <div className="user-avatar-badge">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="partner-meta">
                        <div className="partner-name">{u.username}</div>
                        <div className="partner-sub">Tap to view ledger</div>
                      </div>
                    </div>

                    <div className="partner-balance-box">
                      <span className="partner-balance-label">Net Balance</span>
                      <span className={`partner-balance-val ${isPositive ? 'positive' : 'negative'}`}>
                        {formattedBalance}
                      </span>
                    </div>

                    <ChevronRight size={18} className="partner-arrow" />
                  </div>

                  {/* Bottom Row: 3 Equal Breakdown Metrics (Invested | Collected | Withdrawn) */}
                  <div className="partner-card-metrics">
                    <div className="partner-metric-item">
                      <span className="metric-tag">Invested</span>
                      <span className="metric-amt invest">₹{(u.total_invest || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="partner-metric-item">
                      <span className="metric-tag">Collected</span>
                      <span className="metric-amt collect">₹{(u.total_collect || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="partner-metric-item">
                      <span className="metric-tag">Withdrawn</span>
                      <span className="metric-amt withdraw">₹{(u.total_withdraw || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
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
