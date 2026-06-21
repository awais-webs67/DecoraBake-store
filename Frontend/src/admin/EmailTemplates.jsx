import { useState, useEffect } from 'react'
import { adminApi } from '../config/adminApi'

const TEMPLATE_CATEGORIES = [
    {
        name: 'Orders', icon: '📦',
        templates: [
            { id: 'order-confirmation', label: 'Order Confirmation', desc: 'Sent after successful payment' },
            { id: 'order-status', label: 'Order Status Update', desc: 'Sent when status changes' },
            { id: 'shipping-notification', label: 'Shipping Notification', desc: 'Sent with tracking info' },
            { id: 'admin-order', label: 'Admin: New Order', desc: 'Admin notification for new orders' },
        ]
    },
    {
        name: 'Refunds', icon: '💳',
        templates: [
            { id: 'refund-pending', label: 'Refund Received', desc: 'When refund request is submitted' },
            { id: 'refund-reviewing', label: 'Refund Under Review', desc: 'When refund is being reviewed' },
            { id: 'refund-approved', label: 'Refund Approved', desc: 'When refund is approved' },
            { id: 'refund-denied', label: 'Refund Denied', desc: 'When refund is denied' },
            { id: 'refund-completed', label: 'Refund Completed', desc: 'When refund amount returned' },
            { id: 'refund-message', label: 'Refund Message', desc: 'Admin refund message to customer' },
            { id: 'admin-refund', label: 'Admin: New Refund', desc: 'Admin notification for refund' },
        ]
    },
    {
        name: 'Customer', icon: '👤',
        templates: [
            { id: 'welcome', label: 'Welcome Email', desc: 'Sent on registration' },
            { id: 'contact-confirmation', label: 'Contact Form', desc: 'Confirmation after contact' },
            { id: 'admin-contact', label: 'Admin: Contact', desc: 'Admin notification for contact' },
        ]
    },
    {
        name: 'Marketing', icon: '📧',
        templates: [
            { id: 'newsletter', label: 'Newsletter', desc: 'Campaign emails to subscribers' },
        ]
    },
    {
        name: 'System', icon: '⚙️',
        templates: [
            { id: 'backup-notification', label: 'Backup Notification', desc: 'Sent after database backup' },
        ]
    }
]

function useWindowSize() {
    const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const h = () => setW(window.innerWidth)
        window.addEventListener('resize', h)
        return () => window.removeEventListener('resize', h)
    }, [])
    return w
}

