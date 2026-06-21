import { Product, Category, Page } from './models.js'

const generateSitemap = async (req, res) => {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'https://decorabake.com.au'
        const products = await Product.find({ enabled: { $ne: false } }).select('_id updatedAt').lean()
        const categories = await Category.find().select('slug updatedAt').lean()
        const pages = await Page.find({ isPublished: true }).select('slug type updatedAt').lean()

        const staticPages = [
            { url: '/', freq: 'daily', priority: '1.0' },
            { url: '/products', freq: 'daily', priority: '0.8' },
            { url: '/about', freq: 'monthly', priority: '0.6' },
            { url: '/contact', freq: 'monthly', priority: '0.6' },
            { url: '/blog', freq: 'weekly', priority: '0.6' },
            { url: '/privacy', freq: 'yearly', priority: '0.3' },
            { url: '/terms', freq: 'yearly', priority: '0.3' },
            { url: '/shipping-policy', freq: 'yearly', priority: '0.3' },
        ]

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

        staticPages.forEach(p => {
            xml += `  <url><loc>${baseUrl}${p.url}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>\n`
        })

        categories.forEach(c => {
            const lastmod = c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : ''
            xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
        })

        products.forEach(p => {
            const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : ''
            xml += `  <url><loc>${baseUrl}/product/${p._id}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
        })

        pages.forEach(p => {
            const prefix = p.type === 'blog' ? '/blog' : ''
            const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : ''
            xml += `  <url><loc>${baseUrl}${prefix}/${p.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.5</priority></url>\n`
        })

        xml += `</urlset>`
        res.set('Content-Type', 'application/xml')
        res.send(xml)
    } catch (err) {
        console.error('Sitemap generation error:', err)
        res.status(500).send('Error generating sitemap')
    }
}

export default generateSitemap
