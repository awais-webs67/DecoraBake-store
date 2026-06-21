import { useState, useEffect, useRef } from 'react'
import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'

// Template definitions for structured page editing
const PAGE_TEMPLATES = {
    contact: {
        label: '📞 Contact Page',
        fields: [
            { key: 'heroTitle', label: 'Hero Title', type: 'text', default: 'Get in Touch' },
            { key: 'heroSubtitle', label: 'Hero Subtitle', type: 'text', default: "We'd love to hear from you! Whether you have a question, feedback, or just want to say hello." },
            { key: 'email', label: 'Contact Email', type: 'text', default: 'hello@decorabake.com.au' },
            { key: 'phone', label: 'Phone Number', type: 'text', default: '1300 123 456' },
            { key: 'address', label: 'Address', type: 'text', default: 'Sydney, NSW, Australia' },
            { key: 'businessHours', label: 'Business Hours (one per line)', type: 'textarea', rows: 3, default: 'Mon - Fri: 9:00 AM - 5:00 PM AEST\nSat: 10:00 AM - 2:00 PM AEST\nSun: Closed' }
        ]
    },
    privacy: {
        label: '🔒 Privacy Policy',
        fields: [
            { key: 'lastUpdated', label: 'Last Updated Date', type: 'text', default: '' },
            { key: 'informationCollect', label: 'Information We Collect', type: 'textarea', rows: 6 },
            { key: 'howWeUse', label: 'How We Use Your Information', type: 'textarea', rows: 6 },
            { key: 'cookies', label: 'Cookies & Tracking', type: 'textarea', rows: 5 },
            { key: 'thirdParty', label: 'Third-Party Services', type: 'textarea', rows: 5 },
            { key: 'dataSecurity', label: 'Data Security', type: 'textarea', rows: 5 },
            { key: 'yourRights', label: 'Your Rights', type: 'textarea', rows: 5 },
            { key: 'dataRetention', label: 'Data Retention', type: 'textarea', rows: 4 },
            { key: 'contactUs', label: 'Contact Information', type: 'textarea', rows: 4 }
        ]
    },
    terms: {
        label: '📄 Terms of Service',
        fields: [
            { key: 'lastUpdated', label: 'Last Updated Date', type: 'text', default: '' },
            { key: 'acceptance', label: 'Acceptance of Terms', type: 'textarea', rows: 5 },
            { key: 'products', label: 'Products & Pricing', type: 'textarea', rows: 5 },
            { key: 'orders', label: 'Orders & Payment', type: 'textarea', rows: 5 },
            { key: 'shipping', label: 'Shipping & Delivery', type: 'textarea', rows: 5 },
            { key: 'returns', label: 'Returns & Refunds', type: 'textarea', rows: 5 },
            { key: 'intellectualProperty', label: 'Intellectual Property', type: 'textarea', rows: 4 },
            { key: 'liability', label: 'Limitation of Liability', type: 'textarea', rows: 4 },
            { key: 'governingLaw', label: 'Governing Law', type: 'textarea', rows: 4 },
            { key: 'contact', label: 'Contact Information', type: 'textarea', rows: 3 }
        ]
    },
    'shipping-policy': {
        label: '🚚 Shipping & Returns',
        fields: [
            { key: 'processing', label: 'Order Processing Info', type: 'textarea', rows: 3 },
            { key: 'tracking', label: 'Tracking Info', type: 'textarea', rows: 3 },
            { key: 'packaging', label: 'Packaging Info', type: 'textarea', rows: 3 },
            { key: 'returnsIntro', label: 'Returns Introduction', type: 'text', default: 'Not happy with your purchase? We offer hassle-free returns within 30 days.' },
            { key: 'returnConditions', label: 'Return Conditions (use • for bullet points)', type: 'textarea', rows: 6 }
        ]
    }
}

