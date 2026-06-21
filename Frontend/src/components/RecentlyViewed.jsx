import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'

/**
 * Recently Viewed Products section
 * Shows products the user has recently visited, stored in localStorage
 */

// Call this from ProductDetail to track views
export function trackRecentlyViewed(product) {
    if (!product) return
    const id = product.id || product._id
    try {
        let recent = JSON.parse(localStorage.getItem('db_recently_viewed') || '[]')
        // Remove if already exists (to move to front)
        recent = recent.filter(p => (p.id || p._id) !== id)
        // Add to front
        recent.unshift({
            id: id,
            _id: id,
            name: product.name,
            price: product.price,
            salePrice: product.salePrice,
            image: product.image || product.images?.[0],
            category: product.category
        })
        // Keep only last 10
        recent = recent.slice(0, 10)
        localStorage.setItem('db_recently_viewed', JSON.stringify(recent))
    } catch { }
}

function RecentlyViewed({ exclude }) {
    const [products, setProducts] = useState([])
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        try {
            let recent = JSON.parse(localStorage.getItem('db_recently_viewed') || '[]')
            if (exclude) recent = recent.filter(p => (p.id || p._id) !== exclude)
            setProducts(recent.slice(0, 6))
        } catch { }
    }, [exclude])

    const isMobile = width < 768

    if (products.length < 2) return null

    return (
        <section style={{ marginTop: '50px', marginBottom: '30px' }}>
            <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '24px', fontWeight: '600', color: '#222',
                marginBottom: '24px', textAlign: 'center'
            }}>
                Recently Viewed
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : width < 992 ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
                gap: '16px'
            }}>
                {products.map((p, index) => {
                    const pId = p.id || p._id || `recent_${index}`
                    const img = p.image || '/placeholder.svg'
                    const hasDiscount = p.salePrice && p.salePrice > 0 && p.salePrice < p.price
                    return (
                        <Link key={pId} to={`/product/${p.id || p._id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#fff', borderRadius: '12px', overflow: 'hidden',
                                border: '1px solid #f0f0f0', transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                            >
                                <img src={img} alt={p.name} style={{ width: '100%', height: '130px', objectFit: 'cover' }} loading="lazy" onError={e => e.target.src = '/placeholder.svg'} />
                                <div style={{ padding: '10px' }}>
                                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#222', margin: '0 0 4px', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h4>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#6B2346' }}>${(hasDiscount ? p.salePrice : p.price)?.toFixed(2)}</span>
                                        {hasDiscount && <span style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through' }}>${p.price.toFixed(2)}</span>}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}

export default RecentlyViewed
