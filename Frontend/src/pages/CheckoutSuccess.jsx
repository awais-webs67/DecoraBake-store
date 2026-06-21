import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { trackPurchase, trackGoogleAdsConversion } from '../components/Analytics'
import API_BASE_URL from '../config/api'

function CheckoutSuccess() {
    const [searchParams] = useSearchParams()
    const orderParam = searchParams.get('order')
    const sessionId = searchParams.get('session_id')
    const { clearCart } = useCart()
    const [orderId, setOrderId] = useState(orderParam)
    const [loading, setLoading] = useState(!!sessionId)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false)

    useEffect(() => {
        if (sessionId) {
            clearCart()
            fetch(`${API_BASE_URL}/api/stripe/session/${sessionId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.orderId) setOrderId(data.orderId)
                    if (data.status === 'paid') {
                        setPaymentConfirmed(true)
                        const orderData = {
                            orderId: data.orderId,
                            total: data.amountTotal || 0,
                            items: data.items || []
                        }
                        trackPurchase(orderData)

                        // Google Ads Conversion
                        const conversionId = import.meta.env.VITE_GADS_CONVERSION_ID
                        const conversionLabel = import.meta.env.VITE_GADS_CONVERSION_LABEL
                        if (conversionId && conversionLabel) {
                            trackGoogleAdsConversion(orderData, conversionId, conversionLabel)
                        }
                    }
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        } else if (orderParam) {
            clearCart()
            trackPurchase({ orderId: orderParam, total: 0, items: [] })
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div style={s.loadingWrap}>
                <div style={s.spinner} />
                <p style={s.loadingText}>Confirming your payment...</p>
            </div>
        )
    }

    return (
        <div style={s.page}>
            <div style={s.card}>
                {/* Checkmark */}
                <div style={s.checkCircle}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            style={{ animation: 'drawCheck 0.6s ease-out 0.3s both' }} />
                    </svg>
                </div>

                <h1 style={s.title}>Order Confirmed!</h1>
                <p style={s.subtitle}>Thank you for your purchase. Your order is being processed.</p>

                {/* Payment badge */}
                {paymentConfirmed && (
                    <div style={s.paymentBadge}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        Payment confirmed
                    </div>
                )}

                {/* Order number pill */}
                {orderId && (
                    <div style={s.orderBox}>
                        <span style={s.orderLabel}>Order Number</span>
                        <span style={s.orderNumber}>#{orderId}</span>
                    </div>
                )}

                {/* Steps */}
                <div style={s.stepsWrap}>
                    {[
                        { icon: '✉️', text: 'Confirmation email sent' },
                        { icon: '📦', text: 'Ships within 1-2 business days' },
                        { icon: '🔔', text: 'Track your order in your account' },
                    ].map((item, i) => (
                        <div key={i} style={s.stepRow}>
                            <span style={s.stepIcon}>{item.icon}</span>
                            <span style={s.stepText}>{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div style={s.btns}>
                    <Link to="/products" style={s.primaryBtn}>
                        Continue Shopping
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </Link>
                    <Link to="/account" style={s.outlineBtn}>View My Orders</Link>
                </div>

                <div style={s.helpText}>
                    Need help? <a href="mailto:support@decorabake.com.au" style={s.helpLink}>Contact Support</a>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
                @keyframes scaleIn { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }
                @keyframes drawCheck { from { stroke-dasharray: 30; stroke-dashoffset: 30 } to { stroke-dashoffset: 0 } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
                .cs-card:hover { box-shadow: 0 8px 32px rgba(107,35,70,0.1) !important; }
            `}</style>
        </div>
    )
}

const s = {
    page: {
        background: 'linear-gradient(180deg, #FDF6F8 0%, #F5F5F5 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px'
    },
    loadingWrap: {
        background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px'
    },
    spinner: {
        width: '40px', height: '40px', border: '3px solid #f0f0f0', borderTopColor: '#6B2346',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
    },
    loadingText: { fontSize: '14px', color: '#888', margin: 0 },
    card: {
        maxWidth: '420px', width: '100%', background: '#fff', borderRadius: '24px',
        padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
        animation: 'fadeIn 0.5s ease-out', boxSizing: 'border-box'
    },
    checkCircle: {
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #059669, #10B981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 8px 25px rgba(5,150,105,0.3)',
        animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    title: {
        fontFamily: "'Playfair Display', serif", fontSize: '26px',
        fontWeight: '800', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.2'
    },
    subtitle: {
        fontSize: '14px', color: '#666', margin: '0 0 20px', lineHeight: '1.5'
    },
    paymentBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: '#ECFDF5', color: '#059669', padding: '6px 14px', borderRadius: '100px',
        fontSize: '13px', fontWeight: '600', marginBottom: '24px'
    },
    orderBox: {
        background: '#FAFAFA', border: '2px dashed #e0e0e0',
        borderRadius: '16px', padding: '16px 20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    orderLabel: { fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
    orderNumber: { fontFamily: "'Poppins', sans-serif", fontSize: '17px', fontWeight: '700', color: '#1a1a1a' },
    stepsWrap: { marginBottom: '24px', textAlign: 'left' },
    stepRow: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 0', borderBottom: '1px solid #f5f5f5'
    },
    stepIcon: { fontSize: '16px', flexShrink: 0 },
    stepText: { fontSize: '13px', color: '#555', lineHeight: '1.4' },
    btns: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
    primaryBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '13px', background: 'linear-gradient(135deg, #6B2346, #8B3A5E)',
        color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textDecoration: 'none',
        boxShadow: '0 3px 12px rgba(107,35,70,0.2)', transition: 'all 0.3s'
    },
    outlineBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px', background: 'transparent', color: '#6B2346',
        borderRadius: '12px', fontSize: '13px', fontWeight: '600', textDecoration: 'none',
        border: '1.5px solid #6B2346', transition: 'all 0.3s'
    },
    helpText: { paddingTop: '16px', borderTop: '1px solid #f0f0f0', fontSize: '12px', color: '#999' },
    helpLink: { color: '#6B2346', fontWeight: '500', textDecoration: 'none' }
}

export default CheckoutSuccess
