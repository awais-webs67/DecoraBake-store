import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function Contact() {
    const [settings, setSettings] = useState({})
    const [pageData, setPageData] = useState(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [sending, setSending] = useState(false)
    const [openFaq, setOpenFaq] = useState(null)
    const { showToast } = useToast()

    useSEO({
        title: 'Contact Us',
        description: 'Get in touch with DecoraBake. We represent the best in cake decorating supplies and customer support.',
        url: '/contact'
    })

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).then(d => { if (d) setSettings(d) }).catch(() => { })
        fetch(`${API_BASE_URL}/api/pages/contact`).then(r => r.json()).then(d => { if (d) setPageData(d) }).catch(() => { })
        window.scrollTo(0, 0)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSending(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                showToast('Message sent successfully! We\'ll get back to you soon. 💌', 'success')
                setForm({ name: '', email: '', phone: '', subject: '', message: '' })
            } else {
                showToast('Failed to send message. Please try again.', 'error')
            }
        } catch {
            showToast('Failed to send message. Please check your connection and try again.', 'error')
        }
        setSending(false)
    }

    // Parse structured content from CMS or use defaults
    let content = {}
    try { content = pageData?.content ? JSON.parse(pageData.content) : {} } catch { content = {} }

    const heroTitle = content.heroTitle || 'Get in Touch'
    const heroSubtitle = content.heroSubtitle || 'We\'d love to hear from you! Whether you have a question, feedback, or just want to say hello.'
    const email = settings.contactEmail || content.email || 'hello@decorabake.com.au'
    const phone = settings.contactPhone || content.phone || '1300 123 456'
    const address = settings.address || content.address || 'Sydney, NSW, Australia'
    const hours = content.businessHours || 'Mon - Fri: 9:00 AM - 5:00 PM AEST\nSat: 10:00 AM - 2:00 PM AEST\nSun: Closed'
    const faqs = content.faqs || [
        { q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days Australia-wide. Express shipping (1-2 days) is available at checkout.' },
        { q: 'Do you offer returns?', a: 'Yes! We offer a 30-day return policy for unused items in their original packaging. Please contact us to initiate a return.' },
        { q: 'Can I track my order?', a: 'Absolutely! Once your order ships, you\'ll receive a tracking number via email.' },
        { q: 'Do you ship internationally?', a: 'Currently, we only ship within Australia. International shipping is coming soon!' },
        { q: 'How do I contact customer support?', a: `You can reach us via email at ${email}, phone at ${phone}, or use the contact form above.` }
    ]

    const contactCards = [
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>, label: 'Email Us', value: email, href: `mailto:${email}`, color: '#6B2346' },
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, label: 'Call Us', value: phone, href: `tel:${phone.replace(/\s/g, '')}`, color: '#2E7D32' },
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, label: 'Visit Us', value: address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, color: '#1565C0' },
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: 'Business Hours', value: hours.split('\n')[0], href: null, color: '#E65100' }
    ]

    const isToday = (line) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const todayName = days[new Date().getDay()]
        return line.trim().startsWith(todayName)
    }

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh', overflowX: 'hidden' }}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                .contact-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1.5px solid #e8e8e8;
                    background: #fafafa;
                    border-radius: 12px;
                    font-size: 14px;
                    color: #333;
                    outline: none;
                    box-sizing: border-box;
                    transition: all 0.25s ease;
                }
                .contact-input:focus {
                    border-color: #6B2346;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(107,35,70,0.08);
                }
                .contact-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #444;
                    margin-bottom: 6px;
                    letter-spacing: 0.3px;
                }
                .contact-card {
                    background: #fff;
                    border-radius: 20px;
                    padding: 30px 24px;
                    text-align: center;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.03);
                    border: 1px solid #f0f0f0;
                    transition: all 0.3s ease;
                }
                .contact-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 30px rgba(107,35,70,0.08) !important;
                    border-color: #FCE8ED !important;
                }
                .contact-form-card {
                    background: #fff;
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.03);
                    border: 1px solid #f0f0f0;
                }
                .contact-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #6B2346, #8B3A5E);
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .contact-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(107,35,70,0.25);
                    background: linear-gradient(135deg, #8B3A5E, #A85070);
                }
                .contact-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                .resource-tile {
                    color: #ffffff !important;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 14px;
                    font-size: 14px;
                    transition: all 0.25s ease;
                    box-sizing: border-box;
                }
                .resource-tile:hover {
                    color: #ffffff !important;
                    background: rgba(255,255,255,0.18);
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.3);
                }
                .faq-accordion {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid #f0f0f0;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.01);
                }
                .faq-accordion-active {
                    box-shadow: 0 8px 24px rgba(107,35,70,0.06);
                    border-color: #FCE8ED;
                }
                .faq-header {
                    width: 100%;
                    padding: 20px 24px;
                    background: none;
                    border: none;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    text-align: left;
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                    transition: all 0.2s ease;
                }
                .faq-header:hover {
                    background-color: #fafafa;
                }
                .faq-header-active {
                    background-color: #FDF2F5;
                    color: #6B2346;
                }
                .hours-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 14px 12px;
                    border-bottom: 1px solid #f8f8f8;
                    box-sizing: border-box;
                }
                .hours-row:last-child {
                    border-bottom: none;
                }
                .hours-day {
                    color: #555;
                    font-size: 14px;
                    font-weight: 500;
                }
                .hours-time {
                    color: #6B2346;
                    font-size: 14px;
                    font-weight: 600;
                }
                .hours-today {
                    background: #FDF2F5;
                    border-radius: 8px;
                }
                @media (max-width: 768px) {
                    .contact-hero {
                        grid-template-columns: 1fr !important;
                        text-align: center !important;
                        padding: 60px 20px 80px !important;
                    }
                    .contact-hero-subtitle {
                        margin: 0 auto !important;
                    }
                    .contact-hero-svg {
                        display: none !important;
                    }
                    .contact-grid {
                        grid-template-columns: 1fr !important;
                        gap: 30px !important;
                    }
                    .cards-overlap-grid {
                        grid-template-columns: 1fr 1fr !important;
                        margin-top: -50px !important;
                    }
                    .contact-form-card {
                        padding: 20px 16px !important;
                    }
                }
                @media (max-width: 600px) {
                    .contact-form-row {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        margin-bottom: 12px !important;
                    }
                }
                @media (max-width: 480px) {
                    .cards-overlap-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            {/* Split Hero Section */}
            <section className="contact-hero" style={{
                background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)',
                color: '#fff', padding: '100px 20px 140px', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '8px 18px', borderRadius: '50px', marginBottom: '24px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffc107', display: 'inline-block' }} />
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>CONNECT WITH US</span>
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: '800', color: '#ffffff', marginBottom: '24px', lineHeight: '1.15' }}>
                            {heroTitle}
                        </h1>
                        <p className="contact-hero-subtitle" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', maxWidth: '580px', margin: 0 }}>
                            {heroSubtitle}
                        </p>
                    </div>
                    
                    <div className="contact-hero-svg" style={{ display: 'flex', justifyContent: 'center' }}>
                        <svg width="340" height="280" viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'float 5s ease-in-out infinite' }}>
                            <circle cx="170" cy="140" r="110" fill="rgba(255,255,255,0.04)" />
                            <rect x="70" y="90" width="200" height="130" rx="16" fill="#FCE8ED" stroke="#6B2346" strokeWidth="3" />
                            <path d="M 90 90 L 90 50 C 90 42 96 36 104 36 L 236 36 C 244 36 250 42 250 50 L 250 90 Z" fill="#ffffff" stroke="#6B2346" strokeWidth="2.5" />
                            <line x1="110" y1="56" x2="230" y2="56" stroke="#C64977" strokeWidth="2" strokeLinecap="round" />
                            <line x1="110" y1="70" x2="190" y2="70" stroke="#C64977" strokeWidth="2" strokeLinecap="round" />
                            <path d="M 70 90 L 170 155 L 270 90" fill="none" stroke="#6B2346" strokeWidth="3" strokeLinejoin="round" />
                            <path d="M 70 220 L 140 150" fill="none" stroke="#6B2346" strokeWidth="3" />
                            <path d="M 270 220 L 200 150" fill="none" stroke="#6B2346" strokeWidth="3" />
                            <path d="M 120 20 C 115 10 100 10 100 22 C 100 32 120 42 120 42 C 120 42 140 32 140 22 C 140 10 125 10 120 20 Z" fill="#E53935" style={{ animation: 'pulse-glow 1.5s infinite' }} />
                            <path d="M 220 15 C 216 7 204 7 204 17 C 204 25 220 33 220 33 C 220 33 236 25 236 17 C 236 7 224 7 220 15 Z" fill="#C64977" style={{ animation: 'pulse-glow 2s infinite' }} />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Overlapping Info Cards */}
            <section style={{ maxWidth: '1100px', margin: '-60px auto 0', padding: '0 20px', position: 'relative', zIndex: 12 }}>
                <div className="cards-overlap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {contactCards.map((card, i) => (
                        <div key={i} onClick={() => card.href && window.open(card.href, card.href.startsWith('mailto') || card.href.startsWith('tel') ? '_self' : '_blank')}
                            className="contact-card"
                            style={{ cursor: card.href ? 'pointer' : 'default' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                {card.icon}
                            </div>
                            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: card.color, marginBottom: '8px', fontWeight: '700' }}>{card.label}</h3>
                            <p style={{ fontSize: '15px', color: '#333', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={card.value}>{card.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Form + Hours Section */}
            <section style={{ maxWidth: '1100px', margin: '60px auto', padding: '0 20px' }}>
                <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
                    {/* Form Card (Left) */}
                    <div className="contact-form-card">
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', marginBottom: '8px', color: '#222', fontWeight: '700' }}>Send us a Message</h2>
                        <p style={{ color: '#666', fontSize: '15px', marginBottom: '32px' }}>Fill out the form below and our pastry advisers will respond within 24 hours.</p>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="contact-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label className="contact-label">Full Name *</label>
                                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="contact-input" />
                                </div>
                                <div>
                                    <label className="contact-label">Email Address *</label>
                                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="contact-input" />
                                </div>
                            </div>
                            <div className="contact-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label className="contact-label">Phone Number</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+61 400 000 000" className="contact-input" />
                                </div>
                                <div>
                                    <label className="contact-label">Topic of Interest *</label>
                                    <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="contact-input" style={{ appearance: 'none', background: '#fafafa url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%236B2346\' viewBox=\'0 0 16 16\'%3E%3Cpath fill-rule=\'evenodd\' d=\'M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z\'/%3E%3C/svg%3E") no-repeat right 16px center' }}>
                                        <option value="">Select a topic</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Order Support">Order Support</option>
                                        <option value="Product Question">Product Question</option>
                                        <option value="Shipping & Delivery">Shipping & Delivery</option>
                                        <option value="Returns & Refunds">Returns & Refunds</option>
                                        <option value="Wholesale Inquiry">Wholesale Inquiry</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '28px' }}>
                                <label className="contact-label">Message *</label>
                                <textarea required rows="5" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help..." className="contact-input" style={{ resize: 'vertical', minHeight: '120px' }} />
                            </div>
                            <button type="submit" disabled={sending} className="contact-btn">
                                {sending ? 'Sending Message...' : 'Send Message →'}
                            </button>
                        </form>
                    </div>

                    {/* Info Side (Right) */}
                    <div>
                        {/* Business Hours Card */}
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', marginBottom: '30px' }}>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '20px', color: '#222', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> Opening Hours
                            </h3>
                            <div>
                                {hours.split('\n').map((line, i) => {
                                    const todayClass = isToday(line) ? 'hours-today' : ''
                                    const colonIndex = line.indexOf(':')
                                    const dayPart = colonIndex !== -1 ? line.substring(0, colonIndex) : line
                                    const timePart = colonIndex !== -1 ? line.substring(colonIndex + 1).trim() : ''
                                    return (
                                        <div key={i} className={`hours-row ${todayClass}`}>
                                            <span className="hours-day">{dayPart}</span>
                                            <span className="hours-time">{timePart}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Quick Resources links */}
                        <div style={{ background: 'linear-gradient(135deg, #6B2346, #4A1830)', borderRadius: '24px', padding: '32px', color: '#fff', boxShadow: '0 8px 30px rgba(107,35,70,0.15)' }}>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '20px', fontWeight: '700', color: '#ffffff' }}>Helpful Resources</h3>
                            <p style={{ color: '#ffffff', opacity: 0.85, fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>Skip the wait! Check out these useful resources on our store:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { to: '/products', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>, text: 'Shop Baking Tools' },
                                    { to: '/blog', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>, text: 'Read Baking Insights' },
                                    { to: '/shipping-policy', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, text: 'Delivery & Shipping Cost' },
                                    { to: '/privacy', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>, text: 'Privacy & Store Policy' }
                                ].map((link, i) => (
                                    <Link key={i} to={link.to} className="resource-tile">
                                        <span>{link.icon}</span> {link.text}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion Section */}
            <section style={{ maxWidth: '800px', margin: '80px auto 100px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <span style={{ color: '#6B2346', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>FAQ Support</span>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: '#222', marginTop: '10px', fontWeight: '700' }}>Common Questions</h2>
                    <p style={{ color: '#666', fontSize: '15.5px', marginTop: '8px' }}>Find instantaneous help before reaching out</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {faqs.map((faq, i) => {
                        const isActive = openFaq === i
                        return (
                            <div key={i} className={`faq-accordion ${isActive ? 'faq-accordion-active' : ''}`}>
                                <button onClick={() => setOpenFaq(isActive ? null : i)} className={`faq-header ${isActive ? 'faq-header-active' : ''}`}>
                                    <span style={{ paddingRight: '12px' }}>{faq.q}</span>
                                    <span style={{
                                        fontSize: '22px',
                                        lineHeight: 1,
                                        color: '#6B2346',
                                        transition: 'transform 0.25s ease',
                                        transform: isActive ? 'rotate(45deg)' : 'rotate(0deg)'
                                    }}>+</span>
                                </button>
                                <div style={{
                                    maxHeight: isActive ? '300px' : '0px',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s cubic-bezier(0, 1, 0, 1)',
                                    padding: isActive ? '0 24px 24px' : '0 24px'
                                }}>
                                    <p style={{ color: '#666', fontSize: '14.5px', lineHeight: '1.75', margin: 0 }}>{faq.a}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

export default Contact
