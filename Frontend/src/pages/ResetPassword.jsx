import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import API_BASE_URL from '../config/api'
import { useSEO } from '../hooks/useSEO'

function ResetPassword() {
    useSEO({ title: 'Reset Password', description: 'Set a new password for your DecoraBake account.', url: '/reset-password' })
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!token) setError('Invalid or missing reset token. Please request a new link.')
    }, [token])

    const handleSubmit = async e => {
        e.preventDefault()
        if (password !== confirm) { setError('Passwords do not match.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true); setError('')
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setSuccess(true)
                setTimeout(() => navigate('/account'), 3000)
            } else {
                setError(data.error || 'Reset failed. The link may have expired.')
            }
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
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>Set New Password</h1>
                    <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>Choose a strong password for your account.</p>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>Password Reset!</h2>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>Your password has been updated. Redirecting you to sign in...</p>
                        <Link to="/account" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #6B2346, #8B3A5E)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
                            Sign In Now
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', border: '1px solid #FECDD3' }}>
                                {error}
                                {!token && <><br /><Link to="/forgot-password" style={{ color: '#DC2626', fontWeight: '600' }}>Request a new reset link →</Link></>}
                            </div>
                        )}
                        {token && (
                            <>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>New Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                                        style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                                        placeholder="Min. 6 characters" />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Confirm Password</label>
                                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                                        style={{ width: '100%', padding: '14px 16px', border: `1.5px solid ${confirm && confirm !== password ? '#DC2626' : '#e0e0e0'}`, borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                                        placeholder="Repeat your password" />
                                    {confirm && confirm !== password && <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</p>}
                                </div>
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '14px', background: loading ? '#999' : 'linear-gradient(135deg, #6B2346, #8B3A5E)',
                                    color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                                    cursor: loading ? 'wait' : 'pointer'
                                }}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    )
}

export default ResetPassword
