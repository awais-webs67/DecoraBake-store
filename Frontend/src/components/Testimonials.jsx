import { useState, useEffect, useCallback } from 'react'
import API_BASE_URL from '../config/api'

function Testimonials() {
    const [testimonials, setTestimonials] = useState([])
    const [current, setCurrent] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [direction, setDirection] = useState(1) // 1=right, -1=left

    const defaultTestimonials = [
        { id: 1, name: 'Sarah Mitchell', location: 'Sydney, NSW', rating: 5, text: 'Absolutely love the quality of supplies from DecoraBake! The sprinkles are vibrant and the fondant tools are professional grade. My cakes have never looked better!' },
        { id: 2, name: 'Emma Thompson', location: 'Melbourne, VIC', rating: 5, text: 'Fast shipping and excellent customer service. The cake toppers I ordered were exactly as pictured. Will definitely be ordering again for my next project.' },
        { id: 3, name: 'Jessica Williams', location: 'Brisbane, QLD', rating: 5, text: 'Best cake decorating store in Australia! Great variety and reasonable prices. The quality of their edible decorations is unmatched.' },
        { id: 4, name: 'Rachel Chen', location: 'Perth, WA', rating: 5, text: "I've been sourcing my baking supplies from DecoraBake for over a year now. Consistent quality, fast delivery, and their customer support is always helpful." },
        { id: 5, name: 'Lauren Davis', location: 'Adelaide, SA', rating: 5, text: "The fondant they carry is the smoothest I've ever worked with. My clients always ask how I get such clean finishes on my cakes!" }
    ]

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/testimonials`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setTestimonials(data)
                else setTestimonials(defaultTestimonials)
            })
            .catch(() => setTestimonials(defaultTestimonials))
    }, [])

    const goTo = useCallback((index) => {
        if (isTransitioning || testimonials.length === 0) return
        setIsTransitioning(true)
        setDirection(index > current ? 1 : -1)
        setCurrent(((index % testimonials.length) + testimonials.length) % testimonials.length)
        setTimeout(() => setIsTransitioning(false), 400)
    }, [isTransitioning, current, testimonials.length])

    // Auto-play every 5s
    useEffect(() => {
        if (testimonials.length <= 1) return
        const timer = setInterval(() => {
            goTo(current + 1)
        }, 5000)
        return () => clearInterval(timer)
    }, [testimonials.length, current, goTo])

    if (testimonials.length === 0) return null

    const t = testimonials[current]
    const colors = ['#6B2346', '#8B3A5E', '#4A1830', '#C64977', '#A85070']

    return (
        <section style={{
            padding: 'clamp(32px, 5vw, 48px) 0',
            background: '#FAFAFA'
        }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(107,35,70,0.07)', padding: '5px 14px', borderRadius: '100px', marginBottom: '10px'
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#C9A865" /></svg>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B2346', letterSpacing: '1px', textTransform: 'uppercase' }}>Customer Reviews</span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px, 4vw, 26px)',
                        fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px', lineHeight: '1.3'
                    }}>
                        What Our Customers Say
                    </h2>
                    <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
                        Trusted by bakers across Australia
                    </p>
                </div>

                {/* Single Card */}
                <div style={{ position: 'relative' }}>
                    {/* Navigation arrows */}
                    {testimonials.length > 1 && (
                        <>
                            <button
                                onClick={() => goTo(current - 1)}
                                style={{
                                    position: 'absolute', top: '50%', left: '-12px', transform: 'translateY(-50%)',
                                    width: '34px', height: '34px', borderRadius: '50%', border: 'none',
                                    background: '#fff', color: '#6B2346', cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                aria-label="Previous"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            <button
                                onClick={() => goTo(current + 1)}
                                style={{
                                    position: 'absolute', top: '50%', right: '-12px', transform: 'translateY(-50%)',
                                    width: '34px', height: '34px', borderRadius: '50%', border: 'none',
                                    background: '#fff', color: '#6B2346', cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                aria-label="Next"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </>
                    )}

                    {/* Card content */}
                    <div
                        key={current}
                        style={{
                            background: '#fff', borderRadius: '16px',
                            padding: 'clamp(20px, 3vw, 28px) clamp(22px, 4vw, 32px)',
                            boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0',
                            animation: 'fadeSlide 0.35s ease-out',
                            textAlign: 'center'
                        }}
                    >
                        {/* Quote icon */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px', opacity: 0.12 }}>
                            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="#6B2346" />
                            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="#6B2346" />
                        </svg>

                        {/* Stars */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '12px' }}>
                            {[...Array(t.rating || 5)].map((_, i) => (
                                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#C9A865" />
                                </svg>
                            ))}
                        </div>

                        {/* Text */}
                        <p style={{
                            fontSize: 'clamp(13px, 2vw, 15px)', color: '#555', lineHeight: '1.7',
                            margin: '0 0 16px', fontStyle: 'italic', maxWidth: '480px', marginInline: 'auto'
                        }}>
                            "{t.text}"
                        </p>

                        {/* Author */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: `linear-gradient(135deg, ${colors[current % colors.length]}, ${colors[(current + 2) % colors.length]})`,
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '700', fontSize: '14px', flexShrink: 0
                            }}>
                                {t.name?.charAt(0) || 'U'}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#222' }}>{t.name}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{t.location}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dots */}
                {testimonials.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '18px' }}>
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goTo(index)}
                                style={{
                                    width: current === index ? '20px' : '6px', height: '6px',
                                    borderRadius: '3px', border: 'none', cursor: 'pointer',
                                    background: current === index ? '#6B2346' : 'rgba(107,35,70,0.15)',
                                    transition: 'all 0.3s ease', padding: 0
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeSlide {
                    from { opacity: 0; transform: translateX(${direction * 20}px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </section>
    )
}

export default Testimonials
