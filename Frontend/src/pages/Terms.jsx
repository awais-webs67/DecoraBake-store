import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function Terms() {
    const [settings, setSettings] = useState({})
    const [pageData, setPageData] = useState(null)
    const [activeSection, setActiveSection] = useState(0)

    useSEO({
        title: 'Terms of Service',
        description: 'Read our Terms of Service to understand the rules and regulations for using our website.',
        url: '/terms'
    })

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).then(d => { if (d) setSettings(d) }).catch(() => { })
        fetch(`${API_BASE_URL}/api/pages/terms`).then(r => r.json()).then(d => { if (d) setPageData(d) }).catch(() => { })
        window.scrollTo(0, 0)
    }, [])

    let content = {}
    try { content = pageData?.content ? JSON.parse(pageData.content) : {} } catch { content = {} }

    const siteName = settings.siteName || 'DecoraBake'
    const contactEmail = settings.contactEmail || 'hello@decorabake.com.au'
    const lastUpdated = content.lastUpdated || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

    const sections = [
        {
            title: 'Acceptance of Terms', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
            content: content.acceptance || `By accessing and using the ${siteName} website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website.\n\nThese terms apply to all visitors, users, and customers of ${siteName}. We reserve the right to update these terms at any time, and it is your responsibility to review them periodically.`
        },
        {
            title: 'Products & Pricing', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
            content: content.products || `• All product descriptions and images are presented as accurately as possible. Actual products may vary slightly from images.\n• Prices are displayed in Australian Dollars (AUD) and include GST where applicable.\n• We reserve the right to change prices at any time without prior notice.\n• In the event of a pricing error, we may cancel orders placed at incorrect prices.\n• Product availability is subject to change and is not guaranteed until your order is confirmed.`
        },
        {
            title: 'Orders & Payment', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
            content: content.orders || `• By placing an order, you are making an offer to purchase the selected products.\n• We accept Visa, Mastercard, and other payment methods available at checkout.\n• All payments are processed securely through our payment provider.\n• An order is not confirmed until you receive an order confirmation email.\n• We reserve the right to refuse or cancel any order for any reason.\n• Orders may be subject to verification for fraud prevention purposes.`
        },
        {
            title: 'Shipping & Delivery', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
            content: content.shipping || `• We offer Australia-wide shipping. International shipping is not currently available.\n• Estimated delivery times are provided as a guide and are not guaranteed.\n• Standard shipping typically takes 3-5 business days within Australia.\n• Free shipping is available on orders over the threshold displayed on our website.\n• Risk of loss and title passes to you upon delivery to the carrier.\n• We are not responsible for delays caused by the carrier or circumstances beyond our control.`
        },
        {
            title: 'Returns & Refunds', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>,
            content: content.returns || `• We offer returns within 30 days of purchase for unused items in original packaging.\n• Perishable items, custom orders, and sale items may not be eligible for return.\n• Return shipping costs are the responsibility of the customer unless the item is faulty.\n• Refunds will be processed to the original payment method within 5-10 business days.\n• To initiate a return, please contact us at ${contactEmail}.\n• We reserve the right to refuse returns that do not meet our return policy criteria.`
        },
        {
            title: 'Intellectual Property', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
            content: content.intellectualProperty || `• All content on this website, including text, graphics, logos, images, and software, is the property of ${siteName}.\n• You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.\n• All trademarks and service marks displayed on this website are the property of their respective owners.`
        },
        {
            title: 'Limitation of Liability', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
            content: content.liability || `• ${siteName} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products.\n• Our total liability shall not exceed the amount you paid for the product(s) in question.\n• We do not guarantee that our website will be uninterrupted, error-free, or free of viruses.\n• We are not liable for any loss or damage arising from unauthorized access to your account.`
        },
        {
            title: 'Governing Law', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
            content: content.governingLaw || `These Terms of Service are governed by and construed in accordance with the laws of the State of New South Wales, Australia. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of New South Wales.\n\nIf any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.`
        },
        {
            title: 'Contact', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
            content: content.contact || `For questions about these Terms of Service, please contact us:\n\n📧 Email: ${contactEmail}\n📞 Phone: ${settings.contactPhone || '1300 123 456'}\n📍 Address: ${settings.address || 'Sydney, NSW, Australia'}`
        }
    ]

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh', overflowX: 'hidden' }}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(1.5deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                .terms-sidebar-btn {
                    width: 100%;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    padding: 12px 16px;
                    text-align: left;
                    cursor: pointer;
                    font-size: 14px;
                    color: #555;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-sizing: border-box;
                }
                .terms-sidebar-btn:hover {
                    background: #f8f8f8;
                    color: #2C5364;
                    padding-left: 20px;
                }
                .terms-sidebar-btn-active {
                    background: #E8F4F8 !important;
                    color: #1B3A4B !important;
                    font-weight: 700 !important;
                    border-left: 4px solid #2C5364;
                    border-radius: 0 10px 10px 0 !important;
                    padding-left: 18px !important;
                }
                .terms-card {
                    background: #fff;
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.02);
                    border: 1px solid #f0f0f0;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }
                .terms-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 36px rgba(44,83,100,0.06) !important;
                    border-color: #E8F4F8 !important;
                }
                .bullet-item {
                    padding-left: 24px;
                    position: relative;
                    margin-bottom: 10px;
                    line-height: 1.8;
                    font-size: 14.5px;
                    color: #555;
                }
                .bullet-dot {
                    position: absolute;
                    left: 6px;
                    top: 8px;
                    width: 6px;
                    height: 6px;
                    background: #2C5364;
                    border-radius: 50%;
                }
                @media (max-width: 768px) {
                    .terms-layout {
                        grid-template-columns: 1fr !important;
                        gap: 30px !important;
                    }
                    .terms-sidebar {
                        position: static !important;
                        margin-bottom: 20px;
                    }
                    .terms-card {
                        padding: 20px 16px !important;
                    }
                    .terms-hero {
                        grid-template-columns: 1fr !important;
                        text-align: center !important;
                        padding: 60px 20px 80px !important;
                    }
                    .terms-hero-subtitle {
                        margin: 16px auto 0 !important;
                    }
                    .terms-hero-svg {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Split Hero Section */}
            <section className="terms-hero" style={{
                background: 'linear-gradient(135deg, #162C35 0%, #0F1E24 100%)',
                color: '#fff', padding: '100px 20px 120px', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '8px 18px', borderRadius: '50px', marginBottom: '24px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffc107', display: 'inline-block' }} />
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>STORE POLICIES</span>
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: '800', color: '#ffffff', marginBottom: '24px', lineHeight: '1.15' }}>
                            Terms of Service
                        </h1>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Last updated: {lastUpdated}</p>
                        <p className="terms-hero-subtitle" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', maxWidth: '580px', marginTop: '16px', marginBottom: 0 }}>
                            Please read these terms carefully before using {siteName}.
                        </p>
                    </div>
                    
                    <div className="terms-hero-svg" style={{ display: 'flex', justifyContent: 'center' }}>
                        <svg width="320" height="260" viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'float 5s ease-in-out infinite' }}>
                            <circle cx="160" cy="130" r="100" fill="rgba(44,83,100,0.06)" />
                            <rect x="75" y="45" width="150" height="180" rx="16" fill="#ffffff" stroke="#162C35" strokeWidth="3" />
                            <line x1="95" y1="75" x2="205" y2="75" stroke="#2C5364" strokeWidth="3" strokeLinecap="round" />
                            <line x1="95" y1="95" x2="185" y2="95" stroke="#2C5364" strokeWidth="3" strokeLinecap="round" />
                            <line x1="95" y1="115" x2="205" y2="115" stroke="#2C5364" strokeWidth="3" strokeLinecap="round" />
                            <line x1="95" y1="135" x2="165" y2="135" stroke="#2C5364" strokeWidth="3" strokeLinecap="round" />
                            
                            <g transform="translate(160, 140)" style={{ animation: 'pulse-glow 3s infinite' }}>
                                <path d="M 0 0 L 35 15 C 35 40 20 60 0 70 C -20 60 -35 40 -35 15 Z" fill="#E8F4F8" stroke="#162C35" strokeWidth="3" strokeLinejoin="round" />
                                <path d="M -12 32 L -3 42 L 12 25" fill="none" stroke="#2C5364" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                            
                            <path d="M 50 80 L 53 83 L 56 80 L 53 77 Z" fill="#3A7D8F" style={{ animation: 'pulse-glow 1.5s infinite' }} />
                            <path d="M 270 110 L 273 113 L 276 110 L 273 107 Z" fill="#3A7D8F" style={{ animation: 'pulse-glow 2.5s infinite' }} />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Sidebar + Details Section */}
            <section style={{ maxWidth: '1100px', margin: '60px auto 100px', padding: '0 20px' }}>
                <div className="terms-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
                    
                    {/* Sidebar navigation */}
                    <div className="terms-sidebar" style={{ position: 'sticky', top: '100px', alignSelf: 'start', zIndex: 10 }}>
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#1B3A4B', marginBottom: '20px', fontWeight: '700' }}>Legal Contents</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {sections.map((s, i) => (
                                    <button key={i} onClick={() => { setActiveSection(i); document.getElementById(`terms-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                                        className={`terms-sidebar-btn ${activeSection === i ? 'terms-sidebar-btn-active' : ''}`}>
                                        <span style={{ opacity: activeSection === i ? 1 : 0.6 }}>{s.icon}</span> {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Details Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {sections.map((section, i) => (
                            <div key={i} id={`terms-${i}`} className="terms-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E8F4F8', color: '#2C5364', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {section.icon}
                                    </div>
                                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#222', margin: 0, fontWeight: '700' }}>{section.title}</h2>
                                </div>
                                <div style={{ fontSize: '15px', lineHeight: '1.85' }}>
                                    {section.content.split('\n').map((line, j) => {
                                        if (line.trim().startsWith('•')) {
                                            return (
                                                <div key={j} className="bullet-item">
                                                    <span className="bullet-dot" />
                                                    {line.trim().substring(1).trim()}
                                                </div>
                                            )
                                        }
                                        if (line.trim() === '') return <div key={j} style={{ height: '12px' }} />
                                        return <p key={j} style={{ margin: '0 0 14px', color: '#555', lineHeight: '1.8' }}>{line}</p>
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Terms
