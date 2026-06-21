import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import API_BASE_URL from '../config/api'

function Blog() {
    const { slug } = useParams()
    const [posts, setPosts] = useState([])
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({})
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newsletterEmail, setNewsletterEmail] = useState('')
    const [newsletterStatus, setNewsletterStatus] = useState('')
    
    // UI Interaction states
    const [hoveredCard, setHoveredCard] = useState(null)
    const [hoveredRecent, setHoveredRecent] = useState(null)
    const [isSubscribeHovered, setIsSubscribeHovered] = useState(false)

    const categories = ['All', 'Tutorials', 'Tips & Tricks', 'Recipes', 'Product Guides', 'Inspiration']

    const handleNewsletterSubmit = async () => {
        if (!newsletterEmail || !newsletterEmail.includes('@')) { setNewsletterStatus('error'); return }
        try {
            const res = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newsletterEmail })
            })
            if (res.ok) { setNewsletterStatus('success'); setNewsletterEmail('') }
            else setNewsletterStatus('error')
        } catch { setNewsletterStatus('error') }
        setTimeout(() => setNewsletterStatus(''), 4000)
    }

    useEffect(() => {
        setLoading(true)
        if (slug) {
            // Single blog post
            Promise.all([
                fetch(`${API_BASE_URL}/api/pages/${slug}`).then(r => r.json()).catch(() => null),
                fetch(`${API_BASE_URL}/api/blog`).then(r => r.json()).catch(() => []),
                fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
            ]).then(([pageData, blogData, settingsData]) => {
                if (pageData && !pageData.error) setPost(pageData)
                setPosts(Array.isArray(blogData) ? blogData : [])
                setSettings(settingsData || {})
                setLoading(false)
            })
        } else {
            // Blog listing
            Promise.all([
                fetch(`${API_BASE_URL}/api/blog`).then(r => r.json()).catch(() => []),
                fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({}))
            ]).then(([blogData, settingsData]) => {
                setPosts(Array.isArray(blogData) ? blogData : [])
                setSettings(settingsData || {})
                setLoading(false)
            })
        }
    }, [slug])

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid #f3f3f3', borderTop: '3px solid #6B2346', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // Single blog post view
    if (slug && post) {
        const recentPosts = posts.filter(p => p.slug !== slug).slice(0, 4)
        
        // Calculate reading time
        const wordCount = post.content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0
        const readTime = Math.max(1, Math.ceil(wordCount / 200))

        return (
            <div style={{ minHeight: '100vh', background: '#fafafa', color: '#1F1A1C' }}>
                {/* CSS Typography injection for rich HTML output */}
                <style>{`
                    .blog-content-body h2 {
                        font-size: 28px;
                        color: #6B2346;
                        margin-top: 40px;
                        margin-bottom: 18px;
                        font-weight: 700;
                        letter-spacing: -0.5px;
                        line-height: 1.3;
                    }
                    .blog-content-body h3 {
                        font-size: 22px;
                        color: #3d1529;
                        margin-top: 32px;
                        margin-bottom: 14px;
                        font-weight: 600;
                    }
                    .blog-content-body p {
                        font-size: 16px;
                        line-height: 1.9;
                        color: #4A4A4A;
                        margin-bottom: 24px;
                    }
                    .blog-content-body ul, .blog-content-body ol {
                        margin-bottom: 24px;
                        padding-left: 24px;
                    }
                    .blog-content-body li {
                        margin-bottom: 10px;
                        color: #4A4A4A;
                        line-height: 1.8;
                    }
                    .blog-content-body strong {
                        color: #1F1A1C;
                    }
                    .blog-content-body a {
                        color: #6B2346;
                        text-decoration: none;
                        font-weight: 600;
                        border-bottom: 2px solid rgba(107, 35, 70, 0.2);
                        transition: all 0.2s ease;
                    }
                    .blog-content-body a:hover {
                        border-bottom-color: #6B2346;
                        background: rgba(107, 35, 70, 0.05);
                    }
                    .blog-content-body blockquote {
                        border-left: 4px solid #6B2346;
                        padding-left: 24px;
                        margin: 36px 0;
                        font-style: italic;
                        color: #555;
                        font-size: 18px;
                        line-height: 1.7;
                    }
                `}</style>

                {/* Hero / Header banner */}
                <div style={{ background: 'linear-gradient(135deg, #3d1529 0%, #1F1A1C 100%)', padding: '90px 20px 70px', position: 'relative', overflow: 'hidden' }}>
                    {/* Background decorations */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,35,70,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,35,70,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    
                    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', marginBottom: '24px', fontWeight: '500', transition: 'color 0.2s ease' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.7)'}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                            Back to Blog Listing
                        </Link>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(107,35,70,0.6)', color: '#fff', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Baking Insights
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
                                {new Date(post.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                {readTime} min read
                            </span>
                        </div>
                        
                        <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#ffffff', lineHeight: '1.25', marginBottom: '20px', letterSpacing: '-0.8px' }}>{post.title}</h1>
                        {post.excerpt && (
                            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontWeight: '400', maxWidth: '800px' }}>{post.excerpt}</p>
                        )}
                    </div>
                </div>

                {/* Main Content Layout */}
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px 100px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', alignItems: 'start' }}>
                        
                        {/* Article body */}
                        <article style={{ background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 30px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                            {post.featuredImage && (
                                <div style={{ width: '100%', height: '420px', borderRadius: '16px', overflow: 'hidden', marginBottom: '36px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                                    <img
                                        src={post.featuredImage.startsWith('/uploads') ? `${API_BASE_URL}${post.featuredImage}` : post.featuredImage}
                                        alt={post.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            
                            <div className="blog-content-body" dangerouslySetInnerHTML={{ __html: post.content }} />

                            {/* Share & Social */}
                            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '50px', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#666' }}>Share:</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', background: '#3b5998', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
                                        </a>
                                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M18.205 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.044 19.77h1.833L7.045 4.126H5.078Z" /></svg>
                                        </a>
                                        <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', background: '#E60023', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2Z" /></svg>
                                        </a>
                                    </div>
                                </div>
                                <span style={{ fontSize: '13px', color: '#999' }}>Last updated: {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}</span>
                            </div>
                        </article>

                        {/* Sidebar */}
                        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Author Box */}
                            <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#6B2346', borderBottom: '2px solid #FCE8ED', paddingBottom: '8px' }}>About {settings.siteName || 'DecoraBake'}</h3>
                                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7', margin: 0 }}>
                                    We are Australia's premier destination for high-quality cake decorating stencils, baking molds, and professional pastry tools. Happy baking!
                                </p>
                            </div>

                            {/* Recent Posts */}
                            {recentPosts.length > 0 && (
                                <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#6B2346', borderBottom: '2px solid #FCE8ED', paddingBottom: '8px' }}>Recent Articles</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {recentPosts.map(p => (
                                            <Link 
                                                key={p._id} 
                                                to={`/blog/${p.slug}`} 
                                                style={{ 
                                                    display: 'flex', 
                                                    gap: '12px',
                                                    textDecoration: 'none', 
                                                    transition: 'opacity 0.2s ease',
                                                    opacity: hoveredRecent === p._id ? 0.8 : 1
                                                }}
                                                onMouseOver={() => setHoveredRecent(p._id)}
                                                onMouseOut={() => setHoveredRecent(null)}
                                            >
                                                {p.featuredImage && (
                                                    <img src={p.featuredImage} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', background: '#fafafa', border: '1px solid #f0f0f0' }} />
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#333', margin: '0 0 4px', lineHeight: '1.3' }}>{p.title}</h4>
                                                    <span style={{ fontSize: '11px', color: '#999' }}>{new Date(p.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        )
    }

    // Blog listing view
    // Filter logic
    const filteredPosts = posts.filter(p => {
        const matchesSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || selectedCategory === 'All' || p.title.toLowerCase().includes(selectedCategory.toLowerCase()) || p.content.toLowerCase().includes(selectedCategory.toLowerCase()) || p.excerpt?.toLowerCase().includes(selectedCategory.toLowerCase())
        return matchesSearch && matchesCategory
    })

    const featuredPost = filteredPosts[0]
    const gridPosts = filteredPosts.slice(1)

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', color: '#1F1A1C' }}>
            {/* Listing Hero */}
            <div style={{ background: 'linear-gradient(135deg, #3d1529 0%, #1F1A1C 100%)', padding: '100px 20px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,35,70,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-block', background: 'rgba(107,35,70,0.4)', padding: '6px 18px', borderRadius: '50px', marginBottom: '20px', border: '1px solid rgba(107,35,70,0.2)' }}>
                        <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>DecoraBake Gazette</span>
                    </div>
                    <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.8px' }}>Baking Insights & Creative Guides</h1>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                        Professional tips, techniques, and recipes directly from our expert pastry chefs.
                    </p>
                </div>
            </div>

            {/* Main Listing Layout */}
            <div style={{ maxWidth: '1100px', margin: '-40px auto 0', padding: '0 20px 100px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start' }}>
                    
                    {/* Posts Column */}
                    <div>
                        {/* Interactive Category Filter Bar */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px', background: '#fff', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '50px',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        background: (selectedCategory === cat || (cat === 'All' && !selectedCategory)) ? '#6B2346' : '#f5f5f5',
                                        color: (selectedCategory === cat || (cat === 'All' && !selectedCategory)) ? '#fff' : '#555',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={e => {
                                        if (selectedCategory !== cat && !(cat === 'All' && !selectedCategory)) {
                                            e.currentTarget.style.background = '#e8e8e8'
                                        }
                                    }}
                                    onMouseOut={e => {
                                        if (selectedCategory !== cat && !(cat === 'All' && !selectedCategory)) {
                                            e.currentTarget.style.background = '#f5f5f5'
                                        }
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {filteredPosts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                
                                {/* Featured Post (Large Top Banner) */}
                                {featuredPost && !selectedCategory && !searchTerm && (
                                    <Link to={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none' }}>
                                        <article 
                                            style={{ 
                                                background: '#fff', 
                                                borderRadius: '24px', 
                                                overflow: 'hidden', 
                                                border: '1px solid #f0f0f0',
                                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                                                transform: hoveredCard === featuredPost._id ? 'translateY(-6px)' : 'none',
                                                boxShadow: hoveredCard === featuredPost._id ? '0 20px 40px rgba(107,35,70,0.08)' : '0 10px 40px rgba(0,0,0,0.04)'
                                            }}
                                            onMouseOver={() => setHoveredCard(featuredPost._id)}
                                            onMouseOut={() => setHoveredCard(null)}
                                        >
                                            <div style={{ height: '360px', overflow: 'hidden', background: '#FCE8ED', position: 'relative' }}>
                                                {featuredPost.featuredImage ? (
                                                    <img 
                                                        src={featuredPost.featuredImage} 
                                                        alt={featuredPost.title} 
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.5s ease',
                                                            transform: hoveredCard === featuredPost._id ? 'scale(1.03)' : 'scale(1)'
                                                        }} 
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>🍰</div>
                                                )}
                                                <div style={{ position: 'absolute', top: '20px', left: '20px', background: '#6B2346', color: '#fff', padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Featured Article
                                                </div>
                                            </div>
                                            
                                            <div style={{ padding: '36px' }}>
                                                <span style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    {new Date(featuredPost.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1F1A1C', marginTop: '12px', marginBottom: '14px', lineHeight: '1.3', letterSpacing: '-0.5px' }}>
                                                    {featuredPost.title}
                                                </h2>
                                                <p style={{ fontSize: '16px', color: '#555', lineHeight: '1.7', margin: '0 0 24px' }}>
                                                    {featuredPost.excerpt || featuredPost.content?.replace(/<[^>]*>/g, '').substring(0, 180) + '...'}
                                                </p>
                                                <div style={{ color: '#6B2346', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    Read Article
                                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ transition: 'transform 0.2s ease', transform: hoveredCard === featuredPost._id ? 'translateX(4px)' : 'none' }}><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                )}

                                {/* Secondary Articles Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                                    {(selectedCategory || searchTerm ? filteredPosts : gridPosts).map(p => (
                                        <Link key={p._id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                                            <article 
                                                style={{ 
                                                    background: '#fff', 
                                                    borderRadius: '20px', 
                                                    overflow: 'hidden', 
                                                    border: '1px solid #f0f0f0',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                                                    transform: hoveredCard === p._id ? 'translateY(-6px)' : 'none',
                                                    boxShadow: hoveredCard === p._id ? '0 16px 30px rgba(107,35,70,0.06)' : '0 8px 24px rgba(0,0,0,0.03)'
                                                }}
                                                onMouseOver={() => setHoveredCard(p._id)}
                                                onMouseOut={() => setHoveredCard(null)}
                                            >
                                                <div style={{ height: '200px', overflow: 'hidden', background: '#FCE8ED', position: 'relative' }}>
                                                    {p.featuredImage ? (
                                                        <img 
                                                            src={p.featuredImage} 
                                                            alt={p.title} 
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '100%', 
                                                                objectFit: 'cover',
                                                                transition: 'transform 0.5s ease',
                                                                transform: hoveredCard === p._id ? 'scale(1.03)' : 'scale(1)'
                                                            }} 
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' }}>📝</div>
                                                    )}
                                                </div>
                                                
                                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '600' }}>
                                                            {new Date(p.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1F1A1C', marginTop: '10px', marginBottom: '10px', lineHeight: '1.4' }}>
                                                            {p.title}
                                                        </h3>
                                                        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {p.excerpt || p.content?.replace(/<[^>]*>/g, '').substring(0, 120) + '...'}
                                                        </p>
                                                    </div>
                                                    <div style={{ color: '#6B2346', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        Read Article
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ transition: 'transform 0.2s ease', transform: hoveredCard === p._id ? 'translateX(3px)' : 'none' }}><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#fff', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', border: '1px solid #f0f0f0', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#FCE8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', fontSize: '50px' }}>✍️</div>
                                <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px', color: '#222' }}>No articles match your criteria</h2>
                                <p style={{ fontSize: '16px', color: '#666', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                                    We couldn't find any blog posts matching your search or category choice. Try resetting filters!
                                </p>
                                <button onClick={() => { setSearchTerm(''); setSelectedCategory('') }} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: '600', cursor: 'pointer' }}>
                                    Show All Articles
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Search Widget */}
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Blog</h3>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px 12px 42px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = '#6B2346'}
                                    onBlur={e => e.target.style.borderColor = '#e5e5e5'}
                                />
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                            </div>
                        </div>

                        {/* Store Description Widget */}
                        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '0.5px' }}>About DecoraBake</h3>
                            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7', margin: 0 }}>
                                Professional cake decorating stencils, silicone molds, smoothers, and accessories. Designed in Australia for passionate bakers.
                            </p>
                        </div>

                        {/* Newsletter Subscribe Widget */}
                        <div style={{ background: 'linear-gradient(135deg, #3d1529 0%, #1F1A1C 100%)', borderRadius: '20px', padding: '28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>Join Our Community</h3>
                            <p style={{ fontSize: '13px', opacity: 0.85, marginBottom: '20px', lineHeight: '1.5', color: '#ffffff' }}>Subscribe to get cake recipes, decorating tutorials, and exclusive discounts.</p>
                            
                            <input 
                                type="email" 
                                placeholder="Your email address" 
                                value={newsletterEmail} 
                                onChange={e => setNewsletterEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleNewsletterSubmit()}
                                style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: '10px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }} 
                            />
                            
                            {newsletterStatus === 'success' && <p style={{ color: '#86EFAC', fontSize: '12px', margin: '0 0 10px', fontWeight: '600' }}>✓ Subscribed successfully!</p>}
                            {newsletterStatus === 'error' && <p style={{ color: '#FCA5A5', fontSize: '12px', margin: '0 0 10px', fontWeight: '600' }}>Please enter a valid email.</p>}
                            
                            <button 
                                onClick={handleNewsletterSubmit} 
                                onMouseOver={() => setIsSubscribeHovered(true)}
                                onMouseOut={() => setIsSubscribeHovered(false)}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    background: '#fff', 
                                    color: '#6B2346', 
                                    border: 'none', 
                                    borderRadius: '10px', 
                                    fontWeight: '700', 
                                    fontSize: '14px', 
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                    transform: isSubscribeHovered ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                Subscribe
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Blog
