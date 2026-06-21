import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'

function PromoBanner() {
    const [promo, setPromo] = useState(null)
    const [visible, setVisible] = useState(false)
    const [closing, setClosing] = useState(false)
    const [timeLeft, setTimeLeft] = useState(null)

    useEffect(() => {
        // Don't show if already dismissed this session
        if (sessionStorage.getItem('promoBannerDismissed')) return

        fetch(`${API_BASE_URL}/api/sections/promo`)
            .then(r => r.json())
            .then(data => {
                if (data && data.enablePopup && data.title) {
                    setPromo(data)
                    const delay = (data.popupDelay || 5) * 1000
                    const timer = setTimeout(() => setVisible(true), delay)
                    // Set countdown if timer end date exists
                    if (data.timerEnd) {
                        setTimeLeft(getTimeLeft(data.timerEnd))
                    }
                    return () => clearTimeout(timer)
                }
            })
            .catch(() => { })
    }, [])

    // Countdown timer
    useEffect(() => {
        if (!promo?.timerEnd) return
        const interval = setInterval(() => {
            const remaining = getTimeLeft(promo.timerEnd)
            if (remaining.total <= 0) {
                clearInterval(interval)
                setTimeLeft(null)
            } else {
                setTimeLeft(remaining)
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [promo?.timerEnd])

    function getTimeLeft(endDate) {
        const total = new Date(endDate).getTime() - Date.now()
        if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
        return {
            total,
            days: Math.floor(total / (1000 * 60 * 60 * 24)),
            hours: Math.floor((total / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((total / (1000 * 60)) % 60),
            seconds: Math.floor((total / 1000) % 60)
        }
    }

    const handleClose = () => {
        setClosing(true)
        setTimeout(() => {
            setVisible(false)
            setClosing(false)
            sessionStorage.setItem('promoBannerDismissed', 'true')
        }, 300)
    }

    if (!visible || !promo) return null

    const data = promo

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            opacity: closing ? 0 : 1, transition: 'opacity 0.3s ease'
        }} onClick={handleClose}>
            <div style={{
                background: '#fff', borderRadius: '24px', maxWidth: '480px', width: '100%',
                overflow: 'hidden', position: 'relative',
                transform: closing ? 'scale(0.9)' : 'scale(1)',
                transition: 'transform 0.3s ease',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }} onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button onClick={handleClose} style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 3,
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>✕</button>

                {/* Header Gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #6B2346 0%, #A85070 50%, #C96B8C 100%)',
                    padding: '40px 32px 32px', textAlign: 'center', position: 'relative'
                }}>
                    {/* Decorative elements */}
                    <div style={{ position: 'absolute', top: '10px', left: '15px', fontSize: '40px', opacity: 0.15 }}>✨</div>
                    <div style={{ position: 'absolute', bottom: '10px', right: '20px', fontSize: '30px', opacity: 0.12 }}>🎂</div>

                    {data.label && (
                        <span style={{
                            display: 'inline-block', background: '#C9A865', color: '#4A1830',
                            padding: '6px 18px', borderRadius: '50px', fontSize: '11px',
                            fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px',
                            marginBottom: '16px'
                        }}>{data.label}</span>
                    )}
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 5vw, 30px)',
                        fontWeight: '700', color: '#fff', margin: '0 0 12px', lineHeight: '1.3'
                    }}>{data.title}</h2>
                    {data.description && (
                        <p style={{
                            fontSize: '14px', color: 'rgba(255,255,255,0.85)',
                            lineHeight: '1.6', margin: 0, maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto'
                        }}>{data.description}</p>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: '28px 32px 32px', textAlign: 'center' }}>
                    {/* Countdown Timer */}
                    {timeLeft && timeLeft.total > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: '600' }}>
                                Offer expires in
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                {[
                                    { val: timeLeft.days, label: 'Days' },
                                    { val: timeLeft.hours, label: 'Hrs' },
                                    { val: timeLeft.minutes, label: 'Min' },
                                    { val: timeLeft.seconds, label: 'Sec' }
                                ].map((t, i) => (
                                    <div key={i} style={{
                                        background: '#f8f4f6', borderRadius: '12px', padding: '10px 14px',
                                        minWidth: '56px', border: '1px solid #f0e8ec'
                                    }}>
                                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#6B2346', fontVariantNumeric: 'tabular-nums' }}>
                                            {String(t.val).padStart(2, '0')}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                                            {t.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <Link to={data.buttonLink || '/products'} onClick={handleClose} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '14px 36px', fontSize: '15px', fontWeight: '700',
                        borderRadius: '50px', background: 'linear-gradient(135deg, #6B2346, #A85070)',
                        color: '#fff', textDecoration: 'none', border: 'none',
                        boxShadow: '0 4px 16px rgba(107,35,70,0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(107,35,70,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,35,70,0.3)' }}
                    >
                        {data.buttonText || 'Shop Now'}
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                    </Link>

                    <p style={{ fontSize: '12px', color: '#bbb', marginTop: '16px', cursor: 'pointer' }} onClick={handleClose}>
                        No thanks, I'll pass
                    </p>
                </div>

                {/* Animation keyframes */}
                <style>{`
                    @keyframes promoBannerIn {
                        from { opacity: 0; transform: scale(0.85) translateY(20px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    )
}

export default PromoBanner
