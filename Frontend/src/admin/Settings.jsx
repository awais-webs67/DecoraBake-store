import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

const PROVIDER_META = {
    gemini:     { label: 'Gemini',     color: '#4285f4', priority: 1 },
    qwen:       { label: 'Qwen',       color: '#FF6A00', priority: 2 },
    openrouter: { label: 'OpenRouter', color: '#7C3AED', priority: 3 },
    longcat:    { label: 'LongCat',    color: '#10a37f', priority: 4 },
}

function ChatbotStatusPanel() {
    const [status, setStatus] = useState(null)
    const [checking, setChecking] = useState(false)

    const checkAll = async () => {
        setChecking(true)
        try {
            const data = await adminApi.post('/api/chatbot/test-all', {})
            setStatus(data)
        } catch (e) {
            setStatus(null)
        }
        setChecking(false)
    }

    return (
        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: status ? '12px' : '0' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>Live API Status</span>
                <button
                    onClick={checkAll}
                    disabled={checking}
                    style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: checking ? 'not-allowed' : 'pointer', opacity: checking ? 0.7 : 1 }}
                >
                    {checking ? 'Checking...' : '⚡ Test All APIs'}
                </button>
            </div>
            {status && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(PROVIDER_META).map(([key, meta]) => {
                        const result = status[key]
                        const ok = result?.success
                        const notConfigured = result?.error === 'Not configured'
                        return (
                            <div key={key} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                background: notConfigured ? '#f1f3f4' : ok ? '#e8f5e9' : '#fdecea',
                                color: notConfigured ? '#999' : ok ? '#2e7d32' : '#c62828',
                                border: `1px solid ${notConfigured ? '#ddd' : ok ? '#a5d6a7' : '#ef9a9a'}`
                            }}>
                                <span>{notConfigured ? '⚫' : ok ? '✅' : '❌'}</span>
                                <span style={{ color: meta.color, fontWeight: '700' }}>P{meta.priority}</span>
                                <span>{meta.label}</span>
                                {!ok && !notConfigured && <span style={{ fontSize: '10px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>({result?.error})</span>}
                            </div>
                        )
                    })}
                </div>
            )}
            {!status && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#999' }}>Click "Test All APIs" to see live status of each provider</p>}
        </div>
    )
}

