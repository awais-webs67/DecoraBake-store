import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function ProductCard({ product }) {
    const { addToCart, setCartDrawerOpen } = useCart()
    const [isHovered, setIsHovered] = useState(false)
    const [added, setAdded] = useState(false)
    const width = useWindowSize()
    const isMobile = width < 768

    const price = product.salePrice || product.price
    const originalPrice = product.salePrice ? product.price : null
    const mainImage = product.images?.[0] || product.image || '/hero-bg.png'

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product)
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
        setCartDrawerOpen(true)
    }

    const styles = {
        card: {
            background: '#fff',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.02)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        },
        imageWrapper: {
            position: 'relative',
            paddingTop: '75%', // Changed from 100% to 75% for a shorter, landscape image frame
            overflow: 'hidden',
            background: '#f8f8f8'
        },
        image: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        },
        badges: {
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 2
        },
        badge: {
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        badgeSale: { background: '#EF4444', color: '#fff' },
        badgeNew: { background: '#1a1a1a', color: '#fff' },
        badgeOutOfStock: { background: '#64748b', color: '#fff' },
        content: {
            padding: isMobile ? '8px 12px' : '12px',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column'
        },
        name: {
            fontFamily: "'Poppins', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: isMobile ? '4px' : '6px',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
        },
        category: {
            fontSize: '11px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
            fontWeight: '600'
        },
        priceRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'auto',
            marginBottom: isMobile ? '8px' : '16px'
        },
        price: { fontSize: '16px', fontWeight: '800', color: '#6B2346' },
        originalPrice: { fontSize: '13px', color: '#999', textDecoration: 'line-through' },
        addToCartContainer: {
            marginTop: '12px',
            width: '100%'
        },
        addToCart: {
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: added ? '#10B981' : '#6B2346',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '700',
            boxSizing: 'border-box'
        },
        addToCartHover: {
            background: '#8B3A5E'
        },
        outOfStock: {
            padding: '6px 12px',
            background: '#F1F5F9',
            color: '#64748b',
            border: 'none',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'not-allowed',
            textAlign: 'center'
        }
    }

    const isOutOfStock = product.stock !== undefined && product.stock <= 0

    return (
        <div style={styles.card}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                <div style={styles.imageWrapper}>
                    <img
                        src={mainImage}
                        alt={product.name}
                        style={styles.image}
                        onError={(e) => e.target.src = '/placeholder.svg'}
                    />
                    <div style={styles.badges}>
                        {product.isNew && <span style={{ ...styles.badge, ...styles.badgeNew }}>New</span>}
                        {originalPrice && <span style={{ ...styles.badge, ...styles.badgeSale }}>Sale</span>}
                        {isOutOfStock && <span style={{ ...styles.badge, ...styles.badgeOutOfStock }}>Sold Out</span>}
                    </div>
                </div>
                <div style={styles.content}>
                    <div style={styles.category}>{product.category || 'Bakeware'}</div>
                    <h3 style={styles.name}>{product.name}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {originalPrice && <div style={styles.originalPrice}>${originalPrice?.toFixed(2)}</div>}
                            <div style={styles.price}>${price?.toFixed(2)}</div>
                        </div>

                        <div onClick={(e) => e.preventDefault()} style={styles.addToCartContainer}>
                            {isOutOfStock ? (
                                <div style={{ ...styles.outOfStock, width: '100%', padding: '12px', boxSizing: 'border-box' }}>Sold Out</div>
                            ) : (
                                <button
                                    style={{
                                        ...styles.addToCart,
                                        ...(isHovered && !added ? styles.addToCartHover : {})
                                    }}
                                    onClick={handleAddToCart}
                                    title="Add to Cart"
                                >
                                    {added ? (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            Added to Cart
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                                            </svg>
                                            Add to Cart
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default ProductCard

