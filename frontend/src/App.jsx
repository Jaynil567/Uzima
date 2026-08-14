import { useState, useEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import Home from './components/Home'
import History from './components/History'
import Dashboard from './components/Dashboard'
import CombineHistory from './components/CombineHistory'
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
    <div className="app-shell animate-fade-in">
      {token ? (
        <>
          {/* Top Bar Header */}
          <header className="shell-header">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc', margin: 0 }}>Uzima Hisab</h2>
            <button 
              onClick={handleLogoutSuccess} 
              className="btn btn-sm" 
              style={{ 
                width: 'auto', 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--card-border)', 
                color: 'var(--muted)', 
                fontSize: '0.7rem', 
                padding: '0.4rem 0.8rem',
                margin: 0
              }}
            >
              <LogOut size={12} style={{ marginRight: '0.25rem' }} /> Log Out
            </button>
          </header>

          {/* Independent scroll content block */}
          <main className="scrollable-content">
            {activeScreen === 'home' && (
              <Home 
                token={token} 
                onTransactionLogged={() => {}} 
              />
            )}
            
            {activeScreen === 'history' && selectedHistoryUser && (
              <History 
                userId={selectedHistoryUser.id}
                username={selectedHistoryUser.username}
                token={token}
                currentUserId={user?.id}
                onDataChanged={() => {}}
              />
            )}

            {activeScreen === 'dashboard' && (
              <Dashboard 
                token={token} 
                onUserClick={navigateToUserHistory}
                onCombineHistoryClick={() => setActiveScreen('combine')}
              />
            )}

            {activeScreen === 'combine' && (
              <CombineHistory 
                token={token} 
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
