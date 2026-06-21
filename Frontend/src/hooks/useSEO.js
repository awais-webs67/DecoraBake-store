import { useEffect } from 'react'
export function useSEO({ title, description, image, url, type = 'website', product, breadcrumbs } = {}) {
    useEffect(() => {
        // Set document title
        if (title) {
            document.title = `${title} | DecoraBake`
        }
        // Set or update meta tags
        const setMeta = (name, content) => {
            if (!content) return
            let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`)
            if (!el) {
                el = document.createElement('meta')
                if (name.startsWith('og:') || name.startsWith('article:')) {
                    el.setAttribute('property', name)
                } else {
                    el.setAttribute('name', name)
                }
                document.head.appendChild(el)
            }
            el.setAttribute('content', content)
        }
        if (description) setMeta('description', description)

        // Canonical tag
        const canonicalUrl = `https://decorabake.com.au${url || '/'}`
        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', canonicalUrl)

        // Open Graph
        if (title) setMeta('og:title', title)
        if (description) setMeta('og:description', description)
        // Ensure og:image is always absolute
        if (image) {
            const absImage = image.startsWith('http') ? image : `https://decorabake.com.au${image}`
            setMeta('og:image', absImage)
            setMeta('twitter:image', absImage)
        }
        if (url) setMeta('og:url', `https://decorabake.com.au${url}`)
        if (type) setMeta('og:type', type)
        setMeta('og:site_name', 'DecoraBake')
        // Twitter
        setMeta('twitter:card', 'summary_large_image')
        if (title) setMeta('twitter:title', title)
        if (description) setMeta('twitter:description', description)
        // Product structured data
        if (product && type === 'product') {
            let scriptEl = document.querySelector('script[data-seo="product"]')
            if (!scriptEl) {
                scriptEl = document.createElement('script')
                scriptEl.type = 'application/ld+json'
                scriptEl.setAttribute('data-seo', 'product')
                document.head.appendChild(scriptEl)
            }
            scriptEl.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "image": product.images || [product.image],
                "description": product.description,
                "sku": product.sku,
                "brand": { "@type": "Brand", "name": "DecoraBake" },
                "offers": {
                    "@type": "Offer",
                    "url": `https://decorabake.com.au/product/${product.id}`,
                    "priceCurrency": "AUD",
                    "price": product.salePrice || product.price,
                    "availability": (product.stock === undefined || product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "itemCondition": "https://schema.org/NewCondition"
                },
                ...(product.reviewCount > 0 ? {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": product.rating,
                        "reviewCount": product.reviewCount
                    }
                } : {})
            })
        }
        // Breadcrumbs structured data
        if (breadcrumbs && breadcrumbs.length > 0) {
            let scriptEl = document.querySelector('script[data-seo="breadcrumbs"]')
            if (!scriptEl) {
                scriptEl = document.createElement('script')
                scriptEl.type = 'application/ld+json'
                scriptEl.setAttribute('data-seo', 'breadcrumbs')
                document.head.appendChild(scriptEl)
            }
            scriptEl.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs.map((crumb, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": crumb.name,
                    ...(crumb.url ? { "item": `https://decorabake.com.au${crumb.url}` } : {})
                }))
            })
        }
        // Cleanup structured data on unmount
        return () => {
            document.querySelectorAll('script[data-seo]').forEach(el => el.remove())
        }
    }, [title, description, image, url, type, product, breadcrumbs])
}
