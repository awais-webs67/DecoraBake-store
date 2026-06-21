import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function Cart() {
    const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
    const width = useWindowSize()
    const isMobile = width < 768
    const [removingId, setRemovingId] = useState(null)

    useSEO({
        title: 'Shopping Cart',
        description: 'Review your cart and checkout. Free shipping on orders over $149 Australia-wide.',
        url: '/cart'
    })

    const [settings, setSettings] = useState({ freeShippingEnabled: true, freeShippingThreshold: 149, shippingCost: 9.95 })

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => { if (data) setSettings(prev => ({ ...prev, ...data })) })
            .catch(console.error)
    }, [])

    const threshold = settings.freeShippingThreshold || 149
    const baseShippingCost = settings.shippingCost || 9.95

    const customShippingCosts = items.filter(item => item.customShipping).map(item => item.customShipping)
    const hasCustomShipping = customShippingCosts.length > 0
    const maxCustomShipping = hasCustomShipping ? Math.max(...customShippingCosts) : 0

    const cartTotal = getCartTotal()
    const qualifiesForFreeShipping = !hasCustomShipping && settings.freeShippingEnabled && cartTotal >= threshold
    const progressPercent = Math.min(100, (cartTotal / threshold) * 100)
    const shippingCost = hasCustomShipping ? maxCustomShipping : (qualifiesForFreeShipping ? 0 : baseShippingCost)

    const handleRemove = (id) => {
        setRemovingId(id)
        setTimeout(() => {
            removeFromCart(id)
            setRemovingId(null)
        }, 300)
    }

    if (items.length === 0) {
        return (
            <div style={{ background: '#FAFAFA', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ textAlign: 'center', maxWidth: '440px' }}>
                    <div style={{
                        width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 32px',
                        background: 'linear-gradient(135deg, #FDF2F5 0%, #FCE8ED 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>Your cart is empty</h2>
                    <p style={{ fontSize: '16px', color: '#888', marginBottom: '36px', lineHeight: '1.6' }}>Looks like you haven't added anything yet. Explore our collection and find something you love!</p>
                    <Link to="/products" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '16px 40px', background: 'linear-gradient(135deg, #6B2346 0%, #8B3A5E 100%)',
                        color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: '600', fontSize: '16px',
                        boxShadow: '0 4px 20px rgba(107,35,70,0.3)', transition: 'all 0.3s'
                    }}>
                        Start Shopping
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: isMobile ? '20px 0 120px' : '40px 0 80px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '28px' }}>
                    <Link to="/" style={{ color: '#6B2346', textDecoration: 'none' }}>Home</Link>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    <span style={{ color: '#555' }}>Shopping Cart</span>
                </div>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '34px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>Shopping Cart</h1>
                        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
                    </div>
                    <button onClick={clearCart} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 20px', background: 'transparent', color: '#DC3545', border: '1px solid #FADBD8',
                        borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Clear Cart
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: '32px', alignItems: 'start' }}>
                    {/* Cart Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {items.map(item => {
                            const price = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price
                            const isRemoving = removingId === item.id
                            return (
                                <div key={item.id} style={{
                                    display: 'flex', gap: isMobile ? '16px' : '24px', alignItems: 'center',
                                    background: '#fff', padding: isMobile ? '16px' : '24px', borderRadius: '16px',
                                    border: '1px solid #f0f0f0', transition: 'all 0.3s ease',
                                    opacity: isRemoving ? 0 : 1, transform: isRemoving ? 'translateX(-20px)' : 'none'
                                }}>
                                    {/* Image */}
                                    <Link to={`/product/${item.id}`} style={{ flexShrink: 0 }}>
                                        <img
                                            src={item.image || item.images?.[0] || '/placeholder.svg'}
                                            alt={item.name}
                                            style={{
                                                width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px',
                                                objectFit: 'cover', borderRadius: '12px', background: '#f8f8f8'
                                            }}
                                            loading="lazy"
                                            onError={e => e.target.src = '/placeholder.svg'}
                                        />
                                    </Link>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Link to={`/product/${item.id}`} style={{
                                            fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '14px' : '16px',
                                            fontWeight: '600', color: '#222', textDecoration: 'none', display: 'block',
                                            marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>{item.name}</Link>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '17px', fontWeight: '700', color: '#6B2346' }}>${price?.toFixed(2)}</span>
                                            {item.salePrice && item.salePrice < item.price && (
                                                <span style={{ fontSize: '13px', color: '#bbb', textDecoration: 'line-through' }}>${item.price.toFixed(2)}</span>
                                            )}
                                        </div>

                                        {/* Quantity controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', flexWrap: 'wrap' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', border: '1.5px solid #e8e8e8',
                                                borderRadius: '10px', overflow: 'hidden', background: '#FAFAFA'
                                            }}>
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                                                    style={{
                                                        width: '36px', height: '36px', border: 'none', background: 'transparent',
                                                        fontSize: '18px', cursor: item.quantity <= 1 ? 'default' : 'pointer',
                                                        color: item.quantity <= 1 ? '#ccc' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'color 0.2s'
                                                    }}>−</button>
                                                <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: '600', color: '#222' }}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    style={{
                                                        width: '36px', height: '36px', border: 'none', background: 'transparent',
                                                        fontSize: '18px', cursor: 'pointer', color: '#333',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
                                                    }}>+</button>
                                            </div>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>${(price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Remove */}
                                    <button onClick={() => handleRemove(item.id)} style={{
                                        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', borderRadius: '8px',
                                        transition: 'all 0.3s', flexShrink: 0
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Order Summary */}
                    <div style={{
                        background: '#fff', padding: isMobile ? '24px' : '32px', borderRadius: '20px',
                        border: '1px solid #f0f0f0', position: isMobile ? 'relative' : 'sticky', top: '100px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                    }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '28px', margin: '0 0 28px' }}>
                            Order Summary
                        </h3>

                        {/* Free shipping progress */}
                        {settings.freeShippingEnabled && !qualifiesForFreeShipping && (
                            <div style={{
                                background: 'linear-gradient(135deg, #FDF2F5 0%, #FCE8ED 100%)',
                                padding: '16px 20px', borderRadius: '14px', marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B2346' }}>
                                        Add <strong>${(threshold - cartTotal).toFixed(2)}</strong> more for free shipping!
                                    </span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.7)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${progressPercent}%`,
                                        background: 'linear-gradient(90deg, #6B2346, #C64977)',
                                        borderRadius: '3px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }} />
                                </div>
                            </div>
                        )}

                        {qualifiesForFreeShipping && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#ECFDF5', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>You qualify for free shipping!</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#666' }}>
                                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                <span style={{ fontWeight: '600', color: '#333' }}>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#666' }}>
                                <span>Shipping</span>
                                <span style={{ fontWeight: '600', color: qualifiesForFreeShipping ? '#059669' : '#333' }}>
                                    {qualifiesForFreeShipping ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                                </span>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex', justifyContent: 'space-between', padding: '20px 0', marginBottom: '24px',
                            borderTop: '2px solid #f5f5f5', fontSize: '20px', fontWeight: '700', color: '#1a1a1a'
                        }}>
                            <span>Total</span>
                            <span>${(cartTotal + (qualifiesForFreeShipping ? 0 : shippingCost)).toFixed(2)} AUD</span>
                        </div>

                        <Link to="/checkout" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6B2346 0%, #8B3A5E 100%)',
                            color: '#fff', borderRadius: '14px', fontSize: '16px', fontWeight: '600', textDecoration: 'none',
                            boxShadow: '0 4px 20px rgba(107,35,70,0.25)', transition: 'all 0.3s',
                            boxSizing: 'border-box'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                            Proceed to Checkout
                        </Link>

                        {/* Trust badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#999' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Secure
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#999' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                AU Shipping
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#999' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                Receipt
                            </div>
                        </div>

                        <Link to="/products" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            marginTop: '16px', color: '#6B2346', fontSize: '14px', textDecoration: 'none', fontWeight: '500'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart
