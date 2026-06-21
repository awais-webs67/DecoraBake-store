import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE_URL from '../config/api'
import { useSEO } from '../hooks/useSEO'

function ShippingPolicy() {
    useSEO({ title: 'Shipping Policy', description: 'Learn about DecoraBake shipping times, costs, and delivery options for cake decorating supplies across Australia.', url: '/shipping-policy' })
    const [settings, setSettings] = useState({})
    const [pageData, setPageData] = useState(null)

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).then(d => { if (d) setSettings(d) }).catch(() => { })
        fetch(`${API_BASE_URL}/api/pages/shipping-policy`).then(r => r.json()).then(d => { if (d) setPageData(d) }).catch(() => { })
        window.scrollTo(0, 0)
    }, [])

    let content = {}
    try { content = pageData?.content ? JSON.parse(pageData.content) : {} } catch { content = {} }

    const siteName = settings.siteName || 'DecoraBake'
    const contactEmail = settings.contactEmail || 'hello@decorabake.com.au'
    const freeShippingThreshold = settings.freeShippingThreshold || 149
    const shippingCost = settings.shippingCost || 9.95

    const shippingOptions = content.shippingOptions || [
        { method: 'Standard Shipping', time: '3-5 Business Days', cost: `$${shippingCost}`, free: `Free over $${freeShippingThreshold}` },
        { method: 'Express Shipping', time: '1-2 Business Days', cost: '$14.95', free: null },
        { method: 'Same-Day (Metro)', time: 'Same Day', cost: '$24.95', free: null }
    ]

    const returnSteps = content.returnSteps || [
        { step: 1, title: 'Contact Us', desc: `Email us at ${contactEmail} with your order number and reason for return.` },
        { step: 2, title: 'Get Approved', desc: 'We\'ll review your request and send you a return authorization within 24 hours.' },
        { step: 3, title: 'Ship It Back', desc: 'Pack the item securely in its original packaging and ship it to the provided address.' },
        { step: 4, title: 'Get Refunded', desc: 'Once we receive and inspect the item, your refund will be processed within 5-10 business days.' }
    ]

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #0D4C3F 0%, #1A6B5A 50%, #2E8B6F 100%)',
                color: '#fff', padding: '80px 20px 60px', textAlign: 'center', position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: '20px', right: '40px', opacity: 0.05 }}><svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></div>
                <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '16px', opacity: 0.7 }}>
                        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link> / Shipping & Returns
                    </p>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Shipping & Returns</h1>
                    <p style={{ fontSize: '16px', lineHeight: '1.7', opacity: 0.9, maxWidth: '550px', margin: '0 auto', color: '#ffffff' }}>
                        Fast, reliable delivery across Australia. Easy returns if you're not satisfied.
                    </p>
                </div>
            </section>

            {/* Free Shipping Banner */}
            <section style={{ maxWidth: '900px', margin: '-30px auto 0', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                <div style={{
                    background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', borderRadius: '16px', padding: '24px 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '2px solid #FFB74D', flexWrap: 'wrap', textAlign: 'center'
                }}>
                    <span><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></span>
                    <div>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#E65100', margin: '0 0 4px' }}>Free Shipping on Orders Over ${freeShippingThreshold}!</p>
                        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Australia-wide delivery at no extra cost</p>
                    </div>
                </div>
            </section>

            {/* Shipping Rates Table */}
            <section style={{ maxWidth: '900px', margin: '50px auto', padding: '0 20px' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', textAlign: 'center', marginBottom: '32px', color: '#222' }}>Shipping Options</h2>
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#0D4C3F', color: '#fff', padding: '16px 24px', fontWeight: '600', fontSize: '14px' }}>
                        <span>Method</span><span>Delivery Time</span><span>Cost</span>
                    </div>
                    {shippingOptions.map((opt, i) => (
                        <div key={i} style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '20px 24px',
                            borderBottom: i < shippingOptions.length - 1 ? '1px solid #f0f0f0' : 'none',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{opt.method}</span>
                            <span style={{ color: '#666', fontSize: '14px' }}>{opt.time}</span>
                            <div>
                                <span style={{ fontWeight: '600', color: '#0D4C3F', fontSize: '15px' }}>{opt.cost}</span>
                                {opt.free && <span style={{ display: 'block', fontSize: '12px', color: '#E65100', fontWeight: '600', marginTop: '2px' }}>{opt.free}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Shipping Info Cards */}
            <section style={{ maxWidth: '900px', margin: '50px auto', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {[
                        { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D4C3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>, title: 'Order Processing', text: content.processing || 'Orders placed before 2pm AEST are dispatched the same business day. Weekend orders are processed on Monday.' },
                        { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D4C3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, title: 'Tracking', text: content.tracking || 'You\'ll receive a tracking number via email once your order ships. Track your package in real-time through your account.' },
                        { icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D4C3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, title: 'Secure Packaging', text: content.packaging || 'All items are carefully packaged to ensure they arrive in perfect condition. Fragile items receive extra protection.' }
                    ].map((card, i) => (
                        <div key={i} style={{
                            background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                            border: '1px solid #f0f0f0', transition: 'all 0.3s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'}>
                            <div style={{ marginBottom: '16px' }}>{card.icon}</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>{card.title}</h3>
                            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', margin: 0 }}>{card.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Returns Section */}
            <section style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', textAlign: 'center', marginBottom: '12px', color: '#222' }}>Returns & Refunds</h2>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '15px', marginBottom: '40px' }}>
                    {content.returnsIntro || 'Not happy with your purchase? We offer hassle-free returns within 30 days.'}
                </p>

                {/* Steps */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {returnSteps.map((item, i) => (
                        <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D4C3F, #2E8B6F)',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '22px', fontWeight: '700', margin: '0 auto 16px'
                            }}>{item.step}</div>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>{item.title}</h4>
                            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Return Conditions */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '16px', color: '#222' }}>Return Conditions</h3>
                    <div style={{ color: '#555', fontSize: '14px', lineHeight: '1.8' }}>
                        {(content.returnConditions || '• Items must be unused and in original packaging\n• Returns must be initiated within 30 days of delivery\n• Perishable items and custom orders are not eligible for return\n• Sale items may only be exchanged, not refunded\n• Return shipping costs are the customer\'s responsibility unless the item is faulty\n• Refunds are processed to the original payment method').split('\n').map((line, j) => {
                            if (line.trim().startsWith('•')) return <div key={j} style={{ paddingLeft: '20px', position: 'relative', marginBottom: '6px' }}><span style={{ position: 'absolute', left: '4px', color: '#0D4C3F' }}>•</span>{line.trim().substring(1).trim()}</div>
                            return <p key={j} style={{ margin: '0 0 6px' }}>{line}</p>
                        })}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section style={{ maxWidth: '700px', margin: '60px auto 80px', padding: '0 20px', textAlign: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg, #0D4C3F, #2E8B6F)', borderRadius: '20px', padding: '40px', color: '#fff' }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '12px' }}>Have Questions?</h3>
                    <p style={{ fontSize: '15px', opacity: 0.9, marginBottom: '24px' }}>Our team is here to help with any shipping or return questions.</p>
                    <Link to="/contact" style={{
                        display: 'inline-block', background: '#fff', color: '#0D4C3F', padding: '14px 36px',
                        borderRadius: '50px', textDecoration: 'none', fontWeight: '700', fontSize: '15px'
                    }}>Contact Us</Link>
                </div>
            </section>
        </div>
    )
}

export default ShippingPolicy
