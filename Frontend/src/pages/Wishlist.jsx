import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useSEO } from '../hooks/useSEO'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function Wishlist() {
    const { items, removeFromWishlist, clearWishlist } = useWishlist()
    const { addToCart, setCartDrawerOpen } = useCart()
    const { showToast } = useToast()
    const width = useWindowSize()
    const isMobile = width < 768

    useSEO({ title: 'My Wishlist', description: 'Your saved products at DecoraBake.' })

    const handleAddToCart = (product) => {
        addToCart(product, 1)
        showToast(`${product.name} added to cart!`, 'success')
        setCartDrawerOpen(true)
    }

    const handleRemove = (id, name) => {
        removeFromWishlist(id)
        showToast(`${name} removed from wishlist`, 'info')
    }

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', padding: isMobile ? '20px 16px 60px' : '40px 20px 80px' },
        container: { maxWidth: '1000px', margin: '0 auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '24px' : '32px', fontWeight: '700', color: '#222', margin: 0 },
        count: { fontSize: '14px', color: '#888', fontWeight: '400' },
        clearBtn: { padding: '8px 20px', background: 'transparent', color: '#6B2346', border: '2px solid #6B2346', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
        card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', transition: 'transform 0.2s, box-shadow 0.2s' },
        imageWrap: { position: 'relative', paddingTop: '100%', overflow: 'hidden', background: '#f5f5f5' },
        image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
        removeBtn: { position: 'absolute', top: '12px', right: '12px', width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
        saleBadge: { position: 'absolute', top: '12px', left: '12px', background: '#EF4444', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
        content: { padding: '16px' },
        name: { fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
        priceRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
        price: { fontSize: '18px', fontWeight: '700', color: '#6B2346' },
        originalPrice: { fontSize: '14px', color: '#999', textDecoration: 'line-through' },
        addCartBtn: { width: '100%', padding: '10px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
        empty: { textAlign: 'center', padding: '80px 20px' },
        emptyIcon: { fontSize: '60px', marginBottom: '20px' },
        emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#222', marginBottom: '12px' },
        emptyText: { fontSize: '16px', color: '#888', marginBottom: '30px' },
        shopBtn: { display: 'inline-block', padding: '14px 36px', background: '#6B2346', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '16px' }
    }

    if (items.length === 0) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}>♡</div>
                        <h1 style={styles.emptyTitle}>Your wishlist is empty</h1>
                        <p style={styles.emptyText}>Browse our collection and save your favorite items</p>
                        <Link to="/products" style={styles.shopBtn}>Explore Products</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>
                        My Wishlist <span style={styles.count}>({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    </h1>
                    <button style={styles.clearBtn} onClick={() => { clearWishlist(); showToast('Wishlist cleared', 'info') }}>Clear All</button>
                </div>

                <div style={styles.grid}>
                    {items.map(product => {
                        const id = product.id || product._id
                        const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price
                        const displayPrice = hasDiscount ? product.salePrice : product.price
                        const discountPercent = hasDiscount ? Math.round((1 - product.salePrice / product.price) * 100) : 0

                        return (
                            <div key={id} style={styles.card}>
                                <Link to={`/product/${id}`} style={{ textDecoration: 'none' }}>
                                    <div style={styles.imageWrap}>
                                        <img
                                            src={product.image || product.images?.[0] || '/placeholder.svg'}
                                            alt={product.name}
                                            style={styles.image}
                                            onError={e => e.target.src = '/placeholder.svg'}
                                        />
                                        {hasDiscount && <span style={styles.saleBadge}>{discountPercent}% OFF</span>}
                                        <button
                                            style={styles.removeBtn}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(id, product.name) }}
                                            title="Remove from wishlist"
                                        >
                                            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#EF4444" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                                        </button>
                                    </div>
                                </Link>
                                <div style={styles.content}>
                                    <Link to={`/product/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={styles.name}>{product.name}</div>
                                    </Link>
                                    <div style={styles.priceRow}>
                                        <span style={styles.price}>${displayPrice?.toFixed(2)}</span>
                                        {hasDiscount && <span style={styles.originalPrice}>${product.price.toFixed(2)}</span>}
                                    </div>
                                    <button style={styles.addCartBtn} onClick={() => handleAddToCart(product)}>
                                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4l-3.87 7H8.53L4.27 2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z" /></svg>
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Wishlist