function EmailTemplates() {
    const [activeCategory, setActiveCategory] = useState(0)
    const [activeTemplate, setActiveTemplate] = useState('order-confirmation')
    const [previewHtml, setPreviewHtml] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [customizations, setCustomizations] = useState({})
    const [editData, setEditData] = useState({ subject: '', headerText: '', footerText: '', enabled: true })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)
    const [activeTab, setActiveTab] = useState('preview') // 'preview' or 'edit'
    const width = useWindowSize()
    const isMobile = width < 768

    // Fetch all customizations on mount
    useEffect(() => {
        adminApi.get('/api/admin/email-templates/custom')
            .then(data => setCustomizations(data || {}))
            .catch(() => { })
    }, [])

    // Load preview when template changes
    const loadPreview = async (templateId) => {
        setLoading(true)
        setError('')
        try {
            const data = await adminApi.get(`/api/admin/email-templates/preview/${templateId}`)
            if (data.error) throw new Error(data.error)
            setPreviewHtml(data.html)
        } catch (err) {
            setError(err.message || 'Failed to load template')
            setPreviewHtml('')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPreview(activeTemplate)
        // Load edit data for this template
        const custom = customizations[activeTemplate]
        if (custom) {
            setEditData({ subject: custom.subject || '', headerText: custom.headerText || '', footerText: custom.footerText || '', bodyContent: custom.bodyContent || '', enabled: custom.enabled !== false })
            if (!custom.bodyContent) fetchDefaultContent(activeTemplate)
        } else {
            setEditData({ subject: '', headerText: '', footerText: '', bodyContent: '', enabled: true })
            fetchDefaultContent(activeTemplate)
        }
        setSaved(false)
        if (isMobile) setShowSidebar(false)
    }, [activeTemplate, customizations])

    const fetchDefaultContent = async (type) => {
        try {
            const data = await adminApi.get(`/api/admin/email-templates/defaults/${type}`)
            if (data.content) {
                setEditData(prev => ({ ...prev, bodyContent: data.content }))
            }
        } catch (err) { }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await adminApi.put(`/api/admin/email-templates/custom/${activeTemplate}`, editData)
            setCustomizations(prev => ({ ...prev, [activeTemplate]: result }))
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            alert('Failed to save: ' + err.message)
        }
        setSaving(false)
    }

    const handleReset = async () => {
        if (!confirm('Reset this template to defaults?')) return
        try {
            await adminApi.delete(`/api/admin/email-templates/custom/${activeTemplate}`)
            setCustomizations(prev => { const n = { ...prev }; delete n[activeTemplate]; return n })
            setEditData({ subject: '', headerText: '', footerText: '', enabled: true })
        } catch (err) {
            alert('Failed to reset: ' + err.message)
        }
    }

    const currentCategory = TEMPLATE_CATEGORIES[activeCategory]
    const currentTemplate = TEMPLATE_CATEGORIES.flatMap(c => c.templates).find(t => t.id === activeTemplate)
    const hasCustomization = !!customizations[activeTemplate]



    const loadDefaultTemplate = async () => {
        if (!confirm('This will overwrite your current changes with the default template. Continue?')) return
        try {
            const data = await adminApi.get(`/api/admin/email-templates/defaults/${activeTemplate}`)
            if (data.content) {
                setEditData(d => ({ ...d, bodyContent: data.content }))
            }
        } catch (err) {
            alert('Failed to load default: ' + err.message)
        }
    }

    // Define available variables for reference
    const VARIABLE_LEGEND = {
        'order-confirmation': ['{{customerName}}', '{{orderNumber}}', '{{orderDate}}', '{{total}}', '{{itemsHtml}}', '{{shippingAddressHtml}}', '{{viewOrderBtn}}'],
        'shipping-notification': ['{{customerName}}', '{{orderNumber}}', '{{trackingNumber}}', '{{trackPackageBtn}}', '{{viewOrderBtn}}'],
        'welcome': ['{{firstName}}', '{{siteName}}', '{{startShoppingBtn}}'],
        'order-status': ['{{customerName}}', '{{orderNumber}}', '{{statusBadge}}', '{{message}}', '{{trackPackageBtn}}'],
        'admin-order': ['{{orderNumber}}', '{{customerName}}', '{{total}}', '{{itemsHtml}}', '{{viewAdminOrderBtn}}'],
        'refund-pending': ['{{header}}', '{{refundId}}', '{{amount}}', '{{statusBadge}}', '{{reasonHtml}}'],
        // Add others as needed
    }

    const currentVariables = VARIABLE_LEGEND[activeTemplate] || []

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#222', margin: '0 0 4px' }}>📧 Email Templates</h1>
                    <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Preview and customize emails sent to customers</p>
                </div>
                {isMobile && (
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        {showSidebar ? 'Hide Templates' : '📋 Templates'}
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: '20px', minHeight: '60vh' }}>
                {/* Sidebar */}
                {(showSidebar || !isMobile) && (
                    <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e5e5', overflow: 'hidden' }}>
                        {/* Category tabs */}
                        <div style={{ display: 'flex', gap: '2px', background: '#f0f0f0', padding: '6px', margin: '12px', borderRadius: '10px' }}>
                            {TEMPLATE_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat.name}
                                    style={{
                                        flex: 1, padding: '6px 2px', border: 'none', borderRadius: '7px',
                                        fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                                        background: activeCategory === idx ? '#6B2346' : 'transparent',
                                        color: activeCategory === idx ? '#fff' : '#666'
                                    }}
                                    onClick={() => { setActiveCategory(idx); setActiveTemplate(cat.templates[0].id) }}
                                    title={cat.name}
                                >
                                    {cat.icon}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '0 12px 4px', fontSize: '11px', fontWeight: '700', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {currentCategory.icon} {currentCategory.name}
                        </div>

                        <div style={{ padding: '0 8px 8px' }}>
                            {currentCategory.templates.map(tmpl => {
                                const isActive = tmpl.id === activeTemplate
                                const isCustomized = !!customizations[tmpl.id]
                                return (
                                    <div
                                        key={tmpl.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                                            borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
                                            transition: 'all 0.2s',
                                            background: isActive ? '#FCE8ED' : 'transparent',
                                            border: isActive ? '1.5px solid #6B2346' : '1.5px solid transparent'
                                        }}
                                        onClick={() => setActiveTemplate(tmpl.id)}
                                    >
                                        <div style={{
                                            width: '30px', height: '30px', borderRadius: '7px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', flexShrink: 0,
                                            background: isActive ? '#6B2346' : '#f0f0f0',
                                            color: isActive ? '#fff' : '#666'
                                        }}>✉</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {tmpl.label}
                                                {isCustomized && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#059669' }}>●</span>}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tmpl.desc}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Main Panel */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Panel header */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#222' }}>{currentTemplate?.label || 'Select a template'}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{currentTemplate?.desc}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['preview', 'edit'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '6px 16px', border: 'none', borderRadius: '7px', fontSize: '12px',
                                        fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                        background: activeTab === tab ? '#6B2346' : '#f0f0f0',
                                        color: activeTab === tab ? '#fff' : '#666'
                                    }}
                                >
                                    {tab === 'preview' ? '👁 Preview' : '✏️ Code Editor'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {activeTab === 'preview' ? (
                            <div style={{ padding: '20px', background: '#f8f5f7', flex: 1, overflow: 'auto' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#888' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
                                            Loading preview...
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#DC2626' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', marginBottom: '8px' }}>❌</div>
                                            {error}
                                        </div>
                                    </div>
                                ) : previewHtml ? (
                                    <iframe
                                        srcDoc={previewHtml}
                                        title="Email Preview"
                                        style={{ width: '100%', minHeight: '500px', border: 'none', borderRadius: '10px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                                        sandbox="allow-same-origin"
                                    />
                                ) : null}
                            </div>
                        ) : (
                            /* Edit Tab */
                            <div style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ padding: '16px 20px', background: '#f8f9fa', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={loadDefaultTemplate} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                            🔄 Load Default
                                        </button>
                                        <button onClick={() => setEditData(d => ({ ...d, enabled: !d.enabled }))} style={{ padding: '6px 12px', background: editData.enabled ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${editData.enabled ? '#16A34A' : '#DC2626'}`, color: editData.enabled ? '#166534' : '#991B1B', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                                            {editData.enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        style={{
                                            padding: '8px 24px', background: saved ? '#059669' : '#6B2346', color: '#fff',
                                            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                                            cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {saving ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Changes'}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <textarea
                                            value={editData.bodyContent || ''}
                                            onChange={e => setEditData(d => ({ ...d, bodyContent: e.target.value }))}
                                            placeholder="Loading template content..."
                                            style={{
                                                flex: 1, width: '100%', padding: '16px', border: 'none',
                                                fontSize: '14px', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                                                resize: 'none', outline: 'none', lineHeight: '1.5', color: '#222', background: '#fff'
                                            }}
                                            spellCheck={false}
                                        />
                                    </div>
                                    <div style={{ width: '250px', background: '#f8f9fa', borderLeft: '1px solid #e5e5e5', padding: '16px', overflow: 'auto' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>Available Variables</div>
                                        {currentVariables.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {currentVariables.map(v => (
                                                    <div key={v}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(v)
                                                            alert(`Copied ${v} to clipboard!`)
                                                        }}
                                                        style={{
                                                            padding: '6px 10px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px',
                                                            fontSize: '12px', fontFamily: 'monospace', color: '#C026D3', cursor: 'pointer',
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                        }}
                                                        title="Click to copy"
                                                    >
                                                        {v}
                                                        <span style={{ fontSize: '10px', color: '#999' }}>📋</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No variables documented for this template yet.</div>
                                        )}
                                        <div style={{ marginTop: '20px', fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                                            <strong>Tip:</strong> Use Standard HTML tags for formatting. Variables will be replaced with actual data when sending.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmailTemplates
