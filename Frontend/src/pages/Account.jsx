import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import API_BASE_URL from '../config/api';

// Account Tab Components
import OrdersTab from '../components/account/OrdersTab';
import RefundsTab from '../components/account/RefundsTab';
import SettingsTab from '../components/account/SettingsTab';
import ReviewsTab from '../components/account/ReviewsTab';
import ChatTab from '../components/account/ChatTab';

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
}

function Account() {
    const { user, isLoggedIn, login, register, logout, getUserOrders, token } = useUser();
    const { items, getCartTotal, getCartCount } = useCart();

    // Core Layout State
    const [activeTab, setActiveTab] = useState('orders');
    const [authTab, setAuthTab] = useState('login');
    const width = useWindowSize();
    const isMobile = width < 768;

    // Login/Auth State
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Data passed to ChatTab
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [unreadChats, setUnreadChats] = useState(0);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (user) {
            getUserOrders().then(setOrders);
            fetchChats();
            fetch(`${API_BASE_URL}/api/products`)
                .then(r => r.json())
                .then(setProducts)
                .catch(() => { });

            const interval = setInterval(fetchChats, 3000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchChats = async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/support-chats/customer/${user.email}`);
            const data = await res.json();
            setChats(data || []);
            const unread = data.reduce((sum, c) => sum + (c.unreadCustomer || 0), 0);
            setUnreadChats(unread);

            if (selectedChat) {
                const updated = data.find(c => c.id === selectedChat.id || c._id === selectedChat._id);
                if (updated) setSelectedChat(updated);
            }
        } catch (err) { }
    };

    const createNewChat = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/support-chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
                    subject: 'Support Request'
                })
            });
            const data = await res.json();
            setSelectedChat(data);
            fetchChats();
        } catch (err) { }
    };

    const markChatAsRead = async (chatId) => {
        try {
            await fetch(`${API_BASE_URL}/api/support-chats/${chatId}/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readBy: 'customer' })
            });
            fetchChats();
        } catch (err) { }
    };

    // Auth Handlers
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(loginData.email, loginData.password);
        if (!result.success) setError(result.error);
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (registerData.password !== registerData.confirmPassword) { setError('Passwords do not match'); return; }
        if (registerData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        const result = await register(registerData);
        if (!result.success) setError(result.error);
        setLoading(false);
    };

    const navItems = [
        { id: 'orders', label: 'My Orders', icon: '📦' },
        { id: 'refunds', label: 'Refunds', icon: '💰' },
        { id: 'reviews', label: 'Reviews', icon: '⭐' },
        { id: 'support', label: 'Chat Support', icon: '💬', badge: unreadChats },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'cart', label: 'Cart', icon: '🛒', mobileOnly: true, badge: getCartCount() }
    ];

    const styles = {
        container: { maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 24px', fontFamily: "'Inter', sans-serif" },

        // Auth Styles
        authWrapper: { maxWidth: '440px', margin: '40px auto', background: '#fff', borderRadius: '32px', padding: isMobile ? '32px 24px' : '48px', boxShadow: '0 24px 48px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', boxSizing: 'border-box' },
        authHeader: { textAlign: 'center', marginBottom: '32px' },
        authTitle: { fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 8px 0' },
        authSubtitle: { fontSize: '15px', color: '#666', margin: 0 },
        authTabs: { display: 'flex', background: '#f5f5f5', borderRadius: '16px', padding: '6px', marginBottom: '32px' },
        authTabBtn: (active) => ({ flex: 1, padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '14px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: active ? '#fff' : 'transparent', color: active ? '#1a1a1a' : '#666', border: 'none', boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }),
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
        input: { width: '100%', padding: '16px', border: '2px solid #efefef', borderRadius: '16px', fontSize: '15px', color: '#1a1a1a', transition: 'all 0.2s', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' },
        btnSubmit: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6B2346 0%, #8B3A5E 100%)', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(107,35,70,0.25)', marginTop: '8px', boxSizing: 'border-box' },
        authError: { background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #FECDD3' },

        // Dashboard Layout
        dashboardGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: isMobile ? '24px' : '40px', alignItems: 'flex-start' },

        // Sidebar Navigation
        sidebar: { background: '#fff', borderRadius: '24px', padding: isMobile ? '0' : '24px 16px', border: isMobile ? 'none' : '1px solid #f0f0f0', boxShadow: isMobile ? 'none' : '0 12px 32px rgba(0,0,0,0.03)', position: 'sticky', top: '40px' },
        profileCard: { textAlign: 'center', padding: isMobile ? '20px' : '0 16px 24px', borderBottom: isMobile ? 'none' : '1px solid #f0f0f0', marginBottom: isMobile ? '0' : '16px', background: isMobile ? '#fff' : 'transparent', borderRadius: isMobile ? '24px' : '0', border: isMobile ? '1px solid #f0f0f0' : 'none', boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.03)' : 'none' },
        avatar: { width: isMobile ? '64px' : '88px', height: isMobile ? '64px' : '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #6B2346 0%, #4A1530 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '24px' : '32px', fontWeight: '700', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(107,35,70,0.2)' },
        userName: { fontSize: '20px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
        userEmail: { fontSize: '14px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' },

        navMenu: { display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? '12px' : '4px', overflowX: isMobile ? 'auto' : 'visible', padding: isMobile ? '4px' : '0', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' },
        navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', padding: isMobile ? '12px 20px' : '14px 20px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', background: active ? '#FDF2F5' : 'transparent', color: active ? '#6B2346' : '#666', fontWeight: active ? '700' : '600', fontSize: '15px', whiteSpace: 'nowrap', position: 'relative' }),
        navBadge: { background: '#EF4444', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px', marginLeft: 'auto' },
        sidebarLogout: { padding: '14px 20px', color: '#DC2626', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '16px', marginTop: '16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', boxSizing: 'border-box' },

        // Cart Item override styling
        cartItem: { display: 'flex', gap: '16px', padding: '16px', background: '#FAFAFA', borderRadius: '16px', marginBottom: '12px' },
        cartImage: { width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' },
        cartName: { fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' },
        cartPrice: { color: '#6B2346', fontWeight: '600' }
    };

    if (!isLoggedIn) {
        return (
            <div style={styles.container}>
                <div style={styles.authWrapper}>
                    <div style={styles.authHeader}>
                        <h1 style={styles.authTitle}>Welcome</h1>
                        <p style={styles.authSubtitle}>Sign in to track orders and manage refunds</p>
                    </div>

                    <div style={styles.authTabs}>
                        <button style={styles.authTabBtn(authTab === 'login')} onClick={() => setAuthTab('login')}>Sign In</button>
                        <button style={styles.authTabBtn(authTab === 'register')} onClick={() => setAuthTab('register')}>Create Account</button>
                    </div>

                    {error && (
                        <div style={styles.authError}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    {authTab === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email Address</label>
                                <input type="email" style={styles.input} value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} required onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Password</label>
                                <input type="password" style={styles.input} value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                                <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                    <Link to="/forgot-password" style={{ fontSize: '12px', color: '#6B2346', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</Link>
                                </div>
                            </div>
                            <button type="submit" style={{ ...styles.btnSubmit, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '0' : '16px' }}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>First Name</label>
                                    <input type="text" style={styles.input} value={registerData.firstName} onChange={e => setRegisterData({ ...registerData, firstName: e.target.value })} required onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Last Name</label>
                                    <input type="text" style={styles.input} value={registerData.lastName} onChange={e => setRegisterData({ ...registerData, lastName: e.target.value })} required onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email Address</label>
                                <input type="email" style={styles.input} value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} required onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Password</label>
                                <input type="password" style={styles.input} value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} required minLength="6" onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Confirm Password</label>
                                <input type="password" style={styles.input} value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })} required minLength="6" onFocus={(e) => Object.assign(e.target.style, { borderColor: '#1a1a1a', background: '#fff' })} onBlur={(e) => Object.assign(e.target.style, { borderColor: '#efefef', background: '#FAFAFA' })} />
                            </div>
                            <button type="submit" style={{ ...styles.btnSubmit, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    if (!user) return <div style={styles.container}>Loading dashboard...</div>;

    return (
        <div style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 100px)' }}>
            <div style={styles.container}>
                <div style={styles.dashboardGrid}>

                    {/* Navigation Sidebar */}
                    <div style={{ minWidth: 0 }}>
                        <div style={styles.profileCard}>
                            <div style={styles.avatar}>{user.firstName?.charAt(0) || 'U'}</div>
                            <h2 style={styles.userName}>{user.firstName} {user.lastName}</h2>
                            <p style={styles.userEmail}>{user.email}</p>
                        </div>

                        <div style={styles.sidebar}>
                            <div style={styles.navMenu}>
                                {navItems.map(item => {
                                    if (item.mobileOnly && !isMobile) return null;
                                    return (
                                        <div
                                            key={item.id}
                                            style={styles.navItem(activeTab === item.id)}
                                            onClick={() => setActiveTab(item.id)}
                                            onMouseEnter={(e) => {
                                                if (activeTab !== item.id) e.currentTarget.style.background = '#f5f5f5';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (activeTab !== item.id) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                                            {item.label}
                                            {item.badge > 0 && <span style={styles.navBadge}>{item.badge}</span>}
                                        </div>
                                    );
                                })}
                                {!isMobile && (
                                    <button
                                        style={styles.sidebarLogout}
                                        onClick={logout}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                        Sign Out
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile view Logout button at bottom of nav pills */}
                        {isMobile && (
                            <div style={{ marginTop: '16px', padding: '0 16px' }}>
                                <button style={{ ...styles.sidebarLogout, background: '#fff', border: '1px solid #fee2e2' }} onClick={logout}>Sign Out</button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div style={{ minWidth: 0 }}>
                        {activeTab === 'orders' && <OrdersTab isMobile={isMobile} />}
                        {activeTab === 'refunds' && <RefundsTab isMobile={isMobile} />}
                        {activeTab === 'settings' && <SettingsTab isMobile={isMobile} />}
                        {activeTab === 'reviews' && <ReviewsTab isMobile={isMobile} />}
                        {activeTab === 'support' && (
                            <ChatTab
                                isMobile={isMobile}
                                user={user}
                                chats={chats}
                                selectedChat={selectedChat}
                                setSelectedChat={setSelectedChat}
                                unreadChats={unreadChats}
                                fetchChats={fetchChats}
                                createNewChat={createNewChat}
                                markChatAsRead={markChatAsRead}
                                products={products}
                                orders={orders}
                            />
                        )}

                        {/* Preserved cart view for mobile */}
                        {activeTab === 'cart' && isMobile && (
                            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>My Cart ({getCartCount()} items)</h2>
                                {items.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>Your cart is empty</div>
                                ) : (
                                    <>
                                        {items.map(item => (
                                            <div key={item.id} style={styles.cartItem}>
                                                <img src={item.image || '/placeholder.svg'} alt={item.name} style={styles.cartImage} />
                                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={styles.cartName}>{item.name}</div>
                                                    <div style={styles.cartPrice}>${(item.salePrice || item.price)?.toFixed(2)} x {item.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ padding: '16px', background: '#FAFAFA', borderRadius: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
                                            <span>Total:</span><span style={{ color: '#6B2346' }}>${getCartTotal().toFixed(2)} AUD</span>
                                        </div>
                                        <Link to="/cart" style={{ display: 'block', padding: '16px', background: '#1a1a1a', color: '#fff', textAlign: 'center', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', marginTop: '16px' }}>View Cart & Checkout</Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Account;
