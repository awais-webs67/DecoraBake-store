import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function Privacy() {
    const [settings, setSettings] = useState({})
    const [pageData, setPageData] = useState(null)
    const [activeSection, setActiveSection] = useState(0)

    useSEO({
        title: 'Privacy Policy | DecoraBake',
        description: 'Understand how DecoraBake collects, uses, and protects your personal information.',
        url: '/privacy'
    })

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).then(d => { if (d) setSettings(d) }).catch(() => { })
        fetch(`${API_BASE_URL}/api/pages/privacy`).then(r => r.json()).then(d => { if (d) setPageData(d) }).catch(() => { })
        window.scrollTo(0, 0)
    }, [])

    let content = {}
    try { content = pageData?.content ? JSON.parse(pageData.content) : {} } catch { content = {} }

    const siteName = settings.siteName || 'DecoraBake'
    const contactEmail = settings.contactEmail || 'hello@decorabake.com.au'
    const lastUpdated = content.lastUpdated || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

    const sections = [
        {
            title: 'Information We Collect',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
            content: content.informationCollect || `When you visit ${siteName}, we may collect the following types of information:\n\n• Personal information you provide (name, email, phone, shipping address) when creating an account or placing an order\n• Payment information processed securely through our payment providers (we do not store credit card details)\n• Device and browser information, IP address, and browsing behavior on our site\n• Information from cookies and similar tracking technologies\n• Any information you provide when contacting our support team`
        },
        {
            title: 'How We Use Your Information',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66.003-1.25.396-1.51 1z" /></svg>,
            content: content.howWeUse || `We use your personal information to:\n\n• Process and fulfill your orders, including shipping and delivery\n• Send order confirmations, shipping updates, and delivery notifications\n• Provide customer support and respond to your inquiries\n• Improve our website, products, and services\n• Send promotional emails and newsletters (with your consent)\n• Prevent fraud and maintain security of our platform\n• Comply with legal obligations`
        },
        {
            title: 'Cookies & Tracking',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="8" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="11" r="1" fill="currentColor" /><circle cx="10" cy="15" r="1" fill="currentColor" /></svg>,
            content: content.cookies || `${siteName} uses cookies and similar technologies to:\n\n• Remember your preferences and cart contents\n• Analyze site traffic and usage patterns\n• Provide personalized shopping experiences\n• Support our marketing and advertising efforts\n\nYou can control cookies through your browser settings. Disabling cookies may affect some features of our website.`
        },
        {
            title: 'Third-Party Services',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
            content: content.thirdParty || `We may share your information with trusted third-party services that help us operate our business:\n\n• Payment processors (Stripe) for secure payment handling\n• Shipping carriers for order delivery\n• Email service providers for transactional and marketing emails\n• Analytics services to understand site usage\n\nThese third parties are obligated to protect your information and use it only for the services we've engaged them to provide.`
        },
        {
            title: 'Data Security',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
            content: content.dataSecurity || `We take data security seriously and implement appropriate measures to protect your personal information:\n\n• SSL encryption for all data transmission\n• Secure payment processing through PCI-compliant providers\n• Regular security audits and monitoring\n• Access controls and authentication for sensitive data\n• Encrypted database storage\n\nWhile we strive to protect your information, no method of transmission over the Internet is 100% secure.`
        },
        {
            title: 'Your Rights',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
            content: content.yourRights || `Under the Australian Privacy Act 1988, you have the right to:\n\n• Access your personal information we hold\n• Request correction of inaccurate information\n• Request deletion of your personal information\n• Opt out of marketing communications\n• Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)\n\nTo exercise any of these rights, please contact us at ${contactEmail}.`
        },
        {
            title: 'Data Retention',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
            content: content.dataRetention || `We retain your personal information for as long as necessary to:\n\n• Provide our services to you\n• Comply with legal and regulatory obligations\n• Resolve disputes and enforce our agreements\n\nOrder records are retained for a minimum of 7 years for tax and legal purposes. You may request deletion of your account data at any time by contacting us.`
        },
        {
            title: 'Contact Us',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
            content: content.contactUs || `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:\n\n📧 Email: ${contactEmail}\n📞 Phone: ${settings.contactPhone || '1300 123 456'}\n📍 Address: ${settings.address || 'Sydney, NSW, Australia'}\n\nWe will respond to your inquiry within 30 days.`
        }
    ]

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh', color: '#1F1A1C' }}>
            
            {/* Header / Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #3d1529 0%, #1F1A1C 100%)',
                color: '#fff', padding: '90px 20px 70px', textAlign: 'center', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,35,70,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,35,70,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', color: '#ffffff', opacity: 0.7, fontWeight: '600' }}>
                        <Link to="/" style={{ color: '#ffffff', textDecoration: 'none' }}>Home</Link> &nbsp;&middot;&nbsp; Trust Center
                    </p>
                    <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.8px', color: '#ffffff' }}>Privacy Policy</h1>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '50px', fontSize: '13px', color: '#ffffff', opacity: 0.9, fontWeight: '500' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Last updated: {lastUpdated}
                    </div>
                    
                    <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#ffffff', opacity: 0.85, marginTop: '24px', maxWidth: '600px', margin: '24px auto 0' }}>
                        Your data security is our top priority. We believe in transparency and protect your information like it is our own.
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <section style={{ maxWidth: '1100px', margin: '50px auto 100px', padding: '0 20px' }}>
                <div className="privacy-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', alignItems: 'start' }}>
                    
                    {/* Navigation Sidebar (Sticky) */}
                    <div className="privacy-sidebar" style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6B2346', marginBottom: '16px', fontWeight: '700' }}>Document Sections</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {sections.map((s, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { setActiveSection(i); document.getElementById(`privacy-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                                        style={{
                                            background: activeSection === i ? '#FCE8ED' : 'transparent', 
                                            border: 'none', 
                                            borderRadius: '10px',
                                            padding: '12px 14px', 
                                            textAlign: 'left', 
                                            cursor: 'pointer', 
                                            fontSize: '13.5px',
                                            color: activeSection === i ? '#6B2346' : '#555', 
                                            fontWeight: activeSection === i ? '700' : '500',
                                            transition: 'all 0.2s ease', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px'
                                        }}
                                        onMouseOver={e => {
                                            if (activeSection !== i) e.currentTarget.style.background = '#fafafa'
                                        }}
                                        onMouseOut={e => {
                                            if (activeSection !== i) e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        <span style={{ 
                                            color: activeSection === i ? '#6B2346' : '#888',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            {s.icon}
                                        </span> 
                                        {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Policy Content Blocks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        {/* Summary Intro Card */}
                        <div className="privacy-summary-card" style={{ background: 'linear-gradient(135deg, #FFF5F7 0%, #FFF 100%)', borderRadius: '24px', padding: '32px', border: '1px solid #FCE8ED', boxShadow: '0 4px 20px rgba(107,35,70,0.02)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#6B2346', marginBottom: '8px' }}>Privacy Overview</h3>
                            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: '1.7', margin: 0 }}>
                                We only collect information necessary to fulfill your orders, communicate delivery updates, and support your experience on {siteName}. We <strong>never</strong> sell your personal data to third-party advertisers. All transaction and card details are encrypted securely via Stripe.
                            </p>
                        </div>

                        {sections.map((section, i) => (
                            <div 
                                key={i} 
                                id={`privacy-${i}`}
                                className="privacy-card"
                                style={{
                                    background: '#fff', 
                                    borderRadius: '24px', 
                                    padding: '40px',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.02)', 
                                    border: '1px solid #f0f0f0',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <span style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: '#FCE8ED',
                                        color: '#6B2346'
                                    }}>
                                        {section.icon}
                                    </span>
                                    <h2 style={{ fontSize: '24px', color: '#1F1A1C', margin: 0, fontWeight: '800', letterSpacing: '-0.4px' }}>
                                        {section.title}
                                    </h2>
                                </div>
                                <div style={{ color: '#4A4A4A', fontSize: '15px', lineHeight: '1.9' }}>
                                    {section.content.split('\n').map((line, j) => {
                                        if (line.trim().startsWith('•')) {
                                            return (
                                                <div key={j} style={{ paddingLeft: '24px', position: 'relative', marginBottom: '10px', display: 'flex', alignItems: 'flex-start' }}>
                                                    <span style={{ position: 'absolute', left: '6px', color: '#6B2346', fontWeight: 'bold' }}>&middot;</span>
                                                    <span>{line.trim().substring(1).trim()}</span>
                                                </div>
                                            )
                                        }
                                        if (line.trim() === '') return <div key={j} style={{ height: '12px' }} />
                                        return <p key={j} style={{ margin: '0 0 10px' }}>{line}</p>
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Responsive overrides */}
                <style>{`
                    @media (max-width: 768px) {
                        .privacy-layout {
                            grid-template-columns: 1fr !important;
                            gap: 20px !important;
                        }
                        .privacy-sidebar {
                            position: static !important;
                            margin-bottom: 20px;
                        }
                        .privacy-summary-card {
                            padding: 20px !important;
                        }
                        .privacy-card {
                            padding: 20px 16px !important;
                        }
                    }
                `}</style>
            </section>
        </div>
    )
}

export default Privacy
