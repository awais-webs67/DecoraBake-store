import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin')
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(credentials.username, credentials.password)
            if (result.success) {
                navigate('/admin')
            } else {
                setError(result.error || 'Invalid username or password')
            }
        } catch (err) {
            setError('Login failed. Please try again.')
        }
        setLoading(false)
    }

    const styles = {
        page: { minHeight: '100vh', background: 'linear-gradient(135deg, #6B2346 0%, #4A1830 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
        card: { background: '#fff', borderRadius: '20px', padding: '36px 32px', width: '100%', maxWidth: '380px', boxSizing: 'border-box', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' },
        logo: { textAlign: 'center', marginBottom: '24px' },
        logoImg: { height: '50px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: '6px' },
        subtitle: { fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '28px' },
        error: { background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', border: '1px solid #FECDD3', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', textAlign: 'center' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' },
        input: { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', transition: 'all 0.2s', outline: 'none' },
        submitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6B2346, #8B3A5E)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(107,35,70,0.2)' },
        hint: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'center' },
        hintText: { fontSize: '12px', color: '#94a3b8' }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <img src="/logo.png" alt="DecoraBake" style={styles.logoImg} />
                </div>

                <h1 style={styles.title}>Admin Login</h1>
                <p style={styles.subtitle}>Sign in to manage your store</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={credentials.username}
                            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                            placeholder="Enter username"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={credentials.password}
                            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                            placeholder="Enter password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={styles.hint}>
                    <p style={styles.hintText}>
                        Default credentials can be changed in Settings after login
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
