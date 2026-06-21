import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'
import ProductCard from './ProductCard'

// Custom hook for responsive design
function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200
    })

    useEffect(() => {
        function handleResize() {
            setWindowSize({ width: window.innerWidth })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return windowSize
}

function FeaturedProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { width } = useWindowSize()
    const isMobile = width < 576

    // Responsive grid columns
    const getGridColumns = () => {
        if (width < 576) return '1fr 1fr'
        if (width < 992) return 'repeat(3, 1fr)'
        return 'repeat(4, 1fr)'
    }

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/products?featured=true&limit=8`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const styles = {
        section: { padding: isMobile ? '40px 0' : '60px 0', background: '#f8f8f8' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        header: { textAlign: 'center', marginBottom: isMobile ? '30px' : '40px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '26px' : '32px', fontWeight: '600', color: '#222', marginBottom: '10px' },
        subtitle: { fontSize: isMobile ? '14px' : '15px', color: '#666' },
        grid: { display: 'grid', gridTemplateColumns: getGridColumns(), gap: isMobile ? '12px' : '20px' },
        cta: { textAlign: 'center', marginTop: isMobile ? '30px' : '40px' },
        btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 24px' : '14px 36px', fontSize: isMobile ? '14px' : '15px', fontWeight: '600', borderRadius: '8px', background: '#6B2346', color: '#fff', textDecoration: 'none', border: 'none', cursor: 'pointer' },
        loading: { display: 'flex', justifyContent: 'center', padding: '60px 0' }
    }

    if (loading) {
        return (
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <h2 style={styles.title}>Featured Products</h2>
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
                    <h2 style={styles.title}>Featured Products</h2>
                    <p style={styles.subtitle}>Handpicked favorites for your cake decorating needs</p>
                </div>

                <div style={styles.grid}>
                    {products.map(product => (
                        <ProductCard
                            key={product.id || product._id}
                            product={product}
                        />
                    ))}
                </div>

                <div style={styles.cta}>
                    <Link to="/products?featured=true" style={styles.btn}>
                        View All Featured
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default FeaturedProducts
