import API_BASE_URL from '../config/api'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function Checkout() {
    const { items, getCartTotal, clearCart } = useCart()
    const { user, isLoggedIn, token } = useUser()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState({
        freeShippingEnabled: true, freeShippingThreshold: 149, shippingCost: 9.95,
        paymentStripeEnabled: true, paymentBankTransferEnabled: false,
        bankName: '', bankAccountName: '', bankBSB: '', bankAccountNumber: '', bankInstructions: ''
    })
    const [promoCode, setPromoCode] = useState('')
    const [appliedPromo, setAppliedPromo] = useState(null)
    const [promoError, setPromoError] = useState('')
    const [promoLoading, setPromoLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('stripe')
    const [receiptFile, setReceiptFile] = useState(null)
    const [receiptPreview, setReceiptPreview] = useState(null)
    const [uploadStatus, setUploadStatus] = useState('')
    const receiptRef = useRef()
    const width = useWindowSize()
    const isMobile = width < 768

    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', address: '', city: '',
        state: '', postcode: '', phone: ''
    })

    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || ''
            }))
        }
    }, [isLoggedIn, user])

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => {
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }))
                    // Default to first available method
                    if (data.paymentStripeEnabled) setPaymentMethod('stripe')
                    else if (data.paymentBankTransferEnabled) setPaymentMethod('bank_transfer')
                }
            })
            .catch(console.error)
    }, [])

    const subtotal = getCartTotal()
    const customShippingCosts = items.filter(i => i.customShipping).map(i => i.customShipping)
    const hasCustomShipping = customShippingCosts.length > 0
    const maxCustomShipping = hasCustomShipping ? Math.max(...customShippingCosts) : 0
    const shippingCost = hasCustomShipping
        ? maxCustomShipping
        : (settings.freeShippingEnabled && subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost)
    const promoDiscount = appliedPromo
        ? (appliedPromo.discountType === 'percentage' ? subtotal * (appliedPromo.discountValue / 100) : appliedPromo.discountValue)
        : 0
    const totalAmount = subtotal + shippingCost - promoDiscount

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const applyPromoCode = async () => {
        if (!promoCode.trim()) return
        setPromoLoading(true); setPromoError('')
        try {
            const res = await fetch(`${API_BASE_URL}/api/promo-codes/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode, orderTotal: subtotal })
            })
            const data = await res.json()
            if (res.ok && data.valid) { setAppliedPromo(data.promo); setPromoError('') }
            else { setPromoError(data.error || 'Invalid promo code'); setAppliedPromo(null) }
        } catch { setPromoError('Error validating code') }
        setPromoLoading(false)
    }

    const handleReceiptChange = e => {
        const file = e.target.files[0]
        if (!file) return
        setReceiptFile(file)
        const reader = new FileReader()
        reader.onload = ev => setReceiptPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (!formData.email || !formData.phone) {
            showToast('Email and phone number are required.', 'error'); return
        }
        if (paymentMethod === 'bank_transfer' && !receiptFile) {
            showToast('Please upload your bank transfer receipt.', 'error'); return
        }
        setLoading(true)
        setUploadStatus('creating')
        try {
            const orderPayload = {
                items: items.map(item => ({
                    productId: item.id, name: item.name, price: item.price,
                    salePrice: item.salePrice, image: item.images?.[0] || item.image,
                    quantity: item.quantity, customShipping: item.customShipping
                })),
                customer: {
                    email: formData.email, firstName: formData.firstName,
                    lastName: formData.lastName, phone: formData.phone,
                    name: `${formData.firstName} ${formData.lastName}`
                },
                shipping: { address: formData.address, city: formData.city, state: formData.state, postcode: formData.postcode },
                subtotal, shippingCost, promoDiscount,
                promoCode: appliedPromo?.code || null,
                total: totalAmount,
                isGuestOrder: !isLoggedIn,
                ...(isLoggedIn && user?._id ? { user: user._id } : {})
            }

            if (paymentMethod === 'stripe') {
                const stripeRes = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                })
                if (stripeRes.ok) {
                    const { url } = await stripeRes.json()
                    if (url) { window.location.href = url; return }
                }
                // Stripe fallback — create order directly
            }

            // Create order (bank transfer or Stripe fallback)
            const order = {
                ...orderPayload,
                paymentMethod: paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card',
                paymentStatus: 'pending',
                status: 'pending'
            }
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            })
            if (!res.ok) throw new Error('Order failed')
            const data = await res.json()

            if (appliedPromo) {
                await fetch(`${API_BASE_URL}/api/promo-codes/${appliedPromo.id}/use`, { method: 'POST' })
            }

            // Upload receipt for bank transfer
            if (paymentMethod === 'bank_transfer' && receiptFile) {
                setUploadStatus('uploading')
                const orderId = data.order?._id || data.order?.id
                const formDataUpload = new FormData()
                formDataUpload.append('receipt', receiptFile)
                const uploadRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/bank-receipt`, {
                    method: 'POST', body: formDataUpload
                })
                if (!uploadRes.ok) throw new Error('Receipt upload failed')
            }

            setUploadStatus('complete')
            clearCart()
            navigate(`/checkout/success?order=${data.orderId}`)
        } catch (err) {
            showToast('Error processing order. Please try again.', 'error')
        } finally {
            setLoading(false)
            setUploadStatus('')
        }
    }

    const inputStyle = {
        width: '100%', padding: '14px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px',
        fontSize: '14px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', outline: 'none'
    }
    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: '700', color: '#555',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px'
    }

    if (items.length === 0) {
        return (
            <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ textAlign: 'center', maxWidth: '440px' }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>Your cart is empty</h2>
                    <p style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>Add some products before checking out.</p>
                    <Link to="/products" style={{ display: 'inline-block', padding: '16px 40px', background: 'linear-gradient(135deg, #6B2346, #8B3A5E)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: '600' }}>Shop Now</Link>
                </div>
            </div>
        )
    }

    const bothEnabled = settings.paymentStripeEnabled && settings.paymentBankTransferEnabled

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: isMobile ? '20px 0 100px' : '40px 0 80px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
                {/* Guest notice */}
                {!isLoggedIn && (
                    <div style={{ background: '#FFF9C4', border: '1px solid #F9A825', borderRadius: '10px', padding: '12px 18px', marginBottom: '24px', fontSize: '13px', color: '#5d4037' }}>
                        Checking out as guest — <Link to="/account" style={{ color: '#6B2346', fontWeight: '600' }}>Sign in</Link> to save your order history and details.
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 400px', gap: '32px', alignItems: 'start' }}>
                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Shipping */}
                        <div style={{ background: '#fff', padding: isMobile ? '24px' : '36px', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 24px' }}>Shipping Details</h2>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Email Address *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="your@email.com" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                <div><label style={labelStyle}>First Name *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Last Name *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={inputStyle} required /></div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Phone Number *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="0412 345 678" required />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Street Address *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} style={inputStyle} placeholder="123 Main Street" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px' }}>
                                <div><label style={labelStyle}>City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} style={inputStyle} required /></div>
                                <div>
                                    <label style={labelStyle}>State *</label>
                                    <select name="state" value={formData.state} onChange={handleChange} style={{ ...inputStyle, padding: '13px 14px' }} required>
                                        <option value="">Select</option>
                                        {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div><label style={labelStyle}>Postcode *</label><input type="text" name="postcode" value={formData.postcode} onChange={handleChange} style={inputStyle} maxLength="4" required /></div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div style={{ background: '#fff', padding: isMobile ? '24px' : '36px', borderRadius: '20px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 20px' }}>Payment Method</h2>

                            {/* Method selector */}
                            {bothEnabled && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { key: 'stripe', icon: '💳', label: 'Pay Online', sub: 'Card, Apple Pay, Google Pay' },
                                        { key: 'bank_transfer', icon: '🏦', label: 'Bank Transfer', sub: 'Manual — receipt required' }
                                    ].map(m => (
                                        <button key={m.key} type="button" onClick={() => setPaymentMethod(m.key)} style={{
                                            padding: '16px', border: `2px solid ${paymentMethod === m.key ? '#6B2346' : '#e0e0e0'}`,
                                            borderRadius: '12px', background: paymentMethod === m.key ? '#FDF2F5' : '#fff',
                                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                        }}>
                                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{m.icon}</div>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{m.label}</div>
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{m.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Stripe */}
                            {(paymentMethod === 'stripe' && settings.paymentStripeEnabled) && (
                                <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                        <svg viewBox="0 0 24 24" width="26" height="26" fill="#635BFF"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>Pay securely with Stripe</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>You'll be redirected to complete payment</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay', 'Afterpay'].map(n => (
                                            <span key={n} style={{ padding: '4px 10px', background: '#fff', borderRadius: '6px', fontSize: '11px', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '600' }}>{n}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bank Transfer */}
                            {(paymentMethod === 'bank_transfer' && settings.paymentBankTransferEnabled) && (
                                <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '20px', border: '1px solid #BBF7D0' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#166534', margin: '0 0 14px' }}>🏦 Bank Transfer Details</h3>
                                    <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                                        {[
                                            { label: 'Bank', value: settings.bankName },
                                            { label: 'Account Name', value: settings.bankAccountName },
                                            { label: 'BSB', value: settings.bankBSB },
                                            { label: 'Account Number', value: settings.bankAccountNumber },
                                            { label: 'Reference', value: 'Your Order ID (shown after placing)' }
                                        ].filter(r => r.value).map(row => (
                                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 12px', background: '#fff', borderRadius: '8px' }}>
                                                <span style={{ color: '#666', fontWeight: '600' }}>{row.label}</span>
                                                <span style={{ color: '#1a1a1a', fontWeight: '700' }}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {settings.bankInstructions && (
                                        <p style={{ fontSize: '12px', color: '#166534', background: '#dcfce7', padding: '10px 12px', borderRadius: '8px', margin: '0 0 16px' }}>
                                            {settings.bankInstructions}
                                        </p>
                                    )}
                                    <div>
                                        <label style={{ ...labelStyle, color: '#166534' }}>Upload Transfer Receipt *</label>
                                        <div
                                            onClick={() => receiptRef.current?.click()}
                                            style={{ border: '2px dashed #86EFAC', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#fff' }}
                                        >
                                            {receiptPreview ? (
                                                <img src={receiptPreview} alt="Receipt" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                                            ) : (
                                                <>
                                                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📎</div>
                                                    <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Click to upload screenshot or PDF of your transfer</p>
                                                </>
                                            )}
                                        </div>
                                        <input ref={receiptRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleReceiptChange} />
                                        {receiptFile && <p style={{ fontSize: '12px', color: '#166534', marginTop: '6px' }}>✓ {receiptFile.name}</p>}
                                        {loading && (
                                            <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <span>{uploadStatus === 'creating' ? '1. Creating Order...' : uploadStatus === 'uploading' ? '2. Uploading Receipt to Cloud...' : '3. Finishing...'}</span>
                                                    <span>{uploadStatus === 'creating' ? '40%' : uploadStatus === 'uploading' ? '85%' : '100%'}</span>
                                                </div>
                                                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: uploadStatus === 'creating' ? '40%' : uploadStatus === 'uploading' ? '85%' : '100%',
                                                        background: 'linear-gradient(90deg, #6B2346, #8B3A5E)',
                                                        borderRadius: '4px',
                                                        transition: 'width 0.4s ease-in-out'
                                                    }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={loading} style={{
                                width: '100%', padding: '16px', marginTop: '20px',
                                background: loading ? '#999' : 'linear-gradient(135deg, #6B2346, #8B3A5E)',
                                color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700',
                                cursor: loading ? 'wait' : 'pointer', boxShadow: '0 6px 20px rgba(107,35,70,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}>
                                {loading ? (
                                    <>
                                        <div style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        {uploadStatus === 'creating' ? 'Placing Order...' : uploadStatus === 'uploading' ? 'Uploading Receipt...' : 'Processing...'}
                                    </>
                                ) : (
                                    <>{paymentMethod === 'bank_transfer' ? '📋 Place Order' : '🔒 Complete Secure Checkout'}</>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Order Summary */}
                    <div style={{
                        background: '#fff', padding: isMobile ? '24px' : '28px', borderRadius: '20px',
                        border: '1px solid #f0f0f0', position: isMobile ? 'relative' : 'sticky', top: '100px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginTop: 0, marginBottom: '20px' }}>Order Summary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                            {items.map(item => {
                                const price = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price
                                return (
                                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <img src={item.images?.[0] || item.image || '/placeholder.svg'} alt={item.name}
                                                style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', background: '#f5f5f5' }}
                                                onError={e => e.target.src = '/placeholder.svg'} />
                                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '18px', height: '18px', background: '#6B2346', color: '#fff', borderRadius: '50%', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#6B2346', flexShrink: 0 }}>${(price * item.quantity).toFixed(2)}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Promo Code */}
                        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                            <label style={{ ...labelStyle, marginBottom: '8px' }}>Promo Code</label>
                            {appliedPromo ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5', padding: '10px 14px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px' }}><strong style={{ color: '#059669' }}>{appliedPromo.code}</strong> — {appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% off` : `$${appliedPromo.discountValue} off`}</span>
                                    <button onClick={() => { setAppliedPromo(null); setPromoCode('') }} style={{ background: 'none', border: 'none', color: '#DC3545', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Remove</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="ENTER CODE"
                                            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', textTransform: 'uppercase', outline: 'none' }} />
                                        <button type="button" onClick={applyPromoCode} disabled={promoLoading}
                                            style={{ padding: '10px 16px', background: '#222', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                            {promoLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {promoError && <div style={{ color: '#DC3545', fontSize: '12px', marginTop: '6px' }}>{promoError}</div>}
                                </>
                            )}
                        </div>

                        {/* Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                                <span>Subtotal</span><span style={{ fontWeight: '600', color: '#333' }}>${subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                                <span>Shipping</span>
                                <span>
                                    {shippingCost === 0 ? <span style={{ color: '#059669', fontWeight: '600' }}>FREE</span>
                                        : <span style={{ fontWeight: '600', color: '#333' }}>${shippingCost.toFixed(2)}</span>}
                                </span>
                            </div>
                            {appliedPromo && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#059669' }}>
                                    <span>Discount ({appliedPromo.code})</span><span>-${promoDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#1a1a1a', paddingTop: '12px', borderTop: '2px solid #f5f5f5' }}>
                                <span>Total</span><span>${totalAmount.toFixed(2)} AUD</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}

export default Checkout
