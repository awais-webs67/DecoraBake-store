import { useState, useEffect } from 'react'
import HeroSlider from '../components/HeroSlider'
import TrustFeatures from '../components/TrustFeatures'
import FeaturedProducts from '../components/FeaturedProducts'
import CategoryCircles from '../components/CategoryCircles'
import ProductGrid from '../components/ProductGrid'
import PromoSection from '../components/PromoSection'
import Testimonials from '../components/Testimonials'
import { useSEO } from '../hooks/useSEO'
import API_BASE_URL from '../config/api'

function Home() {
    const [sections, setSections] = useState({
        heroSlider: true, trustFeatures: true, featuredProducts: true,
        categoryCircles: true, productGrid: true, promoSection: true, testimonials: true
    })
    const [settings, setSettings] = useState(null)

    useSEO({
        title: 'Premium Cake Decorating Supplies',
        description: "Australia's #1 online store for premium cake decorating supplies, baking tools, fondant, edible decorations & more. Free shipping on orders over $149.",
        url: '/',
        type: 'website',
        image: '/logo.png'
    })

    // Fetch homepage layout and store settings
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => {
                if (data) {
                    setSettings(data)
                    if (data.homeSections) setSections(prev => ({ ...prev, ...data.homeSections }))
                }
            })
            .catch(() => { })
    }, [])

    // Dynamically inject Organization Schema for branding & local authority
    useEffect(() => {
        if (!settings) return

        let scriptEl = document.querySelector('script[data-seo="organization"]')
        if (!scriptEl) {
            scriptEl = document.createElement('script')
            scriptEl.type = 'application/ld+json'
            scriptEl.setAttribute('data-seo', 'organization')
            document.head.appendChild(scriptEl)
        }

        const sameAs = [
            settings.socialFacebook,
            settings.socialInstagram,
            settings.socialPinterest,
            settings.socialTwitter,
            settings.socialYoutube,
            settings.socialTiktok
        ].filter(link => link && link.trim() !== '')

        scriptEl.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": settings.siteName || "DecoraBake",
            "url": "https://decorabake.com.au",
            "logo": settings.siteLogo?.startsWith('http') ? settings.siteLogo : `https://decorabake.com.au${settings.siteLogo || '/logo.png'}`,
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": settings.contactPhone || "+61-1300-123-456",
                "contactType": "customer service",
                "email": settings.contactEmail || "hello@decorabake.com.au"
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": settings.address || "Sydney, NSW, Australia",
                "addressCountry": "AU"
            },
            ...(sameAs.length > 0 ? { "sameAs": sameAs } : {})
        })

        return () => {
            const el = document.querySelector('script[data-seo="organization"]')
            if (el) el.remove()
        }
    }, [settings])

    return (
        <div className="home-page">
            {sections.heroSlider && <HeroSlider />}
            {sections.trustFeatures && <TrustFeatures />}
            {sections.featuredProducts && <FeaturedProducts />}
            {sections.categoryCircles && <CategoryCircles />}
            {sections.productGrid && <ProductGrid title="Latest Products" limit={8} />}
            {sections.promoSection && <PromoSection />}
            {sections.testimonials && <Testimonials />}
        </div>
    )
}

export default Home
