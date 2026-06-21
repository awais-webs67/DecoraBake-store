import { useState, useEffect } from 'react'
import { adminApi } from '../config/adminApi'
import API_BASE_URL from '../config/api'

function Newsletter() {
    const [activeTab, setActiveTab] = useState('subscribers')
    const [subscribers, setSubscribers] = useState([])
    const [stats, setStats] = useState({})
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    // Campaign form
    const [campaignForm, setCampaignForm] = useState({ subject: '', body: '', filter: 'all' })
    const [showCampaignForm, setShowCampaignForm] = useState(false)

    useEffect(() => { fetchAll() }, [filter, search])

    const fetchAll = async () => {
        try {
            setLoading(true)
            const [subData, statsData, campData] = await Promise.all([
                adminApi.get(`/api/admin/subscribers?filter=${filter}&search=${search}`),
                adminApi.get('/api/admin/subscribers/stats'),
                adminApi.get('/api/admin/campaigns')
            ])
            setSubscribers(subData.subscribers || [])
            setStats(statsData || {})
            setCampaigns(Array.isArray(campData) ? campData : [])
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this subscriber?')) return
        await adminApi.delete(`/api/admin/subscribers/${id}`)
        fetchAll()
        showMsg('✓ Subscriber removed')
    }

    const handleExport = () => {
        const token = localStorage.getItem('adminToken')
        window.open(`${API_BASE_URL}/api/admin/subscribers/export?filter=${filter}&token=${token}`, '_blank')
    }

    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const text = await file.text()
            const lines = text.trim().split('\n')
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
            const rows = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim())
                const obj = {}
                headers.forEach((h, i) => { obj[h] = vals[i] || '' })
                return obj
            })
            try {
                const result = await adminApi.post('/api/admin/subscribers/import', { subscribers: rows })
                showMsg(`✓ Imported ${result.imported} subscribers (${result.skipped} skipped)`)
                fetchAll()
            } catch { showMsg('Error importing CSV') }
        }
        input.click()
    }

    const handleCreateCampaign = async (e) => {
        e.preventDefault()
        try {
            await adminApi.post('/api/admin/campaigns', campaignForm)
            showMsg('✓ Campaign created')
            setCampaignForm({ subject: '', body: '', filter: 'all' })
            setShowCampaignForm(false)
            fetchAll()
        } catch { showMsg('Error creating campaign') }
    }

    const handleSendCampaign = async (id) => {
        if (!window.confirm('Send this campaign to all matching subscribers? This cannot be undone.')) return
        try {
            const result = await adminApi.post(`/api/admin/campaigns/${id}/send`)
            showMsg(`✓ Campaign sending to ${result.totalRecipients} subscribers`)
            fetchAll()
        } catch (err) { showMsg('Error: ' + (err.message || 'Failed to send')) }
    }

    const handleBackup = async () => {
        if (!window.confirm('Run a full database backup now?')) return
        try {
            const result = await adminApi.post('/api/admin/backup')
            showMsg(`✓ Backup complete — ${result.totalRecords} records across ${result.collections} collections`)
        } catch { showMsg('Error running backup') }
    }

    const showMsg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 5000) }

    const statCards = [
        { label: 'All', value: stats.all || 0, key: 'all', color: '#6B2346' },
        { label: 'Newsletter', value: stats.newsletter || 0, key: 'newsletter', color: '#7C3AED' },
        { label: 'Registered', value: stats.register || 0, key: 'register', color: '#2563EB' },
        { label: 'Purchasers', value: stats.purchase || 0, key: 'purchase', color: '#059669' },
        { label: 'Imported', value: stats.import || 0, key: 'import', color: '#D97706' }
    ]

    if (loading && subscribers.length === 0) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>📧 Newsletter & Campaigns</h1>
                    <p style={{ fontSize: '14px', color: '#888' }}>Manage subscribers and send bulk emails</p>
                </div>
                <button onClick={handleBackup} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                    💾 Run Backup
                </button>
            </div>

            {message && (
                <div style={{ padding: '14px 20px', background: message.includes('Error') ? '#FEE2E2' : '#ECFDF5', color: message.includes('Error') ? '#DC2626' : '#059669', borderRadius: '10px', marginBottom: '20px', fontWeight: '500' }}>
                    {message}
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {statCards.map(s => (
                    <div key={s.key} onClick={() => setFilter(s.key)} style={{ padding: '18px', background: filter === s.key ? s.color : '#fff', borderRadius: '12px', border: `1px solid ${filter === s.key ? s.color : '#e5e5e5'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: filter === s.key ? '#fff' : '#222' }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: filter === s.key ? 'rgba(255,255,255,0.8)' : '#888', fontWeight: '500' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button onClick={() => setActiveTab('subscribers')} style={tabStyle(activeTab === 'subscribers')}>📋 Subscribers</button>
                <button onClick={() => setActiveTab('campaigns')} style={tabStyle(activeTab === 'campaigns')}>📨 Campaigns</button>
            </div>

            {/* Subscribers Tab */}
            {activeTab === 'subscribers' && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email..." style={{ padding: '10px 14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '14px', minWidth: '220px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleImport} style={actionBtn('#E0F2FE', '#0369A1')}>📥 Import CSV</button>
                            <button onClick={handleExport} style={actionBtn('#ECFDF5', '#059669')}>📤 Export CSV</button>
                        </div>
                    </div>

                    {subscribers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
                            <p>No subscribers yet</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Email', 'Name', 'Source', 'Date', ''].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', borderBottom: '2px solid #f0f0f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subscribers.map(sub => (
                                    <tr key={sub._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={cellStyle}><strong>{sub.email}</strong></td>
                                        <td style={cellStyle}>{sub.firstName || sub.lastName ? `${sub.firstName} ${sub.lastName}`.trim() : '—'}</td>
                                        <td style={cellStyle}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...sourceStyle(sub.source) }}>{sub.source}</span></td>
                                        <td style={cellStyle}>{new Date(sub.createdAt).toLocaleDateString('en-AU')}</td>
                                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(sub._id)} style={{ padding: '5px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Email Campaigns</h3>
                        <button onClick={() => setShowCampaignForm(!showCampaignForm)} style={{ padding: '10px 20px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                            {showCampaignForm ? 'Cancel' : '+ New Campaign'}
                        </button>
                    </div>

                    {showCampaignForm && (
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e5e5e5', marginBottom: '20px' }}>
                            <form onSubmit={handleCreateCampaign}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Subject *</label>
                                    <input value={campaignForm.subject} onChange={e => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="Email subject line" required style={inputStyle} />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Audience</label>
                                    <select value={campaignForm.filter} onChange={e => setCampaignForm({ ...campaignForm, filter: e.target.value })} style={inputStyle}>
                                        <option value="all">All Subscribers ({stats.all || 0})</option>
                                        <option value="newsletter">Newsletter Only ({stats.newsletter || 0})</option>
                                        <option value="register">Registered Users ({stats.register || 0})</option>
                                        <option value="purchase">Purchasers ({stats.purchase || 0})</option>
                                        <option value="import">Imported ({stats.import || 0})</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelStyle}>Body (HTML)</label>
                                    <textarea value={campaignForm.body} onChange={e => setCampaignForm({ ...campaignForm, body: e.target.value })} placeholder="<h2>Big Sale This Weekend! 🎂</h2><p>Get 20% off all products...</p>" rows="10" required style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }} />
                                    <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>Use HTML formatting. The email will be wrapped in our branded template.</p>
                                </div>
                                <button type="submit" style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #6B2346, #3d1529)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                                    Create Campaign
                                </button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {campaigns.length === 0 ? (
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '50px', border: '1px solid #e5e5e5', textAlign: 'center', color: '#888' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📨</div>
                                <p>No campaigns yet. Create your first one!</p>
                            </div>
                        ) : campaigns.map(c => (
                            <div key={c._id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <strong style={{ fontSize: '15px' }}>{c.subject}</strong>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                        Audience: {c.filter} &bull; {new Date(c.createdAt).toLocaleDateString('en-AU')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {c.status === 'sending' && (
                                        <div style={{ fontSize: '12px', color: '#2563EB' }}>
                                            📤 {c.sentCount}/{c.totalRecipients} sent
                                        </div>
                                    )}
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...campaignStatusStyle(c.status) }}>
                                        {c.status}
                                    </span>
                                    {c.status === 'draft' && (
                                        <button onClick={() => handleSendCampaign(c._id)} style={{ padding: '8px 16px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                            🚀 Send
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

const tabStyle = (active) => ({
    padding: '12px 28px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    background: active ? '#6B2346' : '#f0f0f0', color: active ? '#fff' : '#555'
})

const actionBtn = (bg, color) => ({
    padding: '8px 16px', background: bg, color, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
})

const cellStyle = { padding: '12px', fontSize: '13px', color: '#444' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#444' }
const inputStyle = { width: '100%', padding: '12px 14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }

const sourceStyle = (source) => {
    const map = { newsletter: { background: '#F3E8FF', color: '#7C3AED' }, register: { background: '#DBEAFE', color: '#2563EB' }, purchase: { background: '#ECFDF5', color: '#059669' }, import: { background: '#FEF3C7', color: '#D97706' }, manual: { background: '#F3F4F6', color: '#6B7280' } }
    return map[source] || map.manual
}

const campaignStatusStyle = (status) => {
    const map = { draft: { background: '#F3F4F6', color: '#6B7280' }, sending: { background: '#DBEAFE', color: '#2563EB' }, sent: { background: '#ECFDF5', color: '#059669' }, failed: { background: '#FEE2E2', color: '#DC2626' } }
    return map[status] || map.draft
}

export default Newsletter
