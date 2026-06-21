import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

function PromoSection() {
    const [promo, setPromo] = useState(null)
    const width = useWindowSize()
    const isMobile = width < 768

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/sections/promo`)
            .then(res => res.json())
            .then(data => setPromo(data))
            .catch(() => { })
    }, [])

    const defaultPromo = {
        label: 'Limited Time Offer',
        title: 'Get 20% Off Your First Order',
        description: 'Join thousands of happy bakers who trust DecoraBake for premium cake decorating supplies. Use code WELCOME20 at checkout.',
        buttonText: 'Shop Now',
        buttonLink: '/products'
    }

    const data = (promo && Object.keys(promo).length > 0 && !Array.isArray(promo)) ? promo : defaultPromo

    const styles = {
        section: { position: 'relative', padding: isMobile ? '50px 0' : '80px 0', background: 'linear-gradient(135deg, #6B2346 0%, #4A1830 100%)', overflow: 'hidden' },
        overlay: { position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E\")" },
        container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
        content: { position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '650px', margin: '0 auto' },
        label: { display: 'inline-block', background: '#C9A865', color: '#4A1830', padding: isMobile ? '8px 18px' : '10px 24px', borderRadius: '50px', fontSize: isMobile ? '11px' : '12px', fontWeight: '700', marginBottom: isMobile ? '18px' : '24px', textTransform: 'uppercase', letterSpacing: '1px' },
        title: { fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '40px', fontWeight: '700', color: '#fff', marginBottom: isMobile ? '16px' : '20px', lineHeight: '1.2' },
        desc: { fontSize: isMobile ? '15px' : '17px', color: 'rgba(255,255,255,0.85)', marginBottom: isMobile ? '28px' : '35px', lineHeight: '1.7' },
        btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 28px' : '14px 36px', fontSize: isMobile ? '14px' : '15px', fontWeight: '600', borderRadius: '8px', background: '#fff', color: '#6B2346', textDecoration: 'none', border: 'none', cursor: 'pointer' }
    }

    return (
        <section style={styles.section}>
            <div style={styles.overlay}></div>
            <div style={styles.container}>
                <div style={styles.content}>
                    <span style={styles.label}>{data.label}</span>
                    <h2 style={styles.title}>{data.title}</h2>
                    <p style={styles.desc}>{data.description}</p>
                    <Link to={data.buttonLink || '/products'} style={styles.btn}>
                        {data.buttonText}
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default PromoSection

