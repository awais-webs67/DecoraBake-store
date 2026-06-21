import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import API_BASE_URL from '../config/api'

function Footer() {
    const [email, setEmail] = useState('')
    const [settings, setSettings] = useState({})

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => { if (data) setSettings(data) })
            .catch(console.error)
    }, [])

    const { showToast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (email) {
            try {
                await fetch(`${API_BASE_URL}/api/newsletter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                })
            } catch { }
            showToast('Thank you for subscribing! 🎉', 'success')
            setEmail('')
        }
    }

    const logoUrl = settings.footerLogo?.startsWith('/uploads')
        ? `${API_BASE_URL}${settings.footerLogo}`
        : (settings.footerLogo || '/logo.png')

    const socials = [
        { key: 'facebook', url: settings.socialFacebook, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg> },
        { key: 'instagram', url: settings.socialInstagram, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /></svg> },
        { key: 'pinterest', url: settings.socialPinterest, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2Z" /></svg> },
        { key: 'twitter', url: settings.socialTwitter, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.205 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.044 19.77h1.833L7.045 4.126H5.078Z" /></svg> },
        { key: 'youtube', url: settings.socialYoutube, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" /></svg> },
        { key: 'tiktok', url: settings.socialTiktok, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" /></svg> }
    ].filter(s => s.url && s.url.trim())

    return (
        <footer style={{ background: '#111', color: '#999', paddingTop: '48px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>

                {/* Newsletter */}
                <div style={{ textAlign: 'center', paddingBottom: '40px', borderBottom: '1px solid #222', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '8px', fontWeight: '600' }}>Stay Updated</h3>
                    <p style={{ fontSize: '14px', marginBottom: '20px' }}>Get exclusive offers and baking tips</p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', maxWidth: '400px', margin: '0 auto', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} required
                            style={{ flex: '1 1 220px', padding: '12px 18px', border: '1px solid #333', borderRadius: '6px', background: '#1a1a1a', color: '#fff', fontSize: '14px' }} />
                        <button type="submit" style={{ padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Subscribe</button>
                    </form>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', paddingBottom: '40px' }}>

                    {/* Brand */}
                    <div>
                        <Link to="/"><img src={logoUrl} alt="Logo" style={{ height: '40px', marginBottom: '16px' }} /></Link>
                        <p style={{ fontSize: '13px', lineHeight: '1.7', marginBottom: '16px' }}>Premium cake decorating supplies delivered Australia-wide.</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {socials.length > 0 ? socials.map(s => (
                                <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                                    style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.target.style.background = '#6B2346'; e.target.style.color = '#fff' }}
                                    onMouseLeave={e => { e.target.style.background = '#222'; e.target.style.color = '#999' }}>
                                    {s.icon}
                                </a>
                            )) : (
                                <span style={{ fontSize: '12px', color: '#666' }}>Add social links in admin</span>
                            )}
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shop</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link to="/products" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>All Products</Link>
                            <Link to="/products?sale=true" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Sale</Link>
                            <Link to="/products?new=true" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>New Arrivals</Link>
                        </div>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link to="/contact" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Contact</Link>
                            <Link to="/about" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>About Us</Link>
                            <Link to="/shipping-policy" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Shipping & Returns</Link>
                            <Link to="/blog" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Blog</Link>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link to="/privacy" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Privacy Policy</Link>
                            <Link to="/terms" style={{ color: '#888', fontSize: '13px', textDecoration: 'none' }}>Terms of Service</Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                            <a href={`tel:${(settings.contactPhone || '1300123456').replace(/\s/g, '')}`} style={{ color: '#888', textDecoration: 'none' }}>📞 {settings.contactPhone || '1300 123 456'}</a>
                            <a href={`mailto:${settings.contactEmail || 'hello@decorabake.com.au'}`} style={{ color: '#888', textDecoration: 'none' }}>✉️ {settings.contactEmail || 'hello@decorabake.com.au'}</a>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || settings.emailFooterText || 'Sydney, Australia')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none' }}>📍 {settings.address || settings.emailFooterText || 'Sydney, Australia'}</a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid #222', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>© {new Date().getFullYear()} {settings.siteName || 'DecoraBake'}. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Visa */}
                        <svg viewBox="0 0 50 32" width="42" height="27" fill="none"><rect width="50" height="32" rx="4" fill="#fff" /><path d="M20.5 21l2-12h3.2l-2 12h-3.2zm13.6-11.8c-.6-.3-1.6-.5-2.8-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.9 3.4 1.2.6 1.7 1 1.7 1.6 0 .9-1 1.3-2 1.3-1.3 0-2-.2-3.2-.7l-.4-.2-.5 2.9c.8.4 2.2.7 3.7.7 3.4 0 5.6-1.7 5.6-4.3 0-1.4-.9-2.5-2.8-3.4-1.2-.6-1.9-.9-1.9-1.5 0-.5.6-1 2-1 1.1 0 2 .2 2.6.5l.3.1.5-2.7zm8.3-.2h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11h3.4l.7-1.9h4.2l.4 1.9h3l-2.7-12zm-4 7.7l1.3-3.4.7 3.4h-2zm-20-7.7l-3.2 8.2-.3-1.7c-.6-2.1-2.5-4.3-4.6-5.4l2.9 10.8h3.4l5.1-12h-3.3z" fill="#1A1F71" /><path d="M14.2 9.2h-5.4L8.7 9.4c4 1 6.7 3.5 7.8 6.4l-1.1-5.8c-.2-.7-.7-.8-1.2-.8z" fill="#F9A533" /></svg>
                        {/* Mastercard */}
                        <svg viewBox="0 0 50 32" width="42" height="27" fill="none"><rect width="50" height="32" rx="4" fill="#fff" /><circle cx="20" cy="16" r="9" fill="#EB001B" /><circle cx="30" cy="16" r="9" fill="#F79E1B" /><path d="M25 9.2a9 9 0 0 0-3.3 6.8 9 9 0 0 0 3.3 6.8 9 9 0 0 0 3.3-6.8 9 9 0 0 0-3.3-6.8z" fill="#FF5F00" /></svg>
                        {/* Stripe */}
                        <svg viewBox="0 0 50 32" width="42" height="27" fill="none"><rect width="50" height="32" rx="4" fill="#6772E5" /><path d="M23 14c0-.8.7-1.2 1.7-1.2 1 0 2 .4 2.9 1l.9-2.7c-1-.5-2.3-.9-3.8-.9-3.1 0-5.1 1.6-5.1 4.2 0 4.1 5.7 3.4 5.7 5.2 0 .9-.8 1.3-2 1.3-1.2 0-2.5-.5-3.5-1.2l-.9 2.7c1.2.7 2.7 1 4.2 1 3.1 0 5.3-1.5 5.3-4.2 0-4.4-5.4-3.6-5.4-5.2z" fill="#fff" /></svg>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
