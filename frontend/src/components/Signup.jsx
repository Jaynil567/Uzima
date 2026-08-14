import { useState } from 'react'
import { User, Lock, Mail, Loader2, AlertCircle } from 'lucide-react'

export default function Signup({ onSignupSuccess, switchToLogin }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSignupSuccess(data.token, data.user)
      } else {
        setError(data.error || 'Failed to sign up')
      }
    } catch (err) {
      console.error(err)
      setError('Server unreachable. Make sure Django backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card auth-card animate-fade-in">
      <div className="glass-card-header">
        <h1>Create Account</h1>
        <p>Sign up to get access to the home page</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <div className="input-wrapper">
            <User size={16} className="input-icon" />
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email (Optional)</label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon" />
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              Registering...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account? <span onClick={switchToLogin}>Log In</span>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
