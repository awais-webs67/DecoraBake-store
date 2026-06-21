import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import API_BASE_URL from '../config/api'

function CartDrawer() {
    const { items, removeFromCart, updateQuantity, getCartTotal, cartDrawerOpen, setCartDrawerOpen } = useCart()
    const location = useLocation()
    const [settings, setSettings] = useState({ freeShippingEnabled: true, freeShippingThreshold: 149 })

    // Close drawer when route changes
    useEffect(() => {
        setCartDrawerOpen(false)
    }, [location.pathname, setCartDrawerOpen])

    // Body scroll lock when drawer is active
    useEffect(() => {
        if (cartDrawerOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [cartDrawerOpen])

    // Fetch store settings for shipping threshold
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => { if (data) setSettings(prev => ({ ...prev, ...data })) })
            .catch(console.error)
    }, [])

    if (!cartDrawerOpen) return null

    const subtotal = getCartTotal()
    const threshold = settings.freeShippingThreshold || 149
    const qualifiesForFreeShipping = settings.freeShippingEnabled && subtotal >= threshold
    const progressPercent = Math.min(100, (subtotal / threshold) * 100)

    return (
        <>
            {/* Dark blur backdrop */}
            <div 
                onClick={() => setCartDrawerOpen(false)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    transition: 'opacity 0.3s ease-in-out'
                }}
            />

            {/* Slide-in cart drawer panel */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '400px',
                maxWidth: '100%',
                background: '#fff',
                zIndex: 10000,
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                fontFamily: "'Poppins', sans-serif"
            }}>
                <style>{`
                    @keyframes slideIn {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#1a1a1a'
                        }}>Shopping Cart</h2>
                        <span style={{ fontSize: '12px', color: '#888' }}>
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                    <button 
                        onClick={() => setCartDrawerOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#888',
                            transition: 'color 0.2s',
                            padding: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                    >
                        ✕
                    </button>
                </div>

                {/* Free Shipping Progress Indicator */}
                {settings.freeShippingEnabled && items.length > 0 && (
                    <div style={{
                        padding: '16px 20px',
                        background: '#FFF5F7',
                        borderBottom: '1px solid #FFEBEF'
                    }}>
                        {qualifiesForFreeShipping ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                You qualify for FREE shipping! 🚚
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontSize: '12.5px', color: '#6B2346', fontWeight: '500', marginBottom: '8px' }}>
                                    Add <strong>${(threshold - subtotal).toFixed(2)}</strong> more for free shipping!
                                </div>
                                <div style={{ height: '6px', background: 'rgba(107,35,70,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${progressPercent}%`,
                                        background: 'linear-gradient(90deg, #6B2346, #C64977)',
                                        borderRadius: '3px',
                                        transition: 'width 0.4s ease'
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Scrollable list of items */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#fafafa'
                }}>
                    {items.length === 0 ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '40px 20px'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: '#FCE8ED', color: '#6B2346',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '20px'
                            }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>Your cart is empty</h3>
                            <p style={{ fontSize: '13.5px', color: '#888', margin: '0 0 24px 0', lineHeight: 1.5 }}>Explore our store to add products to your cart!</p>
                            <button 
                                onClick={() => setCartDrawerOpen(false)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#6B2346',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Shop Products
                            </button>
                        </div>
                    ) : (
                        items.map(item => {
                            const price = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price
                            return (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    gap: '14px',
                                    background: '#fff',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #f0f0f0',
                                    alignItems: 'center'
                                }}>
                                    {/* Product image */}
                                    <Link to={`/product/${item.id}`} style={{ flexShrink: 0 }}>
                                        <img
                                            src={item.image || item.images?.[0] || '/placeholder.svg'}
                                            alt={item.name}
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                background: '#f8f8f8'
                                            }}
                                            onError={e => e.target.src = '/placeholder.svg'}
                                        />
                                    </Link>

                                    {/* Product details */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Link to={`/product/${item.id}`} style={{
                                            fontSize: '13.5px',
                                            fontWeight: '600',
                                            color: '#222',
                                            textDecoration: 'none',
                                            display: 'block',
                                            marginBottom: '4px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>{item.name}</Link>
                                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#6B2346', marginBottom: '8px' }}>
                                            ${price?.toFixed(2)}
                                        </div>

                                        {/* Quantity editors */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                background: '#fff',
                                                height: '28px'
                                            }}>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    style={{
                                                        width: '28px', height: '100%', border: 'none', background: 'transparent',
                                                        cursor: item.quantity <= 1 ? 'default' : 'pointer', color: item.quantity <= 1 ? '#cbd5e1' : '#334155',
                                                        fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    -
                                                </button>
                                                <span style={{ fontSize: '12.5px', fontWeight: '600', width: '24px', textAlign: 'center', color: '#1e293b' }}>
                                                    {item.quantity}
                                                </span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    style={{
                                                        width: '28px', height: '100%', border: 'none', background: 'transparent',
                                                        cursor: 'pointer', color: '#334155',
                                                        fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                                                ${(price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Trash close action */}
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#cbd5e1',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            transition: 'color 0.2s',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer and summary */}
                {items.length > 0 && (
                    <div style={{
                        padding: '20px',
                        borderTop: '1px solid #f0f0f0',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <span style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>Subtotal</span>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#6B2346' }}>
                                ${subtotal.toFixed(2)} AUD
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link 
                                to="/checkout" 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #6B2346 0%, #8B3A5E 100%)',
                                    color: '#fff',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 15px rgba(107,35,70,0.2)'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                Checkout Now
                            </Link>

                            <Link 
                                to="/cart" 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '12px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    color: '#334155',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                            >
                                View Cart Details
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default CartDrawer
