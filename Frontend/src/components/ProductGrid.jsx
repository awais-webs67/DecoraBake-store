import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'
import ProductCard from './ProductCard'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function ProductGrid({ title = "Our Products", limit = 8 }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const width = useWindowSize()
    const isMobile = width < 576
    const isTablet = width >= 576 && width < 992

    const getGridColumns = () => {
        if (isMobile) return '1fr 1fr'
        if (isTablet) return 'repeat(3, 1fr)'
        return 'repeat(4, 1fr)'
    }

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/products?limit=${limit}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [limit])

    const styles = {
        section: { padding: isMobile ? '60px 0' : '80px 0', background: '#fff' },
        container: { maxWidth: '1240px', margin: '0 auto', padding: '0 24px' },
        header: { textAlign: 'center', marginBottom: isMobile ? '40px' : '56px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '32px' : '44px', fontWeight: '800', color: '#1a1a1a', marginBottom: '16px' },
        subtitle: { fontSize: isMobile ? '15px' : '16px', color: '#666', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' },
        grid: { display: 'grid', gridTemplateColumns: getGridColumns(), gap: isMobile ? '16px' : '32px' },
        cta: { textAlign: 'center', marginTop: isMobile ? '48px' : '64px' },
        btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 36px', fontSize: '15px', fontWeight: '700', borderRadius: '100px', background: '#1a1a1a', color: '#fff', textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
        loading: { display: 'flex', justifyContent: 'center', padding: '60px 0' }
    }

    if (loading) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <h2 style={styles.title}>{title}</h2>
                    </div>
                    <div style={styles.loading}><p>Loading...</p></div>
                </div>
            </section>
        )
    }

    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.title}>{title}</h2>
                    <p style={styles.subtitle}>Quality supplies for every cake decorator</p>
                </div>

                <div style={styles.grid}>
                    {products.map(product => (
                        <ProductCard key={product.id || product._id} product={product} />
                    ))}
                </div>

                <div style={styles.cta}>
                    <Link to="/products" style={styles.btn}>
                        View All Products
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default ProductGrid
