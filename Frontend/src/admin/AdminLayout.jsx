import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function AdminLayout() {
    const { isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const width = useWindowSize()
    const isMobile = width < 1024

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/admin/login')
        }
    }, [isAuthenticated, navigate])

    // Close sidebar on route change on mobile
    useEffect(() => {
        if (isMobile) setSidebarOpen(false)
    }, [location.pathname, isMobile])

    const handleLogout = () => {
        logout()
        navigate('/admin/login')
    }

    const menuItems = [
        { path: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
        { path: '/admin/products', icon: 'products', label: 'Products' },
        { path: '/admin/categories', icon: 'categories', label: 'Categories' },
        { path: '/admin/orders', icon: 'orders', label: 'Orders' },
        { path: '/admin/customers', icon: 'customers', label: 'Customers' },
        { divider: true },
        { path: '/admin/slider', icon: 'slider', label: 'Hero Slider' },
        { path: '/admin/sections', icon: 'sections', label: 'Page Sections' },
        { path: '/admin/pages', icon: 'pages', label: 'Pages & Blog' },
        { path: '/admin/testimonials', icon: 'testimonials', label: 'Testimonials' },
        { divider: true },
        { path: '/admin/support', icon: 'support', label: 'Support Chats' },
        { path: '/admin/refunds', icon: 'refunds', label: 'Refund Requests' },
        { path: '/admin/promo-codes', icon: 'promo', label: 'Promo Codes' },
        { path: '/admin/newsletter', icon: 'newsletter', label: 'Newsletter' },
        { path: '/admin/email-templates', icon: 'email-templates', label: 'Email Templates' },
        { path: '/admin/settings', icon: 'settings', label: 'Site Settings' },
        { path: '/admin/diagnostics', icon: 'diagnostics', label: 'Diagnostics' },
    ]

    const styles = {
        layout: { display: 'flex', minHeight: '100vh', background: '#f5f5f5' },
        sidebar: {
            width: sidebarOpen ? '260px' : '0px',
            background: '#1a1a2e',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            position: isMobile ? 'fixed' : 'relative',
            top: 0, left: 0, bottom: 0,
            zIndex: 100,
            boxShadow: isMobile && sidebarOpen ? '0 0 50px rgba(0,0,0,0.3)' : 'none'
        },
        sidebarInner: {
            width: '260px',
            padding: '20px 0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
        },
        sidebarHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '10px'
        },
        logo: { display: 'flex', alignItems: 'center', gap: '12px' },
        logoImg: { height: '36px' },
        logoText: { color: '#fff', fontSize: '16px', fontWeight: '700' },
        closeBtn: {
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
        },
        menu: { flex: 1, padding: '0 12px', overflowY: 'auto' },
        menuItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '500', textDecoration: 'none', marginBottom: '4px', transition: 'all 0.2s' },
        menuItemActive: { background: 'rgba(107,35,70,0.3)', color: '#fff' },
        divider: { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 20px' },
        main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
        header: { background: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5' },
        menuToggle: { padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#333' },
        headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
        viewSite: { padding: '8px 16px', background: '#6B2346', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
        logoutBtn: { padding: '8px 16px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
        content: { flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto' },
        overlay: { display: isMobile && sidebarOpen ? 'block' : 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }
    }

    // Don't render if not authenticated
    if (!isAuthenticated) return null

    return (
        <div style={styles.layout}>
            {/* Overlay for mobile */}
            <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarInner}>
                    {/* Sidebar Header with Logo and Close Button */}
                    <div style={styles.sidebarHeader}>
                        <div style={styles.logo}>
                            <img src="/logo.png" alt="DecoraBake" style={styles.logoImg} />
                            <span style={styles.logoText}>Admin</span>
                        </div>
                        <button style={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>

                    <nav style={styles.menu}>
                        {menuItems.map((item, index) =>
                            item.divider ? (
                                <div key={index} style={styles.divider} />
                            ) : (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        ...styles.menuItem,
                                        ...(item.exact
                                            ? location.pathname === item.path ? styles.menuItemActive : {}
                                            : location.pathname.startsWith(item.path) ? styles.menuItemActive : {})
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        {item.icon === 'dashboard' && <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />}
                                        {item.icon === 'products' && <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />}
                                        {item.icon === 'categories' && <path d="M12 2l-5.5 9h11z M17.5 13h-11l5.5 9z" />}
                                        {item.icon === 'orders' && <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />}
                                        {item.icon === 'customers' && <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />}
                                        {item.icon === 'slider' && <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />}
                                        {item.icon === 'sections' && <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />}
                                        {item.icon === 'pages' && <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />}
                                        {item.icon === 'testimonials' && <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />}
                                        {item.icon === 'support' && <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />}
                                        {item.icon === 'refunds' && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />}
                                        {item.icon === 'promo' && <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />}
                                        {item.icon === 'settings' && <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />}
                                        {item.icon === 'diagnostics' && <path d="M7 5h10v2H7V5zm0 8v-3h3v3H7zm4 0v-3h3v3h-3zm-4 5v-3h3v3H7zm4 0v-3h3v3h-3zm4-5v-3h3v3h-3zm0 5v-3h3v3h-3zm0-13h3v3h-3V5z" />}
                                        {item.icon === 'newsletter' && <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />}
                                        {item.icon === 'email-templates' && <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />}
                                    </svg>
                                    {item.label}
                                </Link>
                            )
                        )}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div style={styles.main}>
                <header style={styles.header}>
                    <button style={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
                    </button>
                    <div style={styles.headerRight}>
                        <Link to="/" style={styles.viewSite} target="_blank">View Site</Link>
                        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                    </div>
                </header>
                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
