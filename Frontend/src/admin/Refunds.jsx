import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

function Refunds() {
    const [refunds, setRefunds] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedRefund, setSelectedRefund] = useState(null)
    const [filterStatus, setFilterStatus] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [replyImages, setReplyImages] = useState([])
    const [uploadingImages, setUploadingImages] = useState(false)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchRefunds()
    }, [])

    const fetchRefunds = () => {
        adminApi.get('/api/refunds')
            .then(data => { setRefunds(data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const updateRefundStatus = async (refundId, status) => {
        setUpdating(true)
        try {
            await adminApi.put(`/api/refunds/${refundId}`, { status, sendEmail: true })
            alert(`✓ Status updated to "${status}" and email sent to customer!`)
            fetchRefunds()
            if (selectedRefund?.id === refundId) {
                setSelectedRefund({ ...selectedRefund, status })
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
        setUpdating(false)
    }

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return
        if (replyImages.length + files.length > 3) {
            alert('Maximum 3 images allowed per message.')
            return
        }

        setUploadingImages(true)
        const formData = new FormData()
        files.forEach(f => formData.append('files', f))

        try {
            const data = await adminApi.upload('/api/upload/multiple', formData)
            if (data.urls) {
                setReplyImages(prev => [...prev, ...data.urls])
            } else {
                alert(data.error || 'Upload failed')
            }
        } catch (err) {
            alert('Upload error: ' + err.message)
        }
        setUploadingImages(false)
    }

    const sendMessage = async () => {
        if (!newMessage.trim() && replyImages.length === 0) return alert('Please enter a message or attach an image')
        setUpdating(true)
        try {
            await adminApi.post(`/api/refunds/${selectedRefund.id}/message`, { message: newMessage, from: 'admin', sendEmail: true, images: replyImages })
            alert('✓ Message sent and email delivered to customer!')
            setNewMessage('')
            setReplyImages([])
            fetchRefunds()
            const updated = await adminApi.get('/api/refunds')
            const current = updated.find(r => r.id === selectedRefund.id)
            if (current) setSelectedRefund(current)
        } catch (err) {
            alert('Error: ' + err.message)
        }
        setUpdating(false)
    }

    const filteredRefunds = refunds.filter(r => !filterStatus || r.status === filterStatus)

    const getStatusColor = (status) => {
        const colors = {
            pending: { bg: '#FFF3E0', text: '#E65100' },
            reviewing: { bg: '#E3F2FD', text: '#1565C0' },
            approved: { bg: '#E8F5E9', text: '#2E7D32' },
            denied: { bg: '#FFEBEE', text: '#C62828' },
            completed: { bg: '#E8F5E9', text: '#1B5E20' },
            processed: { bg: '#E8F5E9', text: '#1B5E20' } // Fallback
        }
        return colors[status] || { bg: '#f0f0f0', text: '#666' }
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        filters: { display: 'flex', gap: '12px' },
        select: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px' },
        stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
        statCard: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e5e5', textAlign: 'center' },
        statValue: { fontSize: '28px', fontWeight: '700', color: '#222' },
        statLabel: { fontSize: '13px', color: '#666', marginTop: '4px' },
        table: { width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5' },
        th: { padding: '16px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', background: '#fafafa' },
        td: { padding: '16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333' },
        refundId: { fontWeight: '600', color: '#6B2346' },
        badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
        btn: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: '#E3F2FD', color: '#1565C0' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
        section: { marginBottom: '24px' },
        sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '12px' },
        infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' },
        infoItem: { background: '#f8f8f8', padding: '14px', borderRadius: '10px' },
        infoLabel: { fontSize: '12px', color: '#888', marginBottom: '4px' },
        infoValue: { fontSize: '14px', fontWeight: '500', color: '#222' },
        statusSelect: { padding: '10px 16px', border: '2px solid #6B2346', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: '#fff', cursor: 'pointer' },
        closeBtn: { padding: '10px 20px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        messageBox: { background: '#f8f8f8', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
        messageFrom: { fontSize: '12px', fontWeight: '600', marginBottom: '4px' },
        messageText: { fontSize: '14px', lineHeight: '1.6' },
        messageDate: { fontSize: '11px', color: '#888', marginTop: '8px' },
        textarea: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
        sendBtn: { padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }
    }

    const refundStats = {
        total: refunds.length,
        pending: refunds.filter(r => r.status === 'pending').length,
        reviewing: refunds.filter(r => r.status === 'reviewing').length,
        approved: refunds.filter(r => r.status === 'approved' || r.status === 'completed' || r.status === 'processed').length
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>💰 Refund & Return Requests</h1>
                <div style={styles.filters}>
                    <select style={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="reviewing">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.stats}>
                <div style={styles.statCard}><div style={styles.statValue}>{refundStats.total}</div><div style={styles.statLabel}>Total Requests</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#E65100' }}>{refundStats.pending}</div><div style={styles.statLabel}>Pending</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#1565C0' }}>{refundStats.reviewing}</div><div style={styles.statLabel}>Under Review</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#2E7D32' }}>{refundStats.approved}</div><div style={styles.statLabel}>Approved/Completed</div></div>
            </div>

            {/* Refunds Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Request ID</th>
                            <th style={styles.th}>Order ID</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Amount</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRefunds.map(refund => (
                            <tr key={refund.id}>
                                <td style={styles.td}><span style={styles.refundId}>{refund.refundId}</span></td>
                                <td style={styles.td}>{refund.orderId}</td>
                                <td style={styles.td}>{refund.customer?.firstName} {refund.customer?.lastName}<br /><span style={{ fontSize: '12px', color: '#888' }}>{refund.customer?.email}</span></td>
                                <td style={styles.td}><strong>${refund.amount?.toFixed(2)}</strong></td>
                                <td style={styles.td}>
                                    <span style={{ ...styles.badge, background: getStatusColor(refund.status).bg, color: getStatusColor(refund.status).text }}>
                                        {refund.status === 'processed' ? 'completed' : refund.status}
                                    </span>
                                </td>
                                <td style={styles.td}>{refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : '-'}</td>
                                <td style={styles.td}>
                                    <button style={styles.btn} onClick={() => { setSelectedRefund(refund); setNewMessage(''); setReplyImages([]); }}>Manage</button>
                                    {/* Make sure verified status updates to completed if it was processed */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredRefunds.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No refund/return requests found</div>}

            {/* Refund Details Modal */}
            {selectedRefund && (
                <div style={styles.modal} onClick={() => setSelectedRefund(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalTitle}>
                            <span>Refund {selectedRefund.refundId}</span>
                            <select
                                style={styles.statusSelect}
                                value={selectedRefund.status === 'processed' ? 'completed' : selectedRefund.status}
                                onChange={e => updateRefundStatus(selectedRefund.id, e.target.value)}
                                disabled={updating}
                            >
                                <option value="pending">📋 Pending</option>
                                <option value="reviewing">🔍 Under Review</option>
                                <option value="approved">✅ Approved</option>
                                <option value="denied">❌ Denied</option>
                                <option value="completed">💰 Completed</option>
                            </select>
                        </div>

                        {/* Refund Info */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Request Information</div>
                            <div style={styles.infoGrid}>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Order ID</div><div style={styles.infoValue}>{selectedRefund.orderId}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Amount</div><div style={{ ...styles.infoValue, color: '#6B2346', fontWeight: '700' }}>${selectedRefund.amount?.toFixed(2)} AUD</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Customer</div><div style={styles.infoValue}>{selectedRefund.customer?.firstName} {selectedRefund.customer?.lastName}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Email</div><div style={styles.infoValue}>{selectedRefund.customer?.email}</div></div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Reason for Request</div>
                            <div style={{ ...styles.infoItem, background: '#FFF3E0' }}>
                                <div style={styles.infoValue}>{selectedRefund.reason}</div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>💬 Messages ({selectedRefund.messages?.length || 0})</div>
                            <div style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '16px' }}>
                                {selectedRefund.messages?.map((msg, i) => (
                                    <div key={i} style={{
                                        ...styles.messageBox,
                                        background: msg.from === 'admin' ? '#E3F2FD' : '#f8f8f8',
                                        marginLeft: msg.from === 'admin' ? '20px' : '0',
                                        marginRight: msg.from === 'customer' ? '20px' : '0'
                                    }}>
                                        <div style={{ ...styles.messageFrom, color: msg.from === 'admin' ? '#1565C0' : '#6B2346' }}>
                                            {msg.from === 'admin' ? '👤 Support Team' : '🛒 Customer'}
                                        </div>
                                        <div style={styles.messageText}>{msg.message}</div>
                                        {msg.images && msg.images.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                {msg.images.map((img, idx) => (
                                                    <a key={idx} href={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} target="_blank" rel="noopener noreferrer">
                                                        <img src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} alt="Attached" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        <div style={styles.messageDate}>{new Date(msg.date).toLocaleString()}</div>
                                    </div>
                                ))}
                                {(!selectedRefund.messages || selectedRefund.messages.length === 0) && (
                                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No messages yet</div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                                <div style={styles.sectionTitle}>Send Message to Customer</div>
                                <textarea
                                    style={styles.textarea}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type your message... Customer will receive this via email."
                                />

                                {replyImages.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                        {replyImages.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                <img src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => setReplyImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                    <div>
                                        <input type="file" id="admin-reply-images" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImages || replyImages.length >= 3} />
                                        <label htmlFor="admin-reply-images" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: (uploadingImages || replyImages.length >= 3) ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                                            {uploadingImages ? 'Uploading...' : '📷 Attach Image'}
                                        </label>
                                    </div>
                                    <button
                                        style={{ ...styles.sendBtn, marginTop: 0, opacity: (updating || (!newMessage.trim() && replyImages.length === 0)) ? 0.7 : 1 }}
                                        onClick={sendMessage}
                                        disabled={updating || (!newMessage.trim() && replyImages.length === 0)}
                                    >
                                        {updating ? 'Sending...' : '📧 Send Message & Email'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button style={styles.closeBtn} onClick={() => setSelectedRefund(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Refunds
