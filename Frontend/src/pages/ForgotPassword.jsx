import { useState } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'
import { useSEO } from '../hooks/useSEO'

function ForgotPassword() {
    useSEO({ title: 'Forgot Password', description: 'Reset your DecoraBake account password.', url: '/forgot-password' })
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await res.json()
            if (res.ok) setSent(true)
            else setError(data.error || 'Something went wrong. Please try again.')
        } catch {
            setError('Unable to connect. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 36px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FDF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>Forgot Password?</h1>
                    <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>Enter your email and we'll send you a reset link.</p>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Check Your Email</h2>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                            If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox (and spam folder).
                        </p>
                        <Link to="/account" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #6B2346, #8B3A5E)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', border: '1px solid #FECDD3' }}>
                                {error}
                            </div>
                        )}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                                placeholder="your@email.com" />
                        </div>
                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '14px', background: loading ? '#999' : 'linear-gradient(135deg, #6B2346, #8B3A5E)',
                            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                            cursor: loading ? 'wait' : 'pointer'
                        }}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <Link to="/account" style={{ fontSize: '13px', color: '#6B2346', textDecoration: 'none', fontWeight: '500' }}>← Back to Sign In</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default ForgotPassword
