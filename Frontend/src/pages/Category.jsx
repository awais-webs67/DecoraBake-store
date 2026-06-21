import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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

// Product card with proper image error handling and Add to Cart
function ProductCard({ product, category, styles }) {
    const [imgSrc, setImgSrc] = useState(product.image || product.images?.[0] || '/placeholder.svg')
    const [imgError, setImgError] = useState(false)
    const [addedToCart, setAddedToCart] = useState(false)
    const { addToCart } = useCart()
    const productId = product.id || product._id

    const handleImageError = () => {
        if (!imgError) {
            setImgError(true)
            setImgSrc('/placeholder.svg')
        }
    }

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(product, 1)
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 1500)
    }

    if (!productId) return null

    return (
        <Link to={`/product/${productId}`} key={productId} style={{ textDecoration: 'none' }}>
            <div style={styles.card}>
                <div style={styles.cardImageWrap}>
                    <img src={imgSrc} alt={product.name} style={styles.cardImage} loading="lazy" onError={handleImageError} />
                    <button style={styles.quickAddBtn} onClick={handleAddToCart} title="Add to Cart">
                        {addedToCart ? (
                            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4l-3.87 7H8.53L4.27 2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z" /></svg>
                        )}
                    </button>
                </div>
                <div style={styles.cardContent}>
                    <p style={styles.cardCategory}>{category?.name || 'Cake Supplies'}</p>
                    <h3 style={styles.cardName}>{product.name}</h3>
                    <div>
                        <span style={styles.cardPrice}>${product.salePrice || product.price}</span>
                        {product.salePrice && <span style={styles.cardOldPrice}>${product.price}</span>}
                    </div>
                </div>
            </div>
        </Link>
    )
}

function Category() {
    const { slug } = useParams()
    const [category, setCategory] = useState(null)
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

    useSEO({
        title: category?.name,
        description: category?.description || `Shop ${category?.name} at DecoraBake - Australia's #1 Cake Supply Store`,
        image: category?.image,
        url: `/category/${slug}`
    })

    useEffect(() => {
        setLoading(true)
        fetch(`${API_BASE_URL}/api/categories/${slug}`)
            .then(res => res.json())
            .then(data => setCategory(data))
            .catch(console.error)

        // Use slug directly - backend now resolves it to categoryId
        fetch(`${API_BASE_URL}/api/products?category=${slug}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [slug])

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh' },
        header: {
            background: category?.image
                ? `linear-gradient(rgba(107,35,70,0.8), rgba(74,24,48,0.9)), url(${category.image})`
                : 'linear-gradient(135deg, #6B2346 0%, #4A1830 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#fff',
            padding: isMobile ? '40px 0' : '60px 0'
        },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        breadcrumb: { display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', flexWrap: 'wrap' },
        breadcrumbLink: { color: '#F9D5E0', textDecoration: 'none' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '44px', fontWeight: '700', marginBottom: '12px', color: '#ffffff' },
        description: { fontSize: '16px', opacity: 0.9, maxWidth: '600px', marginBottom: '16px', color: '#ffffff' },
        count: { fontSize: '14px', opacity: 0.7, color: '#ffffff' },
        main: { padding: isMobile ? '30px 0' : '50px 0' },
        grid: { display: 'grid', gridTemplateColumns: getGridColumns(), gap: isMobile ? '12px' : '24px' },
        card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' },
        cardImageWrap: { position: 'relative', overflow: 'hidden' },
        cardImage: { width: '100%', height: isMobile ? '140px' : '200px', objectFit: 'cover', background: '#f5f5f5', display: 'block' },
        quickAddBtn: { position: 'absolute', bottom: '10px', right: '10px', width: '36px', height: '36px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.3s' },
        cardContent: { padding: isMobile ? '12px' : '16px' },
        cardCategory: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
        cardName: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '13px' : '15px', fontWeight: '600', color: '#222', marginBottom: '8px', lineHeight: '1.3' },
        cardPrice: { fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#6B2346' },
        cardOldPrice: { fontSize: '13px', color: '#999', textDecoration: 'line-through', marginLeft: '8px' },
        loading: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
        empty: { textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '16px' },
        emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '12px' },
        emptyText: { fontSize: '15px', color: '#666', marginBottom: '24px' },
        btn: { display: 'inline-block', padding: '14px 32px', background: '#6B2346', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }
    }

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.container}>
                    <nav style={styles.breadcrumb}>
                        <Link to="/" style={styles.breadcrumbLink}>Home</Link>
                        <span>/</span>
                        <Link to="/products" style={styles.breadcrumbLink}>Products</Link>
                        <span>/</span>
                        <span>{category?.name || 'Category'}</span>
                    </nav>
                    <h1 style={styles.title}>{category?.name || 'Category'}</h1>
                    {category?.description && <p style={styles.description}>{category.description}</p>}
                    <p style={styles.count}>{products.length} products found</p>
                </div>
            </div>

            {/* Main */}
            <div style={styles.container}>
                <main style={styles.main}>
                    {loading ? (
                        <div style={styles.loading}><p>Loading products...</p></div>
                    ) : products.length === 0 ? (
                        <div style={styles.empty}>
                            <h3 style={styles.emptyTitle}>No products in this category</h3>
                            <p style={styles.emptyText}>Check back soon for new products!</p>
                            <Link to="/products" style={styles.btn}>View All Products</Link>
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {products.map(product => (
                                <ProductCard
                                    key={product.id || product._id}
                                    product={product}
                                    category={category}
                                    styles={styles}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Category
