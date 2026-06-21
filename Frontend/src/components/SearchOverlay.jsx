import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { trackSearch } from './Analytics'
import API_BASE_URL from '../config/api'

/**
 * Full-screen search overlay with instant results
 * Triggered from the Header's search icon
 */
function SearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState([])
    const inputRef = useRef(null)
    const navigate = useNavigate()
    const debounceRef = useRef(null)

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            // Load recent searches
            try {
                const saved = JSON.parse(localStorage.getItem('db_recent_searches') || '[]')
                setRecentSearches(saved)
            } catch { }
        } else {
            setQuery('')
            setResults([])
        }
    }, [isOpen])

    // Close on escape
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose()
        if (isOpen) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!query || query.length < 2) { setResults([]); return }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data)
            } catch { setResults([]) }
            setLoading(false)
        }, 300)
    }, [query])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!query.trim()) return
        // Save to recent searches
        const recent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
        localStorage.setItem('db_recent_searches', JSON.stringify(recent))
        trackSearch(query)
        navigate(`/products?search=${encodeURIComponent(query)}`)
        onClose()
    }

    const handleProductClick = () => {
        if (query) {
            const recent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
            localStorage.setItem('db_recent_searches', JSON.stringify(recent))
            trackSearch(query)
        }
        onClose()
    }

    const clearRecent = () => {
        localStorage.removeItem('db_recent_searches')
        setRecentSearches([])
    }

    return (
        <div className="search-overlay" style={{ ...styles.overlay, display: isOpen ? 'block' : 'none' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="search-overlay-container" style={styles.container}>
                {/* Search Input */}
                <form onSubmit={handleSubmit} className="search-overlay-form" style={styles.searchForm}>
                    <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6B2346' }} title="Search">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={styles.searchIcon}>
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for products..."
                        className="search-overlay-input"
                        style={styles.input}
                        autoFocus={isOpen}
                    />
                    <button type="button" onClick={onClose} style={styles.closeBtn}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </form>

                {/* Results */}
                <div className="search-overlay-results" style={styles.resultsContainer}>
                    {loading && (
                        <div style={styles.loading}>
                            <div style={styles.spinner} />
                            <span>Searching...</span>
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div style={styles.noResults}>
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ddd" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <p style={{ marginTop: '16px', color: '#888' }}>No products found for "{query}"</p>
                            <p style={{ color: '#aaa', fontSize: '14px' }}>Try different keywords or browse our categories</p>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <>
                            <p style={styles.resultsCount}>{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                            <div style={styles.resultsGrid}>
                                {results.map(product => {
                                    const pId = product._id || product.id
                                    const img = product.image || product.images?.[0] || '/placeholder.svg'
                                    const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price
                                    return (
                                        <Link key={pId} to={`/product/${pId}`} style={styles.resultCard} onClick={handleProductClick}>
                                            <img src={img} alt={product.name} style={styles.resultImage} loading="lazy" onError={(e) => e.target.src = '/placeholder.svg'} />
                                            <div style={styles.resultInfo}>
                                                {product.category && <span style={styles.resultCategory}>{product.category}</span>}
                                                <h4 style={styles.resultName}>{product.name}</h4>
                                                <div style={styles.resultPriceRow}>
                                                    <span style={styles.resultPrice}>${(hasDiscount ? product.salePrice : product.price)?.toFixed(2)}</span>
                                                    {hasDiscount && <span style={styles.resultOldPrice}>${product.price.toFixed(2)}</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {/* Recent Searches */}
                    {!query && recentSearches.length > 0 && (
                        <div style={styles.recentSection}>
                            <div style={styles.recentHeader}>
                                <span style={{ fontSize: '13px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Searches</span>
                                <button onClick={clearRecent} style={styles.clearBtn}>Clear</button>
                            </div>
                            <div style={styles.recentList}>
                                {recentSearches.map((s, i) => (
                                    <button key={i} onClick={() => setQuery(s)} style={styles.recentItem}>
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#aaa" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Popular Suggestions when no query */}
                    {!query && recentSearches.length === 0 && (
                        <div style={styles.suggestions}>
                            <p style={{ fontSize: '13px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Popular Searches</p>
                            {['Fondant', 'Sprinkles', 'Cake Toppers', 'Piping Tips', 'Food Colouring'].map(term => (
                                <button key={term} onClick={() => setQuery(term)} style={styles.suggestionBtn}>{term}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                
                @media (max-width: 768px) {
                    .search-overlay-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 100% !important;
                        max-height: 100vh !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }
                    .search-overlay-form {
                        padding: 14px 16px !important;
                    }
                    .search-overlay-results {
                        padding: 14px 16px !important;
                    }
                    .search-overlay-input {
                        font-size: 16px !important;
                    }
                }
            `}</style>
        </div>
    )
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(4px)' },
    container: { maxWidth: '680px', width: '90%', margin: '60px auto 0', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'slideDown 0.3s ease', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
    searchForm: { display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f0f0f0', gap: '12px' },
    searchIcon: { flexShrink: 0 },
    input: { flex: 1, border: 'none', outline: 'none', fontSize: '18px', fontWeight: '400', color: '#222', background: 'transparent' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px', display: 'flex' },
    resultsContainer: { overflow: 'auto', padding: '20px 24px', flex: 1 },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px 0', color: '#888' },
    spinner: { width: '20px', height: '20px', border: '3px solid #eee', borderTopColor: '#6B2346', borderRadius: '50%', animation: 'spin 0.6s linear infinite' },
    noResults: { textAlign: 'center', padding: '40px 0' },
    resultsCount: { fontSize: '13px', color: '#888', marginBottom: '16px' },
    resultsGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    resultCard: { display: 'flex', gap: '16px', padding: '12px', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s', background: '#fafafa' },
    resultImage: { width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 },
    resultInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    resultCategory: { fontSize: '11px', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
    resultName: { fontSize: '15px', fontWeight: '600', color: '#222', margin: '0 0 6px', lineHeight: '1.3' },
    resultPriceRow: { display: 'flex', gap: '8px', alignItems: 'center' },
    resultPrice: { fontSize: '16px', fontWeight: '700', color: '#6B2346' },
    resultOldPrice: { fontSize: '13px', color: '#999', textDecoration: 'line-through' },
    recentSection: {},
    recentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    clearBtn: { background: 'none', border: 'none', color: '#6B2346', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    recentList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    recentItem: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f5f5f5', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', color: '#555' },
    suggestions: {},
    suggestionBtn: { display: 'inline-block', margin: '0 8px 8px 0', padding: '10px 18px', background: '#f8f0f4', border: '1px solid #f0dde5', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', color: '#6B2346', fontWeight: '500' }
}

export default SearchOverlay