function Settings() {
    const [settings, setSettings] = useState({
        siteName: 'DecoraBake',
        announcementText: '🎂 Free Australia-Wide Shipping on Orders Over $149!',
        announcementEnabled: true,
        freeShippingEnabled: true,
        freeShippingThreshold: 149,
        shippingCost: 9.95,
        contactEmail: 'hello@decorabake.com.au',
        contactPhone: '1300 123 456',
        currency: 'AUD',
        address: 'Sydney, NSW, Australia',
        paymentStripeEnabled: true,
        paymentBankTransferEnabled: false,
        bankName: '',
        bankAccountName: '',
        bankBSB: '',
        bankAccountNumber: '',
        bankInstructions: 'Please use your Order ID as the payment reference. Orders will be processed once payment is verified (1-2 business days).',
        socialFacebook: '',
        socialInstagram: '',
        socialPinterest: '',
        imagekitEnabled: false,
        imagekitPublicKey: '',
        imagekitPrivateKey: '',
        imagekitUrlEndpoint: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [ikTesting, setIkTesting] = useState(false)
    const [ikTestResult, setIkTestResult] = useState(null)
    const [ikMigrating, setIkMigrating] = useState(false)
    const [ikMigrateResult, setIkMigrateResult] = useState(null)

    const [admins, setAdmins] = useState([])
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '', firstName: '', lastName: '' })

    useEffect(() => {
        Promise.all([
            adminApi.get('/api/admin/settings'),
            adminApi.get('/api/admin/users')
        ]).then(([settingsData, usersData]) => {
            if (settingsData) setSettings(prev => ({ ...prev, ...settingsData }))
            if (usersData) setAdmins(usersData)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const handleAddAdmin = async (e) => {
        e.preventDefault()
        try {
            const data = await adminApi.post('/api/admin/users', newAdmin)
            if (data.success) {
                setAdmins([...admins.filter(a => a.email !== data.user.email), data.user])
                setNewAdmin({ email: '', password: '', firstName: '', lastName: '' })
                setMessage('Admin user added successfully.')
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (err) { alert('Failed to add admin') }
    }

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Are you sure you want to remove this admin?')) return
        try {
            const data = await adminApi.delete(`/api/admin/users/${id}`)
            if (data.success) setAdmins(admins.filter(a => a._id !== id))
        } catch (err) { alert('Failed to delete admin') }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await adminApi.put('/api/settings', settings)
            setMessage('Settings saved! Changes are now live on your website.')
            setTimeout(() => setMessage(''), 4000)
        } catch (e) {
            setMessage('Error saving settings')
        }
        setSaving(false)
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const testImageKit = async () => {
        setIkTesting(true); setIkTestResult(null)
        // Save first so latest keys are in DB before testing
        try { await adminApi.put('/api/settings', settings) } catch {}
        try {
            const data = await adminApi.post('/api/admin/imagekit/test', {})
            setIkTestResult({ success: data.success, message: data.message || data.error })
        } catch { setIkTestResult({ success: false, message: 'Connection failed' }) }
        setIkTesting(false)
    }

    const migrateImages = async () => {
        if (!window.confirm('This will migrate all existing local images to ImageKit. Continue?')) return
        setIkMigrating(true); setIkMigrateResult(null)
        try { await adminApi.put('/api/settings', settings) } catch {}
        try {
            const data = await adminApi.post('/api/admin/imagekit/migrate', {})
            setIkMigrateResult(data)
        } catch { setIkMigrateResult({ error: 'Migration failed' }) }
        setIkMigrating(false)
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        saveBtn: { padding: '12px 28px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        message: { padding: '14px 20px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '10px', marginBottom: '24px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' },
        section: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5', marginBottom: '20px' },
        sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#222', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' },
        sectionIcon: { width: '28px', height: '28px', background: '#FCE8ED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        inputGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
        inputPrefix: { padding: '12px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: '14px', color: '#666' },
        inputWithPrefix: { flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: '0 10px 10px 0', fontSize: '14px' },
        textarea: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
        toggle: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
        toggleSwitch: { width: '50px', height: '28px', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' },
        toggleKnob: { width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
        hint: { fontSize: '12px', color: '#888', marginTop: '6px' },
        preview: { background: '#6B2346', color: '#fff', textAlign: 'center', padding: '12px 20px', borderRadius: '8px', marginTop: '16px', fontSize: '13px' }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Site Settings</h1>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>

            {message && <div style={styles.message}>✓ {message}</div>}

            {/* Announcement Bar */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📢</span>
                    Announcement Bar
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>This banner appears at the top of every page on your website.</p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.announcementEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('announcementEnabled', !settings.announcementEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.announcementEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Announcement Bar</span>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Announcement Text</label>
                    <textarea style={styles.textarea} value={settings.announcementText} onChange={e => handleChange('announcementText', e.target.value)} placeholder="Enter your announcement..." />
                    <p style={styles.hint}>Use emojis to make it stand out! 🎂 🎉 ✨</p>
                </div>

                {settings.announcementEnabled && (
                    <div style={styles.preview}>{settings.announcementText}</div>
                )}
            </div>

            {/* Shipping Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🚚</span>
                    Shipping Settings
                </h2>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.freeShippingEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('freeShippingEnabled', !settings.freeShippingEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.freeShippingEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Free Shipping</span>
                </div>

                <div style={styles.grid}>
                    {settings.freeShippingEnabled && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Free Shipping Threshold</label>
                            <div style={styles.inputGroup}>
                                <span style={styles.inputPrefix}>$</span>
                                <input type="number" style={styles.inputWithPrefix} value={settings.freeShippingThreshold} onChange={e => handleChange('freeShippingThreshold', parseFloat(e.target.value))} />
                            </div>
                            <p style={styles.hint}>Orders above this amount qualify for free shipping</p>
                        </div>
                    )}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Standard Shipping Cost</label>
                        <div style={styles.inputGroup}>
                            <span style={styles.inputPrefix}>$</span>
                            <input type="number" style={styles.inputWithPrefix} value={settings.shippingCost} onChange={e => handleChange('shippingCost', parseFloat(e.target.value))} step="0.01" />
                        </div>
                        <p style={styles.hint}>Charged when order doesn't qualify for free shipping</p>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>⚙️</span>
                    General
                </h2>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Header Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={settings.siteLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.siteLogo}` : (settings.siteLogo || '/logo.png')} alt="Header Logo" style={{ height: '40px', objectFit: 'contain', background: '#f5f5f5', padding: '6px', borderRadius: '6px' }} />
                            <label style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                                Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (file) {
                                        const formData = new FormData(); formData.append('file', file)
                                        try {
                                            const data = await adminApi.upload('/api/upload', formData)
                                            if (data.url) handleChange('siteLogo', data.url)
                                        } catch (err) { console.error('Upload failed', err) }
                                    }
                                }} />
                            </label>
                        </div>
                        <p style={styles.hint}>Appears in website header</p>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Footer Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={settings.footerLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.footerLogo}` : (settings.footerLogo || '/logo.png')} alt="Footer Logo" style={{ height: '40px', objectFit: 'contain', background: '#f5f5f5', padding: '6px', borderRadius: '6px' }} />
                            <label style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                                Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (file) {
                                        const formData = new FormData(); formData.append('file', file)
                                        try {
                                            const data = await adminApi.upload('/api/upload', formData)
                                            if (data.url) handleChange('footerLogo', data.url)
                                        } catch (err) { console.error('Upload failed', err) }
                                    }
                                }} />
                            </label>
                        </div>
                        <p style={styles.hint}>Appears in website footer</p>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Site Name</label>
                        <input type="text" style={styles.input} value={settings.siteName || ''} onChange={e => handleChange('siteName', e.target.value)} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Currency</label>
                        <select style={styles.input} value={settings.currency || 'AUD'} onChange={e => handleChange('currency', e.target.value)}>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="GBP">GBP - British Pound</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Master Admin Credentials */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>👑</span>
                    Master Admin Credentials
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Update the master admin username and password used for dashboard login.</p>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Master Admin Username</label>
                        <input type="text" style={styles.input} value={settings.adminUsername || ''} onChange={e => handleChange('adminUsername', e.target.value)} placeholder="e.g. admin" />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Master Admin Password</label>
                        <input type="password" style={styles.input} value={settings.adminPassword || ''} onChange={e => handleChange('adminPassword', e.target.value)} placeholder="Enter new password" />
                    </div>
                </div>
            </div>

            {/* Admin Users */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>👥</span>
                    Admin Users
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Manage users who have access to this admin dashboard. Master admin credentials are still valid.</p>

                <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>Add New Admin</h3>
                    <form onSubmit={handleAddAdmin} style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>First Name</label>
                            <input type="text" style={styles.input} required value={newAdmin.firstName} onChange={e => setNewAdmin(prev => ({ ...prev, firstName: e.target.value }))} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Last Name</label>
                            <input type="text" style={styles.input} required value={newAdmin.lastName} onChange={e => setNewAdmin(prev => ({ ...prev, lastName: e.target.value }))} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email (Username)</label>
                            <input type="email" style={styles.input} required value={newAdmin.email} onChange={e => setNewAdmin(prev => ({ ...prev, email: e.target.value }))} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password</label>
                            <input type="password" style={styles.input} required minLength={6} value={newAdmin.password} onChange={e => setNewAdmin(prev => ({ ...prev, password: e.target.value }))} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" style={{ ...styles.saveBtn, background: '#2E7D32', width: 'auto' }}>+ Add Admin User</button>
                        </div>
                    </form>
                </div>

                <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#555' }}>Name</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#555' }}>Email</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#555' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{admin.firstName} {admin.lastName}</td>
                                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{admin.email}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <button onClick={() => handleDeleteAdmin(admin._id)} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>No additional admins found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Contact Info */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📞</span>
                    Contact Information
                </h2>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Contact Email</label>
                        <input type="email" style={styles.input} value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Contact Phone</label>
                        <input type="tel" style={styles.input} value={settings.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} />
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Physical Address</label>
                    <textarea style={styles.textarea} value={settings.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="123 Baker St, Sydney NSW 2000" rows={2} />
                    <p style={styles.hint}>Used in the footer and email templates for location mapping</p>
                </div>
            </div>

            {/* Social Media */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🔗</span>
                    Social Media
                </h2>
                <div style={styles.grid}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Facebook URL</label>
                        <input type="url" style={styles.input} value={settings.socialFacebook || ''} onChange={e => handleChange('socialFacebook', e.target.value)} placeholder="https://facebook.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Instagram URL</label>
                        <input type="url" style={styles.input} value={settings.socialInstagram || ''} onChange={e => handleChange('socialInstagram', e.target.value)} placeholder="https://instagram.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Pinterest URL</label>
                        <input type="url" style={styles.input} value={settings.socialPinterest || ''} onChange={e => handleChange('socialPinterest', e.target.value)} placeholder="https://pinterest.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Twitter / X URL</label>
                        <input type="url" style={styles.input} value={settings.socialTwitter || ''} onChange={e => handleChange('socialTwitter', e.target.value)} placeholder="https://x.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>YouTube URL</label>
                        <input type="url" style={styles.input} value={settings.socialYoutube || ''} onChange={e => handleChange('socialYoutube', e.target.value)} placeholder="https://youtube.com/..." />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>TikTok URL</label>
                        <input type="url" style={styles.input} value={settings.socialTiktok || ''} onChange={e => handleChange('socialTiktok', e.target.value)} placeholder="https://tiktok.com/..." />
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>💳</span>
                    Payment Methods
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Enable the payment methods customers can use at checkout. At least one must be active.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {/* Stripe */}
                    <div style={{ border: `2px solid ${settings.paymentStripeEnabled ? '#6B2346' : '#e0e0e0'}`, borderRadius: '14px', padding: '18px', background: settings.paymentStripeEnabled ? '#FDF2F5' : '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>💳</span>
                                <span style={{ fontWeight: '700', fontSize: '14px' }}>Stripe (Online)</span>
                            </div>
                            <div style={{ ...styles.toggleSwitch, background: settings.paymentStripeEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('paymentStripeEnabled', !settings.paymentStripeEnabled)}>
                                <div style={{ ...styles.toggleKnob, left: settings.paymentStripeEnabled ? '25px' : '3px' }} />
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Card, Apple Pay, Google Pay, Afterpay</p>
                    </div>

                    {/* Bank Transfer */}
                    <div style={{ border: `2px solid ${settings.paymentBankTransferEnabled ? '#166534' : '#e0e0e0'}`, borderRadius: '14px', padding: '18px', background: settings.paymentBankTransferEnabled ? '#F0FDF4' : '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>🏦</span>
                                <span style={{ fontWeight: '700', fontSize: '14px' }}>Bank Transfer</span>
                            </div>
                            <div style={{ ...styles.toggleSwitch, background: settings.paymentBankTransferEnabled ? '#166534' : '#ddd' }} onClick={() => handleChange('paymentBankTransferEnabled', !settings.paymentBankTransferEnabled)}>
                                <div style={{ ...styles.toggleKnob, left: settings.paymentBankTransferEnabled ? '25px' : '3px' }} />
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Manual — customer uploads receipt for verification</p>
                    </div>
                </div>

                {settings.paymentBankTransferEnabled && (
                    <>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#166534', marginBottom: '16px' }}>🏦 Bank Account Details</h3>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Bank Name</label>
                                <input type="text" style={styles.input} value={settings.bankName || ''} onChange={e => handleChange('bankName', e.target.value)} placeholder="e.g. Commonwealth Bank" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Account Name</label>
                                <input type="text" style={styles.input} value={settings.bankAccountName || ''} onChange={e => handleChange('bankAccountName', e.target.value)} placeholder="e.g. DecoraBake Pty Ltd" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>BSB</label>
                                <input type="text" style={styles.input} value={settings.bankBSB || ''} onChange={e => handleChange('bankBSB', e.target.value)} placeholder="062-000" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Account Number</label>
                                <input type="text" style={styles.input} value={settings.bankAccountNumber || ''} onChange={e => handleChange('bankAccountNumber', e.target.value)} placeholder="12345678" />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Instructions for Customers</label>
                            <textarea rows={3} style={{ ...styles.input, resize: 'vertical' }} value={settings.bankInstructions || ''} onChange={e => handleChange('bankInstructions', e.target.value)} />
                            <p style={styles.hint}>Shown at checkout. Include reference instructions and processing time.</p>
                        </div>
                    </>
                )}
            </div>

            {/* ImageKit Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🖼️</span>
                    Image Storage (ImageKit)
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    ImageKit stores images permanently in the cloud — required for Vercel hosting. Get keys from <strong>imagekit.io → Developer Options → API Keys</strong>.
                </p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.imagekitEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('imagekitEnabled', !settings.imagekitEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.imagekitEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable ImageKit Storage</span>
                </div>

                {settings.imagekitEnabled && (
                    <>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Public Key</label>
                                <input style={styles.input} value={settings.imagekitPublicKey || ''} onChange={e => handleChange('imagekitPublicKey', e.target.value)} placeholder="public_..." />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Private Key</label>
                                <input type="password" style={styles.input} value={settings.imagekitPrivateKey || ''} onChange={e => handleChange('imagekitPrivateKey', e.target.value)} placeholder="private_..." />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>URL Endpoint</label>
                                <input style={styles.input} value={settings.imagekitUrlEndpoint || ''} onChange={e => handleChange('imagekitUrlEndpoint', e.target.value)} placeholder="https://ik.imagekit.io/your_id" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                            <button onClick={testImageKit} disabled={ikTesting} style={{ padding: '10px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: ikTesting ? 'not-allowed' : 'pointer', opacity: ikTesting ? 0.7 : 1 }}>
                                {ikTesting ? 'Testing...' : '⚡ Test Connection'}
                            </button>
                            <button onClick={migrateImages} disabled={ikMigrating} style={{ padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: ikMigrating ? 'not-allowed' : 'pointer', opacity: ikMigrating ? 0.7 : 1 }}>
                                {ikMigrating ? 'Migrating...' : '☁️ Migrate Existing Images'}
                            </button>
                        </div>

                        {ikTestResult && (
                            <div style={{ marginTop: '12px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: ikTestResult.success ? '#e8f5e9' : '#fdecea', color: ikTestResult.success ? '#2e7d32' : '#c62828', border: `1px solid ${ikTestResult.success ? '#a5d6a7' : '#ef9a9a'}` }}>
                                {ikTestResult.success ? '✅' : '❌'} {ikTestResult.message}
                            </div>
                        )}

                        {ikMigrateResult && (
                            <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', background: ikMigrateResult.error ? '#fdecea' : '#e8f5e9', color: ikMigrateResult.error ? '#c62828' : '#2e7d32', border: `1px solid ${ikMigrateResult.error ? '#ef9a9a' : '#a5d6a7'}` }}>
                                {ikMigrateResult.error
                                    ? `❌ ${ikMigrateResult.error}`
                                    : `✅ Migration complete — ${ikMigrateResult.migrated} migrated, ${ikMigrateResult.skipped} skipped, ${ikMigrateResult.failed} failed`}
                            </div>
                        )}

                        <p style={{ ...styles.hint, marginTop: '12px' }}>
                            Save settings first, then use "Test Connection" to verify. "Migrate Existing Images" moves all current local images to ImageKit.
                        </p>
                    </>
                )}
            </div>

            {/* Chatbot Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>🤖</span>
                    Chatbot Settings
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    Auto-fallback chain: <strong>Gemini → Qwen → OpenRouter → LongCat</strong>. If one fails, the next is tried automatically.
                </p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.chatbotEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('chatbotEnabled', !settings.chatbotEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.chatbotEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable AI Chatbot</span>
                </div>

                {settings.chatbotEnabled && (
                    <>
                        {/* Live Status Panel */}
                        <ChatbotStatusPanel />

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🟢 Gemini API Key (Priority 1 — Primary)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="password" style={{ ...styles.input, flex: 1 }} value={settings.geminiApiKey || ''} onChange={e => handleChange('geminiApiKey', e.target.value)} placeholder="AIza..." />
                                <button
                                    style={{ padding: '12px 16px', background: '#4285f4', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    onClick={async () => {
                                        const data = await adminApi.post('/api/chatbot/test', { apiType: 'gemini' })
                                        alert(data.success ? '✓ ' + data.message : '✗ ' + data.error)
                                    }}
                                >Test</button>
                            </div>
                            <p style={styles.hint}>Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> · Model: gemini-2.5-flash</p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🟠 Qwen API Key (Priority 2 — Alibaba Cloud)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="password" style={{ ...styles.input, flex: 1 }} value={settings.qwenApiKey || ''} onChange={e => handleChange('qwenApiKey', e.target.value)} placeholder="sk-ws-..." />
                                <button
                                    style={{ padding: '12px 16px', background: '#FF6A00', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    onClick={async () => {
                                        const data = await adminApi.post('/api/chatbot/test', { apiType: 'qwen' })
                                        alert(data.success ? '✓ ' + data.message : '✗ ' + data.error)
                                    }}
                                >Test</button>
                            </div>
                            <p style={styles.hint}>Alibaba Cloud MaaS workspace · Model: qwen-turbo · Key loaded from .env if left blank</p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>🔵 OpenRouter API Key (Priority 3 — Free Fallback)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="password" style={{ ...styles.input, flex: 1 }} value={settings.openRouterApiKey || ''} onChange={e => handleChange('openRouterApiKey', e.target.value)} placeholder="sk-or-v1-..." />
                                <button
                                    style={{ padding: '12px 16px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    onClick={async () => {
                                        const data = await adminApi.post('/api/chatbot/test', { apiType: 'openrouter' })
                                        alert(data.success ? '✓ ' + data.message : '✗ ' + data.error)
                                    }}
                                >Test</button>
                            </div>
                            <p style={styles.hint}>Uses free Llama 3.1 model via OpenRouter · Key loaded from .env if left blank</p>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>⚪ LongCat 2.0 Preview API Key (Priority 4 — Last Resort)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="password" style={{ ...styles.input, flex: 1 }} value={settings.longcatApiKey || ''} onChange={e => handleChange('longcatApiKey', e.target.value)} placeholder="sk-..." />
                                <button
                                    style={{ padding: '12px 16px', background: '#10a37f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    onClick={async () => {
                                        const data = await adminApi.post('/api/chatbot/test', { apiType: 'longcat' })
                                        alert(data.success ? '✓ ' + data.message : '✗ ' + data.error)
                                    }}
                                >Test</button>
                            </div>
                            <p style={styles.hint}>LongCat-2.0-Preview (apply for beta access at longcat.chat) · Legacy models retired May 29 2026</p>
                        </div>
                    </>
                )}

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={styles.toggle}>
                        <div style={{ ...styles.toggleSwitch, background: settings.whatsappEnabled ? '#25D366' : '#ddd' }} onClick={() => handleChange('whatsappEnabled', !settings.whatsappEnabled)}>
                            <div style={{ ...styles.toggleKnob, left: settings.whatsappEnabled ? '25px' : '3px' }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable WhatsApp Button</span>
                    </div>

                    {settings.whatsappEnabled && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>WhatsApp Number (with country code)</label>
                            <input type="tel" style={styles.input} value={settings.whatsappNumber || ''} onChange={e => handleChange('whatsappNumber', e.target.value)} placeholder="61412345678" />
                            <p style={styles.hint}>Enter number without + or spaces (e.g., 61412345678 for Australia)</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Settings */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    <span style={styles.sectionIcon}>📧</span>
                    Email Settings
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Configure SMTP to send order confirmations, welcome emails, and shipping notifications.</p>

                <div style={styles.toggle}>
                    <div style={{ ...styles.toggleSwitch, background: settings.emailEnabled ? '#6B2346' : '#ddd' }} onClick={() => handleChange('emailEnabled', !settings.emailEnabled)}>
                        <div style={{ ...styles.toggleKnob, left: settings.emailEnabled ? '25px' : '3px' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Email Notifications</span>
                </div>

                {settings.emailEnabled && (
                    <>
                        <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>SMTP Configuration</h3>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Host</label>
                                    <input type="text" style={styles.input} value={settings.smtpHost || ''} onChange={e => handleChange('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                                    <p style={styles.hint}>Gmail: smtp.gmail.com | Outlook: smtp.office365.com</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Port</label>
                                    <input type="number" style={styles.input} value={settings.smtpPort || 587} onChange={e => handleChange('smtpPort', parseInt(e.target.value))} placeholder="587" />
                                    <p style={styles.hint}>Usually 587 (TLS) or 465 (SSL)</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Username</label>
                                    <input type="text" style={styles.input} value={settings.smtpUser || ''} onChange={e => handleChange('smtpUser', e.target.value)} placeholder="your-email@gmail.com" />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>SMTP Password / App Password</label>
                                    <input type="password" style={styles.input} value={settings.smtpPassword || ''} onChange={e => handleChange('smtpPassword', e.target.value)} placeholder="••••••••" />
                                    <p style={styles.hint}>For Gmail, use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">App Password</a></p>
                                </div>
                            </div>

                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>From Email</label>
                                    <input type="email" style={styles.input} value={settings.emailFrom || ''} onChange={e => handleChange('emailFrom', e.target.value)} placeholder="noreply@decorabake.com.au" />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>From Name</label>
                                    <input type="text" style={styles.input} value={settings.emailFromName || ''} onChange={e => handleChange('emailFromName', e.target.value)} placeholder="DecoraBake" />
                                </div>
                            </div>

                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Admin Email (for notifications)</label>
                                    <input type="email" style={styles.input} value={settings.adminEmail || ''} onChange={e => handleChange('adminEmail', e.target.value)} placeholder="admin@decorabake.com.au" />
                                    <p style={styles.hint}>Receives new order and refund request notifications</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Site URL</label>
                                    <input type="text" style={styles.input} value={settings.siteUrl || ''} onChange={e => handleChange('siteUrl', e.target.value)} placeholder="https://decorabake.com.au" />
                                    <p style={styles.hint}>Used for links in admin notification emails</p>
                                </div>
                            </div>

                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.smtpSecure ? '#6B2346' : '#ddd' }} onClick={() => handleChange('smtpSecure', !settings.smtpSecure)}>
                                    <div style={{ ...styles.toggleKnob, left: settings.smtpSecure ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>Use SSL/TLS (check if port is 465)</span>
                            </div>

                            <button
                                style={{ padding: '12px 24px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '10px' }}
                                onClick={async () => {
                                    await adminApi.put('/api/settings', settings)
                                    const data = await adminApi.post('/api/email/test', {})
                                    alert(data.success ? '✓ ' + data.message : '✗ ' + (data.error || 'Connection failed'))
                                }}
                            >
                                Test Connection
                            </button>
                        </div>

                        {/* Email Template Branding */}
                        <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>Email Template Branding</h3>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Email Logo</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <img src={settings.emailLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.emailLogo}` : (settings.emailLogo || settings.siteLogo?.startsWith('/uploads') ? `${API_BASE_URL}${settings.siteLogo}` : '/logo.png')} alt="Email Logo" style={{ height: '40px', objectFit: 'contain', background: '#f5f5f5', padding: '6px', borderRadius: '6px' }} />
                                        <label style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                                            Upload
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                                const file = e.target.files[0]
                                                if (file) {
                                                    const formData = new FormData(); formData.append('file', file)
                                                    try {
                                                        const data = await adminApi.upload('/api/upload', formData)
                                                        if (data.url) handleChange('emailLogo', data.url)
                                                    } catch (err) { console.error('Upload failed', err) }
                                                }
                                            }} />
                                        </label>
                                    </div>
                                    <p style={styles.hint}>Logo shown in email headers. Falls back to site logo if not set.</p>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Header Logo Display</label>
                                    <div style={{ ...styles.toggle, marginTop: '8px' }}>
                                        <div style={{ ...styles.toggleSwitch, background: settings.emailShowTextLogo ? '#6B2346' : '#ddd' }} onClick={() => handleChange('emailShowTextLogo', !settings.emailShowTextLogo)}>
                                            <div style={{ ...styles.toggleKnob, left: settings.emailShowTextLogo ? '25px' : '3px' }} />
                                        </div>
                                        <span style={{ fontSize: '14px' }}>Force Text Logo instead of Image</span>
                                    </div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Admin Notification Email</label>
                                    <input type="email" style={styles.input} value={settings.adminNotificationEmail || ''} onChange={e => handleChange('adminNotificationEmail', e.target.value)} placeholder="admin@decorabake.com.au" />
                                    <p style={styles.hint}>Receives order & refund notification emails</p>
                                </div>
                            </div>

                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Footer Address / Location</label>
                                    <textarea style={{ ...styles.textarea, minHeight: '60px' }} value={settings.emailFooterText || ''} onChange={e => handleChange('emailFooterText', e.target.value)} placeholder="123 Baker Street, Sydney, NSW 2000, Australia" />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Footer Support Email</label>
                                    <input type="email" style={styles.input} value={settings.emailFooterEmail || ''} onChange={e => handleChange('emailFooterEmail', e.target.value)} placeholder="support@decorabake.com.au" />
                                    <p style={styles.hint}>Displayed as the contact email in the footer</p>
                                </div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>Email Types</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.sendOrderConfirmation !== false ? '#6B2346' : '#ddd' }} onClick={() => handleChange('sendOrderConfirmation', !(settings.sendOrderConfirmation !== false))}>
                                    <div style={{ ...styles.toggleKnob, left: settings.sendOrderConfirmation !== false ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>📦 Order Confirmation - Send when customer places an order</span>
                            </div>
                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.sendWelcomeEmail !== false ? '#6B2346' : '#ddd' }} onClick={() => handleChange('sendWelcomeEmail', !(settings.sendWelcomeEmail !== false))}>
                                    <div style={{ ...styles.toggleKnob, left: settings.sendWelcomeEmail !== false ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>👋 Welcome Email - Send when new customer registers</span>
                            </div>
                            <div style={styles.toggle}>
                                <div style={{ ...styles.toggleSwitch, background: settings.sendShippingNotification !== false ? '#6B2346' : '#ddd' }} onClick={() => handleChange('sendShippingNotification', !(settings.sendShippingNotification !== false))}>
                                    <div style={{ ...styles.toggleKnob, left: settings.sendShippingNotification !== false ? '25px' : '3px' }} />
                                </div>
                                <span style={{ fontSize: '14px' }}>🚚 Shipping Notification - Send when order is marked as shipped</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    )
}

export default Settings


