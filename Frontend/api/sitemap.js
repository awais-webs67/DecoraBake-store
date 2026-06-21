export default async function handler(req, res) {
    const backendUrl = process.env.VITE_API_URL || 'http://localhost:3001'
    try {
        const response = await fetch(`${backendUrl}/sitemap.xml`)
        if (!response.ok) {
            return res.status(response.status).send('Sitemap fetch failed')
        }
        const xml = await response.text()
        res.setHeader('Content-Type', 'application/xml')
        return res.status(200).send(xml)
    } catch (err) {
        return res.status(500).send('Internal sitemap proxy error: ' + err.message)
    }
}