// Visual editor styling/formatting helper
function RichTextToolbar({ textareaRef, value, onChange }) {
    const insertTag = (before, after = '') => {
        const textarea = textareaRef.current
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selected = text.substring(start, end)
        const replacement = before + (selected || '') + after
        const newValue = text.substring(0, start) + replacement + text.substring(end)
        onChange(newValue)
        
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 0))
        }, 0)
    }

    const buttons = [
        { label: 'Bold', icon: 'B', before: '<strong>', after: '</strong>', title: 'Bold Text' },
        { label: 'Italic', icon: 'I', before: '<em>', after: '</em>', title: 'Italic Text' },
        { label: 'H2', icon: 'H2', before: '<h2>', after: '</h2>', title: 'Heading 2' },
        { label: 'H3', icon: 'H3', before: '<h3>', after: '</h3>', title: 'Heading 3' },
        { label: 'Link', icon: '🔗 Link', before: '<a href="/products">', after: '</a>', title: 'Insert Backlink' },
        { label: 'Bullet List', icon: '• List', before: '<ul>\n  <li>', after: '</li>\n</ul>', title: 'Unordered List' },
        { label: 'List Item', icon: '+ Item', before: '<li>', after: '</li>', title: 'List Item' },
        { label: 'Paragraph', icon: 'P', before: '<p>', after: '</p>', title: 'Paragraph Block' }
    ]

    return (
        <div style={{ display: 'flex', gap: '6px', background: '#f8f8f8', padding: '8px 12px', border: '2px solid #e5e5e5', borderBottom: 'none', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {buttons.map(btn => (
                <button
                    key={btn.label}
                    type="button"
                    title={btn.title}
                    onClick={() => insertTag(btn.before, btn.after)}
                    style={{
                        padding: '6px 12px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        color: '#444'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f0f0f0'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                >
                    {btn.icon}
                </button>
            ))}
        </div>
    )
}

function Pages() {
    const [pages, setPages] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [tab, setTab] = useState('pages')
    const [form, setForm] = useState({ slug: '', title: '', content: '', type: 'page', isPublished: true, excerpt: '', featuredImage: '' })
    const [templateFields, setTemplateFields] = useState({})
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editorMode, setEditorMode] = useState('write') // 'write' or 'preview'
    
    const textareaRef = useRef(null)

    useEffect(() => { fetchPages() }, [])

    const fetchPages = () => {
        adminApi.get('/api/admin/pages')
            .then(data => { setPages(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const isTemplatePage = (slug) => !!PAGE_TEMPLATES[slug]

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            let submitForm = { ...form }

            // If it's a template page, serialize the structured fields as JSON
            if (isTemplatePage(form.slug)) {
                submitForm.content = JSON.stringify(templateFields)
            }

            if (editing) {
                await adminApi.put(`/api/admin/pages/${editing}`, submitForm)
            } else {
                await adminApi.post('/api/admin/pages', submitForm)
            }
            setMessage(editing ? '✓ Content saved successfully!' : '✓ Created successfully!')
            resetForm()
            fetchPages()
            setTimeout(() => setMessage(''), 4000)
        } catch (err) { setMessage('Error saving') }
    }

    const resetForm = () => {
        setEditing(null)
        setForm({ slug: '', title: '', content: '', type: tab === 'blog' ? 'blog' : 'page', isPublished: true, excerpt: '', featuredImage: '' })
        setTemplateFields({})
        setIsEditing(false)
        setEditorMode('write')
    }

    const handleEdit = (page) => {
        setEditing(page._id)
        setTab(page.type === 'blog' ? 'blog' : 'pages')
        setIsEditing(true)
        setEditorMode('write')

        const newForm = {
            slug: page.slug,
            title: page.title,
            content: page.content || '',
            type: page.type,
            isPublished: page.isPublished,
            excerpt: page.excerpt || '',
            featuredImage: page.featuredImage || ''
        }
        setForm(newForm)

        // If it's a template page, parse the JSON content into fields
        if (isTemplatePage(page.slug)) {
            try {
                const parsed = JSON.parse(page.content || '{}')
                setTemplateFields(parsed)
            } catch {
                setTemplateFields({})
            }
        } else {
            setTemplateFields({})
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this permanently?')) return
        await adminApi.delete(`/api/admin/pages/${id}`)
        fetchPages()
        setMessage('✓ Deleted successfully')
        setTimeout(() => setMessage(''), 3000)
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append('image', file)
        try {
            const data = await adminApi.upload('/api/upload', formData)
            if (data.url) setForm({ ...form, featuredImage: data.url })
        } catch (err) { console.error('Upload failed') }
        setUploading(false)
    }

    const handleTemplateSelect = (slug) => {
        const template = PAGE_TEMPLATES[slug]
        const defaults = {}
        template.fields.forEach(f => { if (f.default) defaults[f.key] = f.default })
        setForm({ ...form, slug, title: template.label.replace(/^[^\s]+\s/, ''), type: 'page' })
        setTemplateFields(defaults)
    }

    const filteredPages = pages.filter(p => tab === 'blog' ? p.type === 'blog' : p.type === 'page')

    if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>

    const currentTemplate = PAGE_TEMPLATES[form.slug]

    // Editing View (Full Width Editor)
    if (isEditing) {
        return (
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                            {editing ? `✏️ Edit ${tab === 'blog' ? 'Blog Post' : 'Page'}` : `➕ New ${tab === 'blog' ? 'Blog Post' : 'Page'}`}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#888' }}>
                            {editing ? 'Modify the selected content settings' : 'Compose a new post or page layout'}
                        </p>
                    </div>
                    <button onClick={resetForm} style={{ padding: '10px 20px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                        ← Back to List
                    </button>
                </div>

                {message && (
                    <div style={{ padding: '14px 20px', background: message.includes('Error') ? '#FEE2E2' : '#ECFDF5', color: message.includes('Error') ? '#DC2626' : '#059669', borderRadius: '10px', marginBottom: '20px', fontWeight: '500' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
                    {/* Left Column: Title & Main Editor */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Title *</label>
                            <input 
                                type="text" 
                                value={form.title} 
                                onChange={e => setForm({ ...form, title: e.target.value })} 
                                placeholder={tab === 'blog' ? 'Enter a catchy blog title...' : 'Page Title'} 
                                required 
                                style={{ ...inputStyle, fontSize: '18px', fontWeight: '600', padding: '14px 16px' }} 
                            />
                        </div>

                        {currentTemplate && tab === 'pages' ? (
                            <div>
                                <div style={{ background: '#F3E8FF', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🎨</span>
                                    <span style={{ fontSize: '13px', color: '#6B21A8', fontWeight: '500' }}>Template mode — edit content fields below. The page UI/layout is fixed and cannot be changed.</span>
                                </div>
                                {currentTemplate.fields.map(field => (
                                    <div key={field.key} style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>{field.label}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={templateFields[field.key] || ''}
                                                onChange={e => setTemplateFields({ ...templateFields, [field.key]: e.target.value })}
                                                placeholder={field.default || `Enter ${field.label.toLowerCase()}...`}
                                                rows={field.rows || 4}
                                                style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={templateFields[field.key] || ''}
                                                onChange={e => setTemplateFields({ ...templateFields, [field.key]: e.target.value })}
                                                placeholder={field.default || `Enter ${field.label.toLowerCase()}...`}
                                                style={inputStyle}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* WordPress Style Visual Editor / HTML Toggle Editor */
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={labelStyle}>Content</label>
                                    {/* Editor Mode Toggles */}
                                    <div style={{ display: 'flex', gap: '4px', background: '#f0f0f0', borderRadius: '8px', padding: '2px' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setEditorMode('write')} 
                                            style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: editorMode === 'write' ? '#fff' : 'transparent', color: editorMode === 'write' ? '#6B2346' : '#666', boxShadow: editorMode === 'write' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                                        >
                                            ✍️ Write
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setEditorMode('preview')} 
                                            style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: editorMode === 'preview' ? '#fff' : 'transparent', color: editorMode === 'preview' ? '#6B2346' : '#666', boxShadow: editorMode === 'preview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                                        >
                                            👁️ Preview
                                        </button>
                                    </div>
                                </div>

                                {editorMode === 'write' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <RichTextToolbar textareaRef={textareaRef} value={form.content} onChange={(val) => setForm({ ...form, content: val })} />
                                        <textarea
                                            ref={textareaRef}
                                            value={form.content}
                                            onChange={e => setForm({ ...form, content: e.target.value })}
                                            placeholder={`<h2>Write beautiful paragraphs...</h2>\n<p>Connect with your baking audience.</p>`}
                                            rows="16"
                                            style={{ 
                                                ...inputStyle, 
                                                borderTopLeftRadius: 0, 
                                                borderTopRightRadius: 0, 
                                                resize: 'vertical', 
                                                fontFamily: 'monospace', 
                                                fontSize: '14px', 
                                                lineHeight: '1.6',
                                                padding: '16px' 
                                            }}
                                        />
                                        <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>Format with the toolbar above or write HTML. Make sure to embed links to products or categories to boost your SEO backlinks!</p>
                                    </div>
                                ) : (
                                    <div 
                                        style={{ 
                                            padding: '20px', 
                                            border: '2px solid #e5e5e5', 
                                            borderRadius: '10px', 
                                            minHeight: '360px', 
                                            maxHeight: '500px',
                                            background: '#fafafa', 
                                            overflowY: 'auto',
                                            fontSize: '16px',
                                            lineHeight: '1.8',
                                            color: '#333'
                                        }} 
                                        className="blog-preview-content"
                                        dangerouslySetInnerHTML={{ __html: form.content || '<p style="color: #888; font-style: italic;">No content to preview yet.</p>' }} 
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Settings & Publish Box */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Publish Box */}
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>Publish Settings</h4>
                            
                            {/* URL Slug */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>URL Slug *</label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                    placeholder={tab === 'pages' ? 'about, contact' : 'how-to-bake-cookies'}
                                    required
                                    readOnly={editing && isTemplatePage(form.slug)}
                                    style={{ ...inputStyle, ...(editing && isTemplatePage(form.slug) ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}) }}
                                />
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>Live Link: /{form.slug || 'example'}</p>
                            </div>

                            {/* Status toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <input type="checkbox" id="published" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                <label htmlFor="published" style={{ fontSize: '14px', color: '#333', fontWeight: '500', cursor: 'pointer' }}>Visible on site (Published)</label>
                            </div>

                            <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6B2346 0%, #3d1529 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(107,35,70,0.2)' }}>
                                {editing ? '✓ Save Changes' : `🚀 Publish ${tab === 'blog' ? 'Post' : 'Page'}`}
                            </button>
                            
                            <button type="button" onClick={resetForm} style={{ width: '100%', padding: '12px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', fontSize: '13px' }}>
                                Cancel & Discard
                            </button>
                        </div>

                        {/* Page / Blog specific settings box */}
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>Media & Metadata</h4>
                            
                            {tab === 'pages' && !editing && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Quick Start Templates</label>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {Object.entries(PAGE_TEMPLATES).map(([slug, tmpl]) => (
                                            <button
                                                key={slug}
                                                type="button"
                                                onClick={() => handleTemplateSelect(slug)}
                                                style={{
                                                    padding: '8px 12px', borderRadius: '8px', border: form.slug === slug ? '2px solid #6B2346' : '1px solid #ddd',
                                                    background: form.slug === slug ? '#FCE8ED' : '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                                                    color: form.slug === slug ? '#6B2346' : '#555'
                                                }}
                                            >
                                                {tmpl.label.split(' ')[1]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tab === 'blog' && (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Featured Image</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {form.featuredImage && (
                                                <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                    <img src={form.featuredImage.startsWith('/uploads') ? `${API_BASE_URL}${form.featuredImage}` : form.featuredImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => setForm({ ...form, featuredImage: '' })} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>×</button>
                                                </div>
                                            )}
                                            <label style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#555' }}>
                                                {uploading ? 'Uploading image...' : '📸 Select Image'}
                                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Excerpt / Short Summary</label>
                                        <textarea 
                                            value={form.excerpt} 
                                            onChange={e => setForm({ ...form, excerpt: e.target.value })} 
                                            placeholder="Write a brief, catchy summary of the post..." 
                                            rows="3"
                                            style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        )
    }

    // Default Listing View
    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>📄 Pages & Blog</h1>
                    <p style={{ fontSize: '14px', color: '#888' }}>Manage your website content and blog posts</p>
                </div>
                <button 
                    onClick={() => {
                        setIsEditing(true)
                        setEditing(null)
                        setForm({ slug: '', title: '', content: '', type: tab === 'blog' ? 'blog' : 'page', isPublished: true, excerpt: '', featuredImage: '' })
                    }} 
                    style={{ padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                    + Add {tab === 'blog' ? 'Blog Post' : 'Page'}
                </button>
            </div>

            {message && (
                <div style={{ padding: '14px 20px', background: message.includes('Error') ? '#FEE2E2' : '#ECFDF5', color: message.includes('Error') ? '#DC2626' : '#059669', borderRadius: '10px', marginBottom: '20px', fontWeight: '500' }}>
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button onClick={() => { setTab('pages'); resetForm() }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: tab === 'pages' ? '#6B2346' : '#f0f0f0', color: tab === 'pages' ? '#fff' : '#555' }}>
                    📑 Pages
                </button>
                <button onClick={() => { setTab('blog'); setForm({ ...form, type: 'blog' }); setEditing(null); setTemplateFields({}) }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: tab === 'blog' ? '#6B2346' : '#f0f0f0', color: tab === 'blog' ? '#fff' : '#555' }}>
                    ✍️ Blog Posts
                </button>
            </div>

            {/* Full Width Table/List of Pages/Blogs */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{tab === 'pages' ? 'Website Pages' : 'Blog Posts'}</h3>
                    <span style={{ fontSize: '13px', color: '#888' }}>{filteredPages.length} items</span>
                </div>

                {filteredPages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{tab === 'blog' ? '✍️' : '📑'}</div>
                        <p style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '500' }}>No {tab === 'blog' ? 'blog posts' : 'pages'} yet</p>
                        <button 
                            onClick={() => {
                                setIsEditing(true)
                                setEditing(null)
                                setForm({ slug: '', title: '', content: '', type: tab === 'blog' ? 'blog' : 'page', isPublished: true, excerpt: '', featuredImage: '' })
                            }} 
                            style={{ padding: '10px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                        >
                            Create First One
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredPages.map(page => (
                            <div key={page._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#fafafa', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
                                {page.featuredImage && (
                                    <img src={page.featuredImage.startsWith('/uploads') ? `${API_BASE_URL}${page.featuredImage}` : page.featuredImage} alt="" style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px', background: '#fff' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <strong style={{ fontSize: '15px', color: '#222' }}>{page.title}</strong>
                                        {isTemplatePage(page.slug) && (
                                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: '#EDE9FE', color: '#7C3AED' }}>Template</span>
                                        )}
                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: page.isPublished ? '#ECFDF5' : '#FEF3C7', color: page.isPublished ? '#059669' : '#D97706' }}>
                                            {page.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code style={{ fontSize: '12px', color: '#888', background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #eee' }}>/{page.slug}</code>
                                        <span style={{ fontSize: '12px', color: '#aaa' }}>&middot;</span>
                                        <span style={{ fontSize: '12px', color: '#888' }}>Last updated: {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleEdit(page)} style={{ padding: '8px 16px', background: '#E0F2FE', color: '#0369A1', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Edit</button>
                                    <button onClick={() => handleDelete(page._id)} style={{ padding: '8px 16px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px 14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }

export default Pages
