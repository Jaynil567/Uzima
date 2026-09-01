import { useState, useEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import Home from './components/Home'
import History from './components/History'
import Dashboard from './components/Dashboard'
import CombineHistory from './components/CombineHistory'
import TransactionDetailModal from './components/TransactionDetailModal'
import { Loader2, PlusCircle, Calendar, LayoutDashboard, FileText, LogOut } from 'lucide-react'
import { getBackendUrl } from './utils/api'

export default function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('login') // 'login' | 'signup'
  const [checkingAuth, setCheckingAuth] = useState(true)

  // App routing navigation view: 'home' | 'history' | 'dashboard' | 'combine'
  const [activeScreen, setActiveScreen] = useState('home')
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null)
  
  // Transaction detail modal state
  const [selectedTxForModal, setSelectedTxForModal] = useState(null)

  // Validate session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')

    if (storedToken) {
      fetch(getBackendUrl('/api/user/'), {
        headers: {
          'Authorization': `Token ${storedToken}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            return res.json()
          } else {
            throw new Error('Session invalid')
          }
        })
        .then((data) => {
          setToken(storedToken)
          setUser(data.user)
          setSelectedHistoryUser({ id: data.user.id, username: data.user.username })
          localStorage.setItem('auth_user', JSON.stringify(data.user))
        })
        .catch(() => {
          handleLogoutSuccess()
        })
        .finally(() => {
          setCheckingAuth(false)
        })
    } else {
      setCheckingAuth(false)
    }
  }, [])

  // Sync FCM device token with Django backend
  useEffect(() => {
    if (!token) return

    const syncDeviceToken = async () => {
      if (window.AndroidInterface && typeof window.AndroidInterface.getFcmToken === 'function') {
        const fcmToken = window.AndroidInterface.getFcmToken()
        if (!fcmToken) {
          console.log("FCM token not yet loaded on device.")
          return
        }
        
        try {
          const response = await fetch(getBackendUrl('/api/register-device/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`,
            },
            body: JSON.stringify({ token: fcmToken }),
          })
          if (response.ok) {
            console.log("Device token registered successfully!")
          } else {
            console.error("Failed to register device token")
          }
        } catch (err) {
          console.error("Device token sync error:", err)
        }
      }
    }

    const timeout = setTimeout(syncDeviceToken, 1500)
    return () => clearTimeout(timeout)
  }, [token])

  // Handle Android notification click deep-link to open transaction details
  useEffect(() => {
    // 1. Register global JS function called by Android on notification tap
    window.handleNotificationClick = (txId) => {
      if (txId) {
        setSelectedTxForModal({ id: txId })
      }
    }

    // 2. Check for pending transaction on initial load
    if (window.AndroidInterface && typeof window.AndroidInterface.getPendingTxId === 'function') {
      const pendingId = window.AndroidInterface.getPendingTxId()
      if (pendingId) {
        setSelectedTxForModal({ id: pendingId })
      }
    }

    return () => {
      window.handleNotificationClick = null
    }
  }, [token])

  const handleLoginSuccess = (newToken, loggedInUser) => {
    setToken(newToken)
    setUser(loggedInUser)
    setSelectedHistoryUser({ id: loggedInUser.id, username: loggedInUser.username })
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(loggedInUser))
    setActiveScreen('home')
  }

  const handleLogoutSuccess = () => {
    setToken(null)
    setUser(null)
    setSelectedHistoryUser(null)
    setSelectedTxForModal(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setCurrentView('login')
  }

  const navigateToUserHistory = (userId, username) => {
    setSelectedHistoryUser({ id: userId, username: username })
    setActiveScreen('history')
  }

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--muted)' }}>
        <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Connecting to backend...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="shell">
      {token && user ? (
        <>
          {/* Top Brand Header */}
          <header className="shell-header">
            <div className="shell-header-left">
              <div className="brand-logo">
                <span className="brand-logo-text">UZIMA</span>
              </div>
              <span className="brand-subtitle">Hisab</span>
            </div>

            <div className="shell-header-right">
              <div className="user-badge">
                <span className="user-dot"></span>
                <span className="user-name">{user.username}</span>
              </div>
              <button 
                className="btn-logout" 
                onClick={handleLogoutSuccess}
                title="Log out session"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          {/* Main Screens View Area */}
          <main className="shell-body">
            {activeScreen === 'home' && (
              <Home 
                token={token} 
                onTransactionLogged={() => {}} 
              />
            )}

            {activeScreen === 'history' && selectedHistoryUser && (
              <History 
                key={selectedHistoryUser.id}
                userId={selectedHistoryUser.id} 
                username={selectedHistoryUser.username} 
                token={token} 
                currentUserId={user.id}
                onDataChanged={() => {}}
                onSelectTransaction={(tx) => setSelectedTxForModal(tx)}
              />
            )}

            {activeScreen === 'dashboard' && (
              <Dashboard 
                token={token} 
                onNavigateToHistory={navigateToUserHistory}
              />
            )}

            {activeScreen === 'combine' && (
              <CombineHistory 
                token={token} 
                onSelectTransaction={(tx) => setSelectedTxForModal(tx)}
              />
            )}
          </main>

          {/* Sticky Bottom Nav Bar */}
          <nav className="shell-footer bottom-nav">
            <button 
              className={`nav-item ${activeScreen === 'home' ? 'active' : ''}`} 
              onClick={() => setActiveScreen('home')}
            >
              <PlusCircle size={20} />
              <span>Quick entry</span>
            </button>

            <button 
              className={`nav-item ${activeScreen === 'history' && selectedHistoryUser?.id === user?.id ? 'active' : ''}`} 
              onClick={() => {
                setSelectedHistoryUser({ id: user.id, username: user.username })
                setActiveScreen('history')
              }}
            >
              <Calendar size={20} />
              <span>My history</span>
            </button>

            <button 
              className={`nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`} 
              onClick={() => setActiveScreen('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>

            <button 
              className={`nav-item ${activeScreen === 'combine' ? 'active' : ''}`} 
              onClick={() => setActiveScreen('combine')}
            >
              <FileText size={20} />
              <span>Combine</span>
            </button>
          </nav>

          {/* Dedicated Transaction Detail Modal View */}
          {selectedTxForModal && (
            <TransactionDetailModal 
              transaction={selectedTxForModal.date ? selectedTxForModal : null}
              txId={selectedTxForModal.id}
              token={token}
              onClose={() => setSelectedTxForModal(null)}
            />
          )}
        </>
      ) : (
        <div className="auth-container">
          {currentView === 'login' ? (
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              switchToSignup={() => setCurrentView('signup')} 
            />
          ) : (
            <Signup 
              onSignupSuccess={handleLoginSuccess} 
              switchToLogin={() => setCurrentView('login')} 
            />
          )}
        </div>
      )}
    </div>
  )
}
