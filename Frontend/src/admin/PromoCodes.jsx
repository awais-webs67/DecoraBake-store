import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

function PromoCodes() {
    const [codes, setCodes] = useState([])
    const [editingCode, setEditingCode] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCodes()
    }, [])

    const fetchCodes = () => {
        adminApi.get('/api/promo-codes')
            .then(data => { setCodes(data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleSave = async () => {
        if (editingCode.id) {
            await adminApi.put(`/api/promo-codes/${editingCode.id}`, editingCode)
        } else {
            await adminApi.post('/api/promo-codes', editingCode)
        }
        setEditingCode(null)
        fetchCodes()
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this promo code?')) return
        await adminApi.delete(`/api/promo-codes/${id}`)
        fetchCodes()
    }

    const toggleActive = async (code) => {
        await adminApi.put(`/api/promo-codes/${code.id}`, { ...code, active: !code.active })
        fetchCodes()
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        addBtn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
        card: { background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e5e5' },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
        codeText: { fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: '#6B2346', background: '#FCE8ED', padding: '8px 16px', borderRadius: '8px' },
        badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
        badgeActive: { background: '#E8F5E9', color: '#2E7D32' },
        badgeInactive: { background: '#f0f0f0', color: '#666' },
        badgeExpired: { background: '#FFEBEE', color: '#C62828' },
        info: { marginBottom: '16px' },
        infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
        infoLabel: { color: '#888' },
        infoValue: { fontWeight: '500', color: '#222' },
        progress: { marginTop: '12px' },
        progressLabel: { fontSize: '12px', color: '#888', marginBottom: '6px' },
        progressBar: { background: '#eee', borderRadius: '10px', height: '8px', overflow: 'hidden' },
        progressFill: { height: '100%', borderRadius: '10px', background: 'linear-gradient(90deg, #6B2346, #C64977)' },
        actions: { display: 'flex', gap: '10px', marginTop: '16px' },
        btn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
        btnEdit: { background: '#E3F2FD', color: '#1565C0' },
        btnDelete: { background: '#FFEBEE', color: '#C62828' },
        btnToggle: { background: '#fff', border: '1px solid #ddd', color: '#666' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px' },
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
        formGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        hint: { fontSize: '12px', color: '#888', marginTop: '6px' },
        modalActions: { display: 'flex', gap: '12px', marginTop: '24px' },
        btnCancel: { flex: 1, padding: '14px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
        btnSave: { flex: 1, padding: '14px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
    }

    const emptyCode = { code: '', discountType: 'percentage', discountValue: 10, usageLimit: 100, usageCount: 0, minOrder: 0, expiryDate: '', active: true }

    const isExpired = (code) => code.expiryDate && new Date(code.expiryDate) < new Date()

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Promo Codes</h1>
                <button style={styles.addBtn} onClick={() => setEditingCode(emptyCode)}>+ Add Promo Code</button>
            </div>

            <p style={{ color: '#666', marginBottom: '24px' }}>Create and manage discount codes for your customers.</p>

            <div style={styles.grid}>
                {codes.map(code => {
                    const usagePercent = code.usageLimit ? (code.usageCount / code.usageLimit) * 100 : 0
                    const expired = isExpired(code)
                    return (
                        <div key={code.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.codeText}>{code.code}</span>
                                <span style={{ ...styles.badge, ...(expired ? styles.badgeExpired : code.active ? styles.badgeActive : styles.badgeInactive) }}>
                                    {expired ? 'Expired' : code.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div style={styles.info}>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>Discount</span>
                                    <span style={styles.infoValue}>{code.discountType === 'percentage' ? `${code.discountValue}% off` : `$${code.discountValue} off`}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>Min. Order</span>
                                    <span style={styles.infoValue}>{code.minOrder > 0 ? `$${code.minOrder}` : 'No minimum'}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>Expires</span>
                                    <span style={styles.infoValue}>{code.expiryDate ? new Date(code.expiryDate).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>

                            {code.usageLimit > 0 && (
                                <div style={styles.progress}>
                                    <div style={styles.progressLabel}>Usage: {code.usageCount} / {code.usageLimit}</div>
                                    <div style={styles.progressBar}>
                                        <div style={{ ...styles.progressFill, width: `${Math.min(usagePercent, 100)}%` }} />
                                    </div>
                                </div>
                            )}

                            <div style={styles.actions}>
                                <button style={{ ...styles.btn, ...styles.btnToggle }} onClick={() => toggleActive(code)}>
                                    {code.active ? 'Disable' : 'Enable'}
                                </button>
                                <button style={{ ...styles.btn, ...styles.btnEdit }} onClick={() => setEditingCode(code)}>Edit</button>
                                <button style={{ ...styles.btn, ...styles.btnDelete }} onClick={() => handleDelete(code.id)}>Delete</button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {codes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px' }}>
                    <p style={{ color: '#666', marginBottom: '16px' }}>No promo codes yet. Create your first one!</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingCode && (
                <div style={styles.modal} onClick={() => setEditingCode(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>{editingCode.id ? 'Edit Promo Code' : 'Create Promo Code'}</h2>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Promo Code *</label>
                            <input type="text" style={{ ...styles.input, fontFamily: 'monospace', textTransform: 'uppercase' }} value={editingCode.code || ''} onChange={e => setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
                            <p style={styles.hint}>Customers will enter this code at checkout</p>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Discount Type</label>
                                <select style={styles.input} value={editingCode.discountType || 'percentage'} onChange={e => setEditingCode({ ...editingCode, discountType: e.target.value })}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Discount Value *</label>
                                <input type="number" style={styles.input} value={editingCode.discountValue || ''} onChange={e => setEditingCode({ ...editingCode, discountValue: parseFloat(e.target.value) })} placeholder={editingCode.discountType === 'percentage' ? '10' : '5'} />
                            </div>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Minimum Order ($)</label>
                                <input type="number" style={styles.input} value={editingCode.minOrder || ''} onChange={e => setEditingCode({ ...editingCode, minOrder: parseFloat(e.target.value) || 0 })} placeholder="0" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Usage Limit</label>
                                <input type="number" style={styles.input} value={editingCode.usageLimit || ''} onChange={e => setEditingCode({ ...editingCode, usageLimit: parseInt(e.target.value) || 0 })} placeholder="100" />
                                <p style={styles.hint}>0 = unlimited</p>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Expiry Date</label>
                            <input type="date" style={styles.input} value={editingCode.expiryDate?.split('T')[0] || ''} onChange={e => setEditingCode({ ...editingCode, expiryDate: e.target.value })} />
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.btnCancel} onClick={() => setEditingCode(null)}>Cancel</button>
                            <button style={styles.btnSave} onClick={handleSave}>Save Code</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PromoCodes


