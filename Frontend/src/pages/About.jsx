import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function About() {
    const [page, setPage] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)

    useSEO({
        title: 'About Us',
        description: "Learn about DecoraBake - Australia's premier cake decorating supply store. Premium quality, fast shipping, expert support since 2020.",
        url: '/about'
    })

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE_URL}/api/pages/about`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
        ]).then(([pageData, settingsData]) => {
            if (pageData && !pageData.error) setPage(pageData)
            setSettings(settingsData || {})
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #6B2346', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }


    // Default beautiful About page
    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', overflowX: 'hidden' }}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                .about-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(107,35,70,0.08) !important;
                    border-color: #6B2346 !important;
                }
                .about-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(107,35,70,0.3) !important;
                    background: #8B3A5E !important;
                    color: #fff !important;
                }
                .about-btn-secondary:hover {
                    transform: translateY(-2px);
                    background: rgba(255,255,255,0.1) !important;
                    border-color: #fff !important;
                }
                .timeline-container {
                    position: relative;
                    padding: 20px 0;
                }
                .timeline-container::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2px;
                    top: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, #FCE8ED, #6B2346, #FCE8ED);
                }
                .timeline-item {
                    display: flex;
                    align-items: center;
                    margin: 50px 0;
                    position: relative;
                    width: 100%;
                    box-sizing: border-box;
                }
                .timeline-item-even {
                    justify-content: flex-start;
                }
                .timeline-item-odd {
                    justify-content: flex-end;
                }
                .timeline-dot {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 12px;
                    height: 12px;
                    background: #6B2346;
                    border: 4px solid #fff;
                    border-radius: 50%;
                    box-shadow: 0 0 0 4px rgba(107,35,70,0.15);
                    z-index: 2;
                }
                .timeline-card {
                    width: 45%;
                    background: #fff;
                    border-radius: 20px;
                    padding: 28px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                    border: 1px solid #f0f0f0;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                }
                .timeline-card-even {
                    text-align: right;
                }
                .timeline-card-odd {
                    text-align: left;
                }
                @media (max-width: 768px) {
                    .hero-grid {
                        grid-template-columns: 1fr !important;
                        text-align: center !important;
                        padding: 60px 20px 80px !important;
                    }
                    .hero-svg-wrap {
                        display: none !important;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                        padding: 20px !important;
                    }
                    .stats-item {
                        border-right: none !important;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    .stats-item:nth-child(even) {
                        border-right: none !important;
                    }
                    .stats-item:last-child, .stats-item:nth-last-child(2) {
                        border-bottom: none !important;
                    }
                    .timeline-container::before {
                        left: 20px !important;
                        transform: none !important;
                    }
                    .timeline-item {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        margin: 30px 0 !important;
                        width: 100% !important;
                    }
                    .timeline-dot {
                        left: 20px !important;
                        transform: translateX(-50%) !important;
                        top: 12px !important;
                    }
                    .timeline-card {
                        width: calc(100% - 40px) !important;
                        margin-left: 40px !important;
                        text-align: left !important;
                        padding: 20px !important;
                    }
                    .team-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .about-card {
                        padding: 24px 20px !important;
                    }
                    .about-cms-card {
                        padding: 24px 20px !important;
                    }
                }
                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }
                    .stats-item {
                        border-right: none !important;
                        border-bottom: 1px solid #f0f0f0 !important;
                    }
                    .stats-item:last-child {
                        border-bottom: none !important;
                    }
                }
            `}</style>

            {/* Split Hero Section */}
            <div style={{ background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div className="hero-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center', padding: '120px 20px 140px', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '8px 18px', borderRadius: '50px', marginBottom: '24px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffc107', display: 'inline-block' }} />
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>EST. AUSTRALIA 2020</span>
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: '800', color: '#ffffff', marginBottom: '24px', lineHeight: '1.15' }}>
                            Australia's Premier Cake Decorating Supply Store
                        </h1>
                        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', maxWidth: '600px', margin: '0 0 32px' }}>
                            We deliver professional-grade baking tools, stencils, fondants, and edible decorations directly to your kitchen door, helping creators bring sweet magic to life.
                        </p>
                    </div>
                    
                    <div className="hero-svg-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
                        <svg width="360" height="320" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'float 6s ease-in-out infinite' }}>
                            <ellipse cx="200" cy="270" rx="140" ry="25" fill="rgba(255,255,255,0.06)" />
                            
                            {/* The Cake */}
                            <rect x="110" y="190" width="180" height="70" rx="8" fill="#FCE8ED" stroke="#6B2346" strokeWidth="3" />
                            <path d="M 110 210 Q 120 220 130 210 Q 140 200 150 210 Q 160 220 170 210 Q 180 200 190 210 Q 200 220 210 210 Q 220 200 230 210 Q 240 220 250 210 Q 260 200 270 210 Q 280 220 290 210" fill="none" stroke="#6B2346" strokeWidth="2.5" />
                            
                            <rect x="140" y="120" width="120" height="70" rx="6" fill="#FFF5F7" stroke="#6B2346" strokeWidth="3" />
                            <path d="M 140 140 Q 150 150 160 140 Q 170 130 180 140 Q 190 150 200 140 Q 210 130 220 140 Q 230 150 240 140 Q 250 130 260 140" fill="none" stroke="#6B2346" strokeWidth="2.5" />
                            
                            <circle cx="170" cy="160" r="4" fill="#C64977" />
                            <circle cx="230" cy="160" r="4" fill="#C64977" />
                            <circle cx="150" cy="235" r="5" fill="#C64977" />
                            <circle cx="200" cy="235" r="5" fill="#C64977" />
                            <circle cx="250" cy="235" r="5" fill="#C64977" />

                            <path d="M 200 95 C 190 95 190 120 200 120 C 210 120 210 95 200 95 Z" fill="#E53935" stroke="#6B2346" strokeWidth="2" />
                            <path d="M 200 95 C 197 90 203 90 200 95 Z" fill="#4CAF50" />
                            
                            <path d="M 80 130 L 83 133 L 86 130 L 83 127 Z" fill="#F9D5E0" style={{ animation: 'pulse-glow 2s infinite' }} />
                            <path d="M 320 180 L 323 183 L 326 180 L 323 177 Z" fill="#F9D5E0" style={{ animation: 'pulse-glow 2.5s infinite' }} />
                            <path d="M 300 90 L 303 93 L 306 90 L 303 87 Z" fill="#F9D5E0" style={{ animation: 'pulse-glow 1.8s infinite' }} />
                            
                            <g transform="translate(40, 160) rotate(-30)">
                                <rect x="10" y="25" width="6" height="35" rx="3" fill="#B0BEC5" stroke="#6B2346" strokeWidth="2" />
                                <path d="M 8 10 C 2 10 2 25 8 25 C 14 25 14 10 8 10 Z" fill="none" stroke="#6B2346" strokeWidth="2" />
                                <path d="M 12 10 C 6 10 6 25 12 25 C 18 25 18 10 12 10 Z" fill="none" stroke="#6B2346" strokeWidth="2" />
                            </g>
                            
                            <g transform="translate(320, 110) rotate(20)">
                                <path d="M 10 10 L 30 40 L 18 43 Z" fill="#FFF5F7" stroke="#6B2346" strokeWidth="2" />
                                <path d="M 30 40 L 36 46 L 33 48 Z" fill="#C64977" stroke="#6B2346" strokeWidth="2" />
                            </g>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Interactive Glassmorphic Stats Section */}
            <div style={{ maxWidth: '1100px', margin: '-60px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
                <div className="stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 50px rgba(107,35,70,0.06)',
                    padding: '30px',
                    border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    {[
                        { num: '5,000+', label: 'Premium Products' },
                        { num: '50,000+', label: 'Happy Customers' },
                        { num: '4.9/5', label: 'Customer Rating' },
                        { num: '24h', label: 'Fast Dispatch' }
                    ].map((s, i) => (
                        <div key={i} className="stats-item" style={{ textAlign: 'center', padding: '15px', borderRight: i < 3 ? '1px solid #f0f0f0' : 'none' }}>
                            <div style={{ fontSize: '36px', fontWeight: '800', color: '#6B2346', marginBottom: '6px', fontFamily: "'Playfair Display', serif" }}>{s.num}</div>
                            <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Admin CMS Content (integrated seamlessly) */}
            {page?.content && (
                <div style={{ maxWidth: '900px', margin: '60px auto 0', padding: '0 20px', position: 'relative', zIndex: 5 }}>
                    <div className="about-cms-card" style={{ background: '#fff', borderRadius: '24px', padding: '48px', boxShadow: '0 10px 30px rgba(107,35,70,0.03)', border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '16.5px', lineHeight: '1.85', color: '#444' }} dangerouslySetInnerHTML={{ __html: page.content }} />
                    </div>
                </div>
            )}

            {/* Timeline Section */}
            <div style={{ padding: '100px 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <span style={{ color: '#6B2346', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Our Journey</span>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '700', color: '#222', marginTop: '10px' }}>
                        How We Rose to the Occasion
                    </h2>
                    <p style={{ color: '#666', fontSize: '16px', marginTop: '8px' }}>Crafting sweet success year by year</p>
                </div>

                <div className="timeline-container">
                    {[
                        { year: '2020', title: 'The Spark', desc: `Founded in Sydney from a home kitchen, ${settings.siteName || 'DecoraBake'} started with a simple belief: that every baker deserves professional-grade, reliable tools. We began sourcing high-quality products directly for friends and local bakers.` },
                        { year: '2022', title: 'Rising Up', desc: 'Demand grew rapidly, and we moved to our first dedicated warehouse. We expanded our inventory to over 2,000 product lines, introducing premium imported colors and specialized fondant tools.' },
                        { year: '2024', title: 'Community & Masterclasses', desc: 'We began partnering with professional pastry chefs across Australia to design custom baking bundles. We launched free webinars and recipe guides to support home bakers at all skill levels.' },
                        { year: '2026', title: 'Empowering Creators', desc: 'Today, we are proud to serve over 50,000 bakers, cake designers, and sweet creators nationwide. We remain dedicated to high standards, innovation, and direct expert support.' }
                    ].map((step, i) => {
                        const isEven = i % 2 === 0
                        return (
                            <div key={i} className={`timeline-item ${isEven ? 'timeline-item-even' : 'timeline-item-odd'}`}>
                                <div className="timeline-dot" />
                                <div className={`timeline-card ${isEven ? 'timeline-card-even' : 'timeline-card-odd'}`}>
                                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#6B2346', display: 'block', marginBottom: '4px' }}>{step.year}</span>
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '12px' }}>{step.title}</h3>
                                    <p style={{ fontSize: '14.5px', color: '#555', lineHeight: '1.7', margin: 0 }}>{step.desc}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Core Values Section */}
            <div style={{ background: '#fff', padding: '100px 20px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <span style={{ color: '#6B2346', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Our Values</span>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '700', color: '#222', marginTop: '10px' }}>
                            The Ingredients We Bake By
                        </h2>
                        <p style={{ color: '#666', fontSize: '16px', marginTop: '8px' }}>The foundation of our commitment to excellence</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px' }}>
                        {[
                            {
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9 9H2L7 14L5 21L12 17L19 21L17 14L22 9H15L12 2Z" /></svg>,
                                title: 'Passion for Perfection',
                                desc: 'We carefully vet and source each baking accessory. If it isn’t good enough for our wedding cakes, it isn’t on our shelves.'
                            },
                            {
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                                title: 'Baking Community',
                                desc: 'Baking is a shared language. We stand by our customers, from beginners learning to pipe to top cake boutiques.'
                            },
                            {
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
                                title: 'Creative Innovation',
                                desc: 'We participate in international confectionery exhibitions to ensure Australia has early access to the latest trends.'
                            },
                            {
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
                                title: 'Sweet Integrity',
                                desc: 'Honest pricing, dispatch within 24 hours, and a 30-day return policy. No red tape, just sweet and simple service.'
                            }
                        ].map((item, i) => (
                            <div key={i} className="about-card" style={{
                                background: '#fafafa',
                                padding: '40px 30px',
                                borderRadius: '24px',
                                border: '1px solid #f0f0f0',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                            }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    background: '#FCE8ED',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px'
                                }}>{item.icon}</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#222', marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                                <p style={{ fontSize: '14.5px', color: '#666', lineHeight: '1.7', margin: 0 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cursive Quote Section */}
            <div style={{
                background: 'linear-gradient(135deg, #FDF2F5 0%, #FFF 100%)',
                padding: '80px 20px',
                textAlign: 'center',
                borderTop: '1px solid #FCE8ED',
                borderBottom: '1px solid #FCE8ED'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <span style={{ fontSize: '64px', color: '#6B2346', fontFamily: "'Playfair Display', serif", lineHeight: 0.1, display: 'block', opacity: 0.3, marginBottom: '-10px' }}>“</span>
                    <blockquote style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '26px',
                        fontStyle: 'italic',
                        color: '#4A1830',
                        lineHeight: '1.6',
                        margin: '0 0 20px',
                        fontWeight: '500'
                    }}>
                        Baking is where science meets art, and every single creation tells a beautiful, sweet story.
                    </blockquote>
                    <cite style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#6B2346', fontStyle: 'normal' }}>
                        — The DecoraBake Team
                    </cite>
                </div>
            </div>

            {/* Team Section */}
            <div style={{ padding: '100px 20px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <span style={{ color: '#6B2346', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Baking Partners</span>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: '700', color: '#222', marginTop: '10px' }}>
                            Meet Our Baking Partners
                        </h2>
                        <p style={{ color: '#666', fontSize: '16px', marginTop: '8px' }}>The passionate founders and partners behind DecoraBake</p>
                    </div>

                    <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                        {[
                            { name: 'Asad', role: 'Co-Founder & Culinary Lead', initials: 'A', desc: 'With a deep passion for pastry arts, Asad personally curates and evaluates every cake decorating accessory to meet professional standards.' },
                            { name: 'Rehan', role: 'Co-Founder & Supply Director', initials: 'R', desc: 'Rehan directs our global supply lines, working closely with top manufacturers to import premium-quality fondants, colors, and molds.' },
                            { name: 'Awais', role: 'Co-Founder & Operations Director', initials: 'A', desc: 'Awais oversees digital logistics, ecommerce operations, and client support to guarantee fast, seamless deliveries Australia-wide.' }
                        ].map((chef, i) => (
                            <div key={i} className="about-card" style={{
                                background: '#fff',
                                borderRadius: '24px',
                                border: '1px solid #f0f0f0',
                                padding: '40px 30px',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{
                                    width: '90px',
                                    height: '90px',
                                    background: 'linear-gradient(135deg, #6B2346 0%, #8B3A5E 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#fff',
                                    margin: '0 auto 24px',
                                    boxShadow: '0 8px 20px rgba(107,35,70,0.2)'
                                }}>
                                    {chef.initials}
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#222', marginBottom: '6px', fontFamily: "'Playfair Display', serif" }}>{chef.name}</h3>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>{chef.role}</div>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', margin: 0 }}>{chef.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)',
                padding: '100px 20px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '42px', fontWeight: '700', color: '#ffffff', marginBottom: '20px' }}>Ready to Create Sweet Magic?</h2>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                        Browse our collection of premium, professional-grade baking and cake decorating supplies today.
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/products" className="about-btn-primary" style={{
                            display: 'inline-block',
                            padding: '16px 40px',
                            background: '#ffffff',
                            color: '#6B2346',
                            borderRadius: '50px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            fontSize: '16px',
                            transition: 'all 0.3s ease'
                        }}>
                            Shop Our Supplies
                        </Link>
                        <Link to="/contact" className="about-btn-secondary" style={{
                            display: 'inline-block',
                            padding: '15px 40px',
                            background: 'transparent',
                            color: '#ffffff',
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderRadius: '50px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            fontSize: '16px',
                            transition: 'all 0.3s ease'
                        }}>
                            Get in Touch
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default About
