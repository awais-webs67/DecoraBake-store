import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import SearchOverlay from './SearchOverlay'
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

function Header() {
    const [categories, setCategories] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [categoryHover, setCategoryHover] = useState(false)
    const [settings, setSettings] = useState({
        siteLogo: '/logo.png',
        announcementText: '🎂 Free Australia-Wide Shipping on Orders Over $149!',
        announcementEnabled: true
    })
    const { getCartCount, setCartDrawerOpen } = useCart()
    const { count: wishlistCount } = useWishlist()
    const cartCount = getCartCount()
    const navigate = useNavigate()
    const location = useLocation()
    const width = useWindowSize()
    const isMobile = width < 768

    // Reset states when route changes
    useEffect(() => {
        setMobileMenuOpen(false)
        setCategoryOpen(false)
        setCategoryHover(false)
    }, [location.pathname])

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/categories`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCategories(data.filter(c => c.showInNav))
            })
            .catch(console.error)

        fetch(`${API_BASE_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                if (data) setSettings(prev => ({ ...prev, ...data }))
            })
            .catch(console.error)
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
            setSearchQuery('')
            setMobileMenuOpen(false)
        }
    }

    // Show dropdown: on mobile when clicked, on desktop when hovered
    const showDropdown = isMobile ? categoryOpen : categoryHover

    const styles = {
        header: { position: 'sticky', top: 0, zIndex: 1000, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
        announcement: { background: '#6B2346', color: '#fff', textAlign: 'center', padding: '10px 20px', fontSize: isMobile ? '12px' : '13px', fontWeight: '500' },
        mainHeader: { padding: isMobile ? '12px 0' : '16px 0', borderBottom: '1px solid #eee' },
        inner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? '12px' : '24px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px', flexWrap: isMobile ? 'wrap' : 'nowrap' },
        logo: { height: isMobile ? '40px' : '55px', width: 'auto' },
        searchForm: { flex: isMobile ? '1 0 100%' : 1, maxWidth: isMobile ? 'none' : '500px', display: 'flex', border: '2px solid #e5e5e5', borderRadius: '50px', overflow: 'hidden', order: isMobile ? 3 : 0, marginTop: isMobile ? '12px' : 0 },
        searchInput: { flex: 1, padding: isMobile ? '10px 16px' : '12px 20px', border: 'none', fontSize: '14px', background: 'transparent', outline: 'none' },
        searchBtn: { padding: isMobile ? '10px 14px' : '12px 20px', background: '#6B2346', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' },
        actions: { display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px' },
        action: { display: 'flex', alignItems: 'center', gap: '8px', color: '#333', fontSize: '14px', fontWeight: '500', textDecoration: 'none' },
        actionCart: { position: 'relative', background: '#FCE8ED', padding: isMobile ? '8px 12px' : '10px 16px', borderRadius: '8px', color: '#6B2346' },
        cartCount: { position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: '#6B2346', color: '#fff', fontSize: '11px', fontWeight: '700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        mobileToggle: { display: isMobile ? 'flex' : 'none', padding: '8px', color: '#333', background: 'none', border: 'none', cursor: 'pointer' },
        nav: { display: mobileMenuOpen || !isMobile ? 'block' : 'none', background: isMobile ? '#fff' : '#f8f8f8', borderBottom: '1px solid #eee', position: isMobile ? 'absolute' : 'relative', top: isMobile ? '100%' : 'auto', left: 0, right: 0, boxShadow: isMobile ? '0 10px 30px rgba(0,0,0,0.1)' : 'none', zIndex: 100, maxHeight: isMobile ? '60vh' : 'none', overflowY: isMobile ? 'auto' : 'visible' },
        navContainer: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        navList: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', listStyle: 'none', margin: 0, padding: 0 },
        navItem: { padding: isMobile ? '14px 0' : '14px 20px', fontSize: '14px', fontWeight: '500', color: '#444', cursor: 'pointer', borderBottom: isMobile ? '1px solid #f0f0f0' : 'none' },
        navLink: { color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' },
        navSale: { color: '#e53935' },
        categoryWrapper: { position: 'relative' },
        dropdown: {
            position: isMobile ? 'relative' : 'absolute',
            top: isMobile ? 0 : '100%',
            left: 0,
            minWidth: '200px',
            background: '#fff',
            border: isMobile ? 'none' : '1px solid #e5e5e5',
            borderRadius: isMobile ? 0 : '8px',
            boxShadow: isMobile ? 'none' : '0 10px 30px rgba(0,0,0,0.1)',
            listStyle: 'none',
            padding: isMobile ? '0 0 0 20px' : '8px 0',
            display: showDropdown ? 'block' : 'none',
            zIndex: 100
        },
        dropdownItem: { padding: '10px 20px', fontSize: '14px' },
        dropdownLink: { color: '#444', textDecoration: 'none', display: 'block' }
    }

    return (
        <header style={styles.header}>
            {/* Announcement */}
            {settings.announcementEnabled && (
                <div style={styles.announcement}>{settings.announcementText}</div>
            )}

            {/* Main Header */}
            <div style={styles.mainHeader}>
                <div style={styles.inner}>
                    <Link to="/"><img src={settings.siteLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.siteLogo}` : (settings.siteLogo || '/logo.png')} alt="DecoraBake" style={styles.logo} /></Link>

                    <div style={styles.searchForm} onClick={() => setSearchOpen(true)}>
                        <input type="text" style={styles.searchInput} placeholder={isMobile ? "Search..." : "Search for cake supplies..."} readOnly onFocus={() => setSearchOpen(true)} />
                        <button type="button" style={styles.searchBtn} onClick={(e) => { e.stopPropagation(); setSearchOpen(true) }}>
                            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                        </button>
                    </div>

                    <div style={styles.actions}>
                        <Link to="/account" style={styles.action}>
                            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                            {!isMobile && <span>Account</span>}
                        </Link>
                        <Link to="/wishlist" style={styles.action} title="Wishlist">
                            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                            {wishlistCount > 0 && <span style={styles.cartCount}>{wishlistCount}</span>}
                        </Link>
                        <button 
                            onClick={() => setCartDrawerOpen(true)}
                            style={{ 
                                ...styles.action, 
                                ...styles.actionCart,
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                            {!isMobile && <span>Cart</span>}
                            {cartCount > 0 && <span style={styles.cartCount}>{cartCount}</span>}
                        </button>
                        <button style={styles.mobileToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d={mobileMenuOpen ? "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" : "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"} />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={styles.nav}>
                <div style={styles.navContainer}>
                    <ul style={styles.navList}>
                        <li style={styles.navItem}><Link to="/" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
                        <li style={styles.navItem}><Link to="/products" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Shop All</Link></li>
                        <li
                            style={{ ...styles.navItem, ...styles.categoryWrapper }}
                            onMouseEnter={() => !isMobile && setCategoryHover(true)}
                            onMouseLeave={() => !isMobile && setCategoryHover(false)}
                        >
                            <span style={styles.navLink} onClick={() => isMobile && setCategoryOpen(!categoryOpen)}>
                                Categories
                                <svg viewBox="0 0 24 24" width="16" height="16" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                                </svg>
                            </span>
                            <ul style={styles.dropdown}>
                                {categories.map(cat => (
                                    <li key={cat.id} style={styles.dropdownItem}>
                                        <Link to={`/category/${cat.slug}`} style={styles.dropdownLink} onClick={() => { setMobileMenuOpen(false); setCategoryOpen(false); setCategoryHover(false); }}>
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li style={styles.navItem}><Link to="/products?sale=true" style={{ ...styles.navLink, ...styles.navSale }} onClick={() => setMobileMenuOpen(false)}>Sale</Link></li>
                        <li style={styles.navItem}><Link to="/products?new=true" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>New Arrivals</Link></li>
                        {isMobile && (
                            <li style={styles.navItem}>
                                <Link to="/account" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
                                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                    My Account
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </nav>

            {/* Search Overlay */}
            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </header>
    )
}

export default Header

