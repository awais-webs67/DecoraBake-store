import API_BASE_URL from '../config/api'
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import ProductCard from '../components/ProductCard'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}



function Products() {
    useSEO({
        title: 'Shop All Products',
        description: 'Browse our extensive collection of cake decorating supplies, including toppers, sprinkles, and tools.',
        url: '/products'
    })
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalProducts, setTotalProducts] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const productsPerPage = 12
    const width = useWindowSize()
    const isMobile = width < 768
    const isTablet = width >= 768 && width < 992

    const selectedCategory = searchParams.get('category') || ''
    const searchQuery = searchParams.get('search') || ''
    const sortBy = searchParams.get('sort') || 'newest'
    const showSale = searchParams.get('sale') === 'true'
    const showNew = searchParams.get('new') === 'true'

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/categories`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setCategories(data) })
            .catch(console.error)
    }, [])

    useEffect(() => {
        setLoading(true)
        const params = new URLSearchParams({ page: currentPage, limit: productsPerPage, sort: sortBy })
        if (selectedCategory) params.append('category', selectedCategory)
        if (searchQuery) params.append('search', searchQuery)
        if (showSale) params.append('sale', 'true')
        if (showNew) params.append('new', 'true')

        fetch(`${API_BASE_URL}/api/products?${params}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || data || [])
                setTotalProducts(data.total || (data.products || data || []).length)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [currentPage, selectedCategory, searchQuery, sortBy, showSale, showNew])

    const handleCategoryChange = (category) => {
        setSearchParams(prev => {
            if (category) prev.set('category', category)
            else prev.delete('category')
            return prev
        })
        setCurrentPage(1)
        setShowFilters(false)
    }

    const handleSortChange = (sort) => {
        setSearchParams(prev => { prev.set('sort', sort); return prev })
    }

    const totalPages = Math.ceil(totalProducts / productsPerPage)

    const getGridColumns = () => {
        if (isMobile) return '1fr 1fr'
        if (isTablet) return 'repeat(2, 1fr)'
        return 'repeat(3, 1fr)'
    }

    const styles = {
        page: { background: '#f8f8f8', minHeight: '100vh', overflowX: 'hidden' },
        header: { background: 'linear-gradient(135deg, #6B2346 0%, #4A1830 100%)', color: '#fff', padding: isMobile ? '30px 0' : '50px 0', position: 'relative', overflow: 'hidden' },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        breadcrumb: { display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' },
        breadcrumbLink: { color: '#F9D5E0', textDecoration: 'none' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '40px', fontWeight: '700', marginBottom: '10px', color: '#ffffff' },
        count: { fontSize: '15px', opacity: 0.8, color: '#ffffff' },
        layout: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '250px 1fr', gap: '30px', padding: '40px 0' },
        sidebar: { display: isMobile ? (showFilters ? 'block' : 'none') : 'block', position: isMobile ? 'fixed' : 'relative', top: isMobile ? 0 : 'auto', left: isMobile ? 0 : 'auto', right: isMobile ? 0 : 'auto', bottom: isMobile ? 0 : 'auto', background: isMobile ? '#fff' : 'transparent', zIndex: isMobile ? 1000 : 1, padding: isMobile ? '20px' : 0, overflow: isMobile ? 'auto' : 'visible' },
        filterSection: { background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #eee' },
        filterTitle: { fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' },
        filterList: { listStyle: 'none', margin: 0, padding: 0 },
        filterItem: { display: 'block', width: '100%', padding: '10px 12px', fontSize: '14px', color: '#555', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px', textDecoration: 'none' },
        filterItemActive: { background: '#FCE8ED', color: '#6B2346', fontWeight: '600' },
        filterCount: { color: '#999', marginLeft: '4px' },
        closeFilters: { display: isMobile ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' },
        closeBtn: { padding: '10px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
        main: { overflow: 'hidden' },
        toolbar: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '16px', marginBottom: '24px' },
        toolbarInfo: { fontSize: '14px', color: '#666' },
        toolbarSort: { display: 'flex', alignItems: 'center', gap: '10px' },
        sortLabel: { fontSize: '14px', color: '#666' },
        sortSelect: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', background: '#fff', cursor: 'pointer' },
        filterBtn: { display: isMobile ? 'flex' : 'none', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
        grid: { display: 'grid', gridTemplateColumns: getGridColumns(), gap: isMobile ? '16px' : '32px' },
        card: { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' },
        cardImageWrap: { position: 'relative', overflow: 'hidden' },
        cardImage: { width: '100%', height: isMobile ? '150px' : '200px', objectFit: 'cover', background: '#f5f5f5', display: 'block' },
        quickAddBtn: { position: 'absolute', bottom: '10px', right: '10px', width: '36px', height: '36px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'all 0.3s' },
        cardContent: { padding: isMobile ? '12px' : '16px' },
        cardCategory: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
        cardName: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#222', marginBottom: '8px', lineHeight: '1.3' },
        cardPrice: { fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#6B2346' },
        cardOldPrice: { fontSize: '13px', color: '#999', textDecoration: 'line-through', marginLeft: '8px' },
        loading: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
        empty: { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px' },
        emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '12px' },
        emptyText: { fontSize: '15px', color: '#666', marginBottom: '24px' },
        pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px' },
        pageBtn: { padding: '10px 16px', background: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ddd', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
        pageBtnActive: { background: '#6B2346', color: '#fff', borderColor: '#6B2346' },
        pageBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
        btn: { display: 'inline-block', padding: '14px 32px', background: '#6B2346', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' },
        mobileCategories: { display: isMobile ? 'flex' : 'none', gap: '10px', overflowX: 'scroll', overflowY: 'hidden', padding: '4px 0 16px 0', marginBottom: '16px', marginLeft: '-20px', marginRight: '-20px', paddingLeft: '20px', paddingRight: '20px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' },
        mobileCategoryChip: { flexShrink: 0, padding: '10px 20px', background: '#fff', borderWidth: '2px', borderStyle: 'solid', borderColor: '#e5e5e5', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#555', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
        mobileCategoryChipActive: { background: '#6B2346', color: '#fff', borderColor: '#6B2346' }
    }

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div style={{ position: 'absolute', top: '20px', right: '60px', fontSize: '90px', opacity: 0.06 }}>🧁</div>
                <div style={{ position: 'absolute', bottom: '10px', left: '40px', fontSize: '70px', opacity: 0.05 }}>🎂</div>
                <div style={{ ...styles.container, position: 'relative', zIndex: 1 }}>
                    <nav style={styles.breadcrumb}>
                        <Link to="/" style={styles.breadcrumbLink}>Home</Link>
                        <span>/</span>
                        <span>Products</span>
                    </nav>
                    <h1 style={styles.title}>
                        {searchQuery ? `Search: "${searchQuery}"` : showSale ? 'Sale Products' : showNew ? 'New Arrivals' : 'All Products'}
                    </h1>
                    <p style={styles.count}>{totalProducts} products found</p>
                </div>
            </div>

            <div style={styles.container}>
                <div style={styles.layout}>
                    {/* Sidebar */}
                    <aside style={styles.sidebar}>
                        {isMobile && (
                            <div style={styles.closeFilters}>
                                <h3 style={{ margin: 0, fontSize: '18px' }}>Filters</h3>
                                <button style={styles.closeBtn} onClick={() => setShowFilters(false)}>Apply</button>
                            </div>
                        )}
                        <div style={styles.filterSection}>
                            <h3 style={styles.filterTitle}>Categories</h3>
                            <ul style={styles.filterList}>
                                <li>
                                    <button style={{ ...styles.filterItem, ...(!selectedCategory ? styles.filterItemActive : {}) }} onClick={() => handleCategoryChange('')}>
                                        All Products
                                    </button>
                                </li>
                                {categories.map(cat => {
                                    const catId = cat.id || cat._id
                                    return (
                                        <li key={catId}>
                                            <button style={{ ...styles.filterItem, ...(selectedCategory === cat.slug ? styles.filterItemActive : {}) }} onClick={() => handleCategoryChange(cat.slug)}>
                                                {cat.name}
                                                {cat.productCount > 0 && <span style={styles.filterCount}>({cat.productCount})</span>}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                        <div style={styles.filterSection}>
                            <h3 style={styles.filterTitle}>Quick Filters</h3>
                            <ul style={styles.filterList}>
                                <li><Link to="/products?sale=true" style={{ ...styles.filterItem, ...(showSale ? styles.filterItemActive : {}) }}>On Sale</Link></li>
                                <li><Link to="/products?new=true" style={{ ...styles.filterItem, ...(showNew ? styles.filterItemActive : {}) }}>New Arrivals</Link></li>
                            </ul>
                        </div>
                    </aside>

                    {/* Main */}
                    <main style={styles.main}>
                        <div style={styles.toolbar}>
                            <button style={styles.filterBtn} onClick={() => setShowFilters(true)}>
                                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" /></svg>
                                Filters
                            </button>
                            <div style={styles.toolbarInfo}>
                                Showing {Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)} - {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts}
                            </div>
                            <div style={styles.toolbarSort}>
                                <label style={styles.sortLabel}>Sort by:</label>
                                <select style={styles.sortSelect} value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name">Name A-Z</option>
                                </select>
                            </div>
                        </div>

                        {/* Mobile Category Chips - Always Visible */}
                        <div style={styles.mobileCategories}>
                            <button
                                style={{ ...styles.mobileCategoryChip, ...(!selectedCategory ? styles.mobileCategoryChipActive : {}) }}
                                onClick={() => handleCategoryChange('')}
                            >
                                All
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat._id}
                                    style={{ ...styles.mobileCategoryChip, ...(selectedCategory === cat._id ? styles.mobileCategoryChipActive : {}) }}
                                    onClick={() => handleCategoryChange(cat._id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div style={styles.loading}><p>Loading...</p></div>
                        ) : products.length === 0 ? (
                            <div style={styles.empty}>
                                <h3 style={styles.emptyTitle}>No products found</h3>
                                <p style={styles.emptyText}>Try adjusting your filters</p>
                                <Link to="/products" style={styles.btn}>View All Products</Link>
                            </div>
                        ) : (
                            <div style={styles.grid}>
                                {products.map(product => (
                                    <ProductCard
                                        key={product.id || product._id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div style={styles.pagination}>
                                <button style={{ ...styles.pageBtn, ...(currentPage === 1 ? styles.pageBtnDisabled : {}) }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                    Prev
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let page = i + 1
                                    if (totalPages > 5) {
                                        if (currentPage <= 3) page = i + 1
                                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                                        else page = currentPage - 2 + i
                                    }
                                    return (
                                        <button key={page} style={{ ...styles.pageBtn, ...(currentPage === page ? styles.pageBtnActive : {}) }} onClick={() => setCurrentPage(page)}>
                                            {page}
                                        </button>
                                    )
                                })}
                                <button style={{ ...styles.pageBtn, ...(currentPage === totalPages ? styles.pageBtnDisabled : {}) }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                    Next
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default Products
