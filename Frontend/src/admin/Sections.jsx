import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect, useRef } from 'react'

function Sections() {
    const [activeTab, setActiveTab] = useState('visibility')
    const [trustFeatures, setTrustFeatures] = useState([])
    const [promo, setPromo] = useState({ label: '', title: '', description: '', buttonText: '', buttonLink: '', image: '', enablePopup: false, popupDelay: 5, timerEnd: '' })
    const [homeSections, setHomeSections] = useState({
        heroSlider: true, trustFeatures: true, featuredProducts: true,
        categoryCircles: true, productGrid: true, promoSection: true, testimonials: true
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        // Fetch trust features
        fetch(`${API_BASE_URL}/api/sections/trust-features`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setTrustFeatures(data)
                else if (data && Array.isArray(data.data)) setTrustFeatures(data.data)
                else setTrustFeatures([])
            })
            .catch(() => setTrustFeatures([]))

        // Fetch promo
        fetch(`${API_BASE_URL}/api/sections/promo`)
            .then(r => r.json())
            .then(data => {
                if (data && typeof data === 'object') setPromo(prev => ({ ...prev, ...data }))
            })
            .catch(console.error)

        // Fetch homepage section visibility from settings
        fetch(`${API_BASE_URL}/api/settings`)
            .then(r => r.json())
            .then(data => {
                if (data?.homeSections) setHomeSections(prev => ({ ...prev, ...data.homeSections }))
            })
            .catch(() => { })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            if (activeTab === 'trust') {
                await adminApi.put('/api/sections/trust-features', trustFeatures)
            } else if (activeTab === 'promo') {
                await adminApi.put('/api/sections/promo', promo)
            } else if (activeTab === 'visibility') {
                await adminApi.put('/api/settings', { homeSections })
            }
            setMessage('Saved successfully!')
            setTimeout(() => setMessage(''), 3000)
        } catch (e) {
            setMessage('Error saving')
        }
        setSaving(false)
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const data = await adminApi.upload('/api/upload', formData)
            if (data.url) {
                setPromo(prev => ({ ...prev, image: data.url }))
            }
        } catch (err) {
            console.error('Upload failed', err)
        }
        setUploading(false)
    }

    const updateTrustFeature = (index, field, value) => {
        const updated = [...trustFeatures]
        updated[index] = { ...updated[index], [field]: value }
        setTrustFeatures(updated)
    }

    const addTrustFeature = () => {
        setTrustFeatures([...trustFeatures, { id: Date.now(), icon: 'shipping', title: '', description: '' }])
    }

    const removeTrustFeature = (index) => {
        setTrustFeatures(trustFeatures.filter((_, i) => i !== index))
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        saveBtn: { padding: '12px 28px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        message: { padding: '12px 20px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' },
        tabs: { display: 'flex', gap: '8px', marginBottom: '24px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e5e5e5' },
        tab: { padding: '12px 24px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: '#666' },
        tabActive: { background: '#6B2346', color: '#fff' },
        section: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' },
        sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '8px' },
        sectionDesc: { fontSize: '14px', color: '#666', marginBottom: '24px' },
        featureCard: { background: '#f8f8f8', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
        featureHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
        featureTitle: { fontSize: '14px', fontWeight: '600', color: '#333' },
        removeBtn: { padding: '6px 12px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
        formRow: { display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '16px', marginBottom: '12px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' },
        input: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
        select: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', background: '#fff' },
        textarea: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
        addBtn: { padding: '12px 20px', background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', width: '100%' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
        imageUpload: { width: '100%', height: '150px', border: '2px dashed #ddd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundSize: 'cover', backgroundPosition: 'center' },
        hint: { fontSize: '12px', color: '#888', marginTop: '8px' }
    }

    const iconOptions = [
        { value: 'shipping', label: '🚚 Shipping' },
        { value: 'payment', label: '💳 Payment' },
        { value: 'returns', label: '↩️ Returns' },
        { value: 'quality', label: '⭐ Quality' },
        { value: 'support', label: '💬 Support' },
        { value: 'guarantee', label: '✓ Guarantee' }
    ]

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Page Sections</h1>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && <div style={styles.message}>✓ {message}</div>}

            {/* Tabs */}
            <div style={styles.tabs}>
                <button style={{ ...styles.tab, ...(activeTab === 'visibility' ? styles.tabActive : {}) }} onClick={() => setActiveTab('visibility')}>Homepage Sections</button>
                <button style={{ ...styles.tab, ...(activeTab === 'trust' ? styles.tabActive : {}) }} onClick={() => setActiveTab('trust')}>Trust Features</button>
                <button style={{ ...styles.tab, ...(activeTab === 'promo' ? styles.tabActive : {}) }} onClick={() => setActiveTab('promo')}>Promo Banner</button>
            </div>

            {/* Homepage Section Visibility */}
            {activeTab === 'visibility' && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Homepage Section Visibility</h2>
                    <p style={styles.sectionDesc}>Show or hide sections on the homepage. Changes will take effect immediately for new visitors.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { key: 'heroSlider', label: 'Hero Slider', desc: 'Main banner carousel at the top of the page' },
                            { key: 'trustFeatures', label: 'Trust Features', desc: 'Trust badges below the hero (shipping, payment, etc.)' },
                            { key: 'featuredProducts', label: 'Featured Products', desc: 'Highlighted products section' },
                            { key: 'categoryCircles', label: 'Category Circles', desc: 'Circular category navigation' },
                            { key: 'productGrid', label: 'Latest Products Grid', desc: 'Grid showing latest products' },
                            { key: 'promoSection', label: 'Promo Section', desc: 'Promotional banner with countdown' },
                            { key: 'testimonials', label: 'Testimonials', desc: 'Customer reviews carousel' }
                        ].map(section => (
                            <div key={section.key} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 20px', background: '#f8f8f8', borderRadius: '12px',
                                border: '1px solid #eee'
                            }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '2px' }}>{section.label}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>{section.desc}</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={homeSections[section.key] !== false}
                                        onChange={e => setHomeSections(prev => ({ ...prev, [section.key]: e.target.checked }))}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '26px',
                                        background: homeSections[section.key] !== false ? '#6B2346' : '#ccc',
                                        transition: 'background 0.3s'
                                    }}>
                                        <span style={{
                                            position: 'absolute', content: '""', height: '20px', width: '20px',
                                            left: homeSections[section.key] !== false ? '25px' : '3px',
                                            bottom: '3px', background: '#fff', borderRadius: '50%',
                                            transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trust Features */}
            {activeTab === 'trust' && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Trust Features</h2>
                    <p style={styles.sectionDesc}>These appear below the hero section to build customer trust.</p>

                    {trustFeatures.map((feature, index) => (
                        <div key={feature.id || index} style={styles.featureCard}>
                            <div style={styles.featureHeader}>
                                <span style={styles.featureTitle}>Feature {index + 1}</span>
                                <button style={styles.removeBtn} onClick={() => removeTrustFeature(index)}>Remove</button>
                            </div>
                            <div style={styles.formRow}>
                                <div>
                                    <label style={styles.label}>Icon</label>
                                    <select style={styles.select} value={feature.icon || 'shipping'} onChange={e => updateTrustFeature(index, 'icon', e.target.value)}>
                                        {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>Title</label>
                                    <input type="text" style={styles.input} value={feature.title || ''} onChange={e => updateTrustFeature(index, 'title', e.target.value)} placeholder="Free Shipping" />
                                </div>
                                <div>
                                    <label style={styles.label}>Description</label>
                                    <input type="text" style={styles.input} value={feature.description || ''} onChange={e => updateTrustFeature(index, 'description', e.target.value)} placeholder="On orders over $149" />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button style={styles.addBtn} onClick={addTrustFeature}>+ Add Trust Feature</button>
                </div>
            )}

            {/* Promo Banner */}
            {activeTab === 'promo' && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Promotional Banner</h2>
                    <p style={styles.sectionDesc}>This banner appears on the homepage to promote special offers.</p>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Banner Image</label>
                        <div
                            style={{ ...styles.imageUpload, backgroundImage: promo.image ? `url(${promo.image})` : 'none', color: promo.image ? '#fff' : '#999' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? 'Uploading...' : (promo.image ? '' : '📷 Click to upload image')}
                        </div>
                        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Label (Badge)</label>
                            <input type="text" style={styles.input} value={promo.label || ''} onChange={e => setPromo({ ...promo, label: e.target.value })} placeholder="Limited Time Offer" />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Title</label>
                            <input type="text" style={styles.input} value={promo.title || ''} onChange={e => setPromo({ ...promo, title: e.target.value })} placeholder="Get 20% Off Your First Order" />
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea style={styles.textarea} value={promo.description || ''} onChange={e => setPromo({ ...promo, description: e.target.value })} placeholder="Use code WELCOME20 at checkout..." />
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Button Text</label>
                            <input type="text" style={styles.input} value={promo.buttonText || ''} onChange={e => setPromo({ ...promo, buttonText: e.target.value })} placeholder="Shop Now" />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Button Link</label>
                            <input type="text" style={styles.input} value={promo.buttonLink || ''} onChange={e => setPromo({ ...promo, buttonLink: e.target.value })} placeholder="/products" />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e5e5', marginTop: '24px', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>🎯 Popup Settings</h3>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Enable Popup</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={promo.enablePopup || false} onChange={e => setPromo({ ...promo, enablePopup: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#6B2346' }} />
                                    <span style={{ fontSize: '14px', color: '#555' }}>{promo.enablePopup ? 'Popup Active' : 'Popup Disabled'}</span>
                                </label>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Popup Delay (seconds)</label>
                                <input type="number" min="1" max="60" style={styles.input} value={promo.popupDelay || 5} onChange={e => setPromo({ ...promo, popupDelay: parseInt(e.target.value) || 5 })} />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Countdown Timer End Date</label>
                            <input type="datetime-local" style={styles.input} value={promo.timerEnd || ''} onChange={e => setPromo({ ...promo, timerEnd: e.target.value })} />
                            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Leave empty for no countdown timer</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sections


