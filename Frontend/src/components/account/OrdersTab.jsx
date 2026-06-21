import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import API_BASE_URL from '../../config/api';

export default function OrdersTab({ isMobile }) {
    const { user, getUserOrders, token } = useUser();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundType, setRefundType] = useState('Refund Only');
    const [refundCategory, setRefundCategory] = useState('Item arrived damaged or defective');
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundImages, setRefundImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [userRefunds, setUserRefunds] = useState([]);
    const [addressForm, setAddressForm] = useState({});
    const [editAddressMode, setEditAddressMode] = useState(false);

    useEffect(() => {
        if (user) {
            fetchOrders();
            fetchRefunds();
        }
    }, [user]);

    const fetchRefunds = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/refunds/customer/${user.email}`);
            if (res.ok) setUserRefunds(await res.json());
        } catch (err) { console.error('Failed to fetch refunds', err); }
    };

    const fetchOrders = async () => {
        const data = await getUserOrders();
        setOrders(data || []);
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, { method: 'PUT' });
            if (res.ok) {
                setSuccess('Order cancelled successfully!');
                fetchOrders();
                setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to cancel order');
            }
        } catch (err) { setError('Network error'); }
        setLoading(false);
    };

    const handleUpdateAddress = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${selectedOrder._id}/shipping`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressForm)
            });
            if (res.ok) {
                setSuccess('Address updated successfully!');
                setEditAddressMode(false);
                setSelectedOrder(prev => ({ ...prev, shipping: addressForm }));
                fetchOrders();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update address');
            }
        } catch (err) { setError('Network error'); }
        setLoading(false);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        if (refundImages.length + files.length > 3) {
            setError('Maximum 3 images allowed');
            return;
        }

        setUploadingImages(true);
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            const res = await fetch(`${API_BASE_URL}/api/upload/customer-multiple`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setRefundImages(prev => [...prev, ...data.urls]);
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Upload network error');
        }
        setUploadingImages(false);
    };

    const handleRequestRefund = async () => {
        if (!refundReason.trim()) { setError('Please provide details for the request'); return; }
        setLoading(true);
        try {
            const finalReason = `[${refundType}] ${refundCategory} - ${refundReason}`;
            const res = await fetch(`${API_BASE_URL}/api/refunds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId: selectedOrder._id, reason: finalReason, images: refundImages })
            });
            if (res.ok) {
                setSuccess('Request submitted! We will review it shortly.');
                setShowRefundForm(false);
                setRefundReason('');
                setRefundType('Refund Only');
                setRefundImages([]);
                fetchRefunds();
                setTimeout(() => setSuccess(''), 4000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to submit request');
            }
        } catch (err) { setError('Network error'); }
        setLoading(false);
    };

    const getStatusTheme = (status) => {
        switch (status) {
            case 'delivered': return { bg: '#ECFDF5', text: '#059669', pulse: false, icon: '✓' };
            case 'shipped': return { bg: '#F3E5F5', text: '#7B1FA2', pulse: true, icon: '📦' };
            case 'processing': return { bg: '#E3F2FD', text: '#1565C0', pulse: true, icon: '⚙️' };
            case 'cancelled': return { bg: '#FEF2F2', text: '#DC2626', pulse: false, icon: '✕' };
            default: return { bg: '#FFF3E0', text: '#E65100', pulse: false, icon: '⏳' };
        }
    };

    // Advanced CSS styles localized to this component
    const styles = {
        titleContainer: { marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        sectionTitle: { fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 },
        badgeInfo: { background: '#F1F5F9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },

        listContainer: {
            maxHeight: 'calc(100vh - 280px)',
            minHeight: '400px',
            overflowY: 'auto',
            paddingRight: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            // Custom scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
        },

        card: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', flexShrink: 0 },
        cardHover: { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#cbd5e1' },
        cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
        orderId: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
        orderDate: { fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' },
        statusBadge: (theme) => ({ background: theme.bg, color: theme.text, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', border: `1px solid ${theme.text}30` }),
        previewImages: { display: 'flex', gap: '8px', marginBottom: '16px' },
        imgWrapper: { width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' },
        img: { width: '100%', height: '100%', objectFit: 'cover' },
        moreImgCount: { width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#64748b' },
        cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' },
        totalLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
        totalAmount: { fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'block', marginTop: '2px' },
        viewDetailBtn: { background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#0f172a', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },

        // Detail View Styles
        detailHeader: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '0', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', boxSizing: 'border-box' },
        backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569', transition: 'color 0.2s', padding: 0 },
        timelineBase: { display: 'flex', justifyContent: 'space-between', position: 'relative', margin: isMobile ? '20px 0 32px' : '32px 0 48px' },
        timelineLine: { position: 'absolute', top: isMobile ? '14px' : '20px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 1, borderRadius: '2px' },
        timelineFill: (percent) => ({ position: 'absolute', top: isMobile ? '14px' : '20px', left: '10%', width: percent, height: '2px', background: '#0f172a', zIndex: 2, borderRadius: '2px', transition: 'width 1s ease-in-out' }),
        timelineStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '6px' : '8px', zIndex: 3, position: 'relative', width: '25%' },
        timelineIcon: (active) => ({ width: isMobile ? '28px' : '40px', height: isMobile ? '28px' : '40px', borderRadius: '50%', background: active ? '#0f172a' : '#fff', border: active ? 'none' : '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#fff' : '#cbd5e1', fontSize: isMobile ? '14px' : '16px', fontWeight: '700', transition: 'all 0.3s', boxShadow: active ? '0 4px 12px rgba(15,23,42,0.2)' : 'none' }),
        timelineText: (active) => ({ fontSize: isMobile ? '11px' : '12px', fontWeight: '600', color: active ? '#0f172a' : '#64748b', marginTop: '4px', textAlign: 'center', wordBreak: 'break-word' }),

        // Panel styles
        panelGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? '20px' : '24px' },
        panel: { background: '#fff', borderRadius: '12px', padding: isMobile ? '20px' : '24px', border: '1px solid #e2e8f0', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
        panelTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
        itemList: { display: 'flex', flexDirection: 'column', gap: '12px' },
        itemRow: { display: 'flex', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', boxSizing: 'border-box' },
        itemImg: { width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', background: '#f1f5f9', flexShrink: 0 },
        itemInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 },
        itemName: { fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        itemMeta: { fontSize: '13px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
        itemPriceTotal: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },

        summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '8px' },
        summaryTotalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' },

        actionsPanel: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' },
        btnSecondary: { padding: '12px 20px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
        btnDanger: { padding: '12px 20px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECDD3', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }
    };

    const pulseKeyframes = `
        @keyframes pulseDot {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
    `;

    if (selectedOrder) {
        const statusMap = { 'pending': 1, 'processing': 2, 'shipped': 3, 'delivered': 4, 'cancelled': 0 };
        const currentStep = statusMap[selectedOrder.status] || 1;
        const fillPercent = currentStep === 4 ? '80%' : currentStep === 3 ? '55%' : currentStep === 2 ? '30%' : currentStep === 1 ? '5%' : '0%';

        return (
            <div>
                <style>{pulseKeyframes}</style>
                <div style={styles.detailHeader}>
                    <button style={styles.backBtn} onClick={() => setSelectedOrder(null)} onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'} onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Back to Orders
                    </button>
                    <div style={{ textAlign: 'right' }}>
                        <div style={styles.orderId}>Order #{selectedOrder.orderId}</div>
                        <div style={styles.orderDate}>{new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>

                {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #FECDD3' }}>{error}</div>}
                {success && <div style={{ background: '#ECFDF5', color: '#059669', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #A7F3D0' }}>{success}</div>}

                {/* Highly Visual Timeline */}
                {selectedOrder.status !== 'cancelled' && (
                    <div style={styles.timelineBase}>
                        <div style={styles.timelineLine}></div>
                        <div style={styles.timelineFill(fillPercent)}></div>
                        {[
                            { step: 1, label: 'Order Placed', icon: '🛒' },
                            { step: 2, label: 'Processing', icon: '⚙️' },
                            { step: 3, label: 'Shipped', icon: '📦' },
                            { step: 4, label: 'Delivered', icon: '🎉' }
                        ].map((s) => (
                            <div key={s.step} style={styles.timelineStep}>
                                <div style={styles.timelineIcon(currentStep >= s.step)}>{s.icon}</div>
                                <div style={styles.timelineText(currentStep >= s.step)}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={styles.panelGrid}>
                    <div style={styles.panel}>
                        <h3 style={styles.panelTitle}>📦 Ordered Items ({selectedOrder.items?.length})</h3>
                        <div style={styles.itemList}>
                            {selectedOrder.items?.map((item, i) => {
                                const imgSrc = item.image ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`) : '/placeholder.svg';
                                return (
                                    <div key={i} style={styles.itemRow}>
                                        <img src={imgSrc} alt={item.name} style={styles.itemImg} />
                                        <div style={styles.itemInfo}>
                                            <div style={styles.itemName}>{item.name}</div>
                                            <div style={styles.itemMeta}>
                                                <span>{item.quantity} x ${(item.price || 0).toFixed(2)}</span>
                                                <span style={styles.itemPriceTotal}>${(item.quantity * (item.price || 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div style={{ ...styles.panel, marginBottom: '24px' }}>
                            <h3 style={styles.panelTitle}>💳 Order Summary</h3>
                            <div style={styles.summaryRow}><span>Subtotal</span><span>${selectedOrder.subtotal?.toFixed(2)}</span></div>
                            <div style={styles.summaryRow}><span>Shipping</span><span>{selectedOrder.shippingCost === 0 ? 'Free' : `$${selectedOrder.shippingCost?.toFixed(2)}`}</span></div>
                            <div style={styles.summaryTotalRow}><span>Total</span><span>${selectedOrder.total?.toFixed(2)} AUD</span></div>
                        </div>

                        <div style={styles.panel}>
                            <h3 style={styles.panelTitle}>📍 Shipping Details</h3>
                            <div style={{ fontSize: '15px', color: '#444', lineHeight: '1.6' }}>
                                <strong>{selectedOrder.shipping?.firstName} {selectedOrder.shipping?.lastName}</strong><br />
                                {selectedOrder.shipping?.address}<br />
                                {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.postcode}<br />
                                {selectedOrder.shipping?.phone}
                            </div>

                            {/* Actions within logic boundaries */}
                            {selectedOrder.status === 'pending' && (
                                <div style={styles.actionsPanel}>
                                    <button style={styles.btnSecondary} onClick={() => alert('Editing address feature is under construction.')}>Edit Shipping Address</button>
                                    <button style={styles.btnDanger} onClick={() => handleCancelOrder(selectedOrder._id)}>Cancel Order</button>
                                </div>
                            )}

                            {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (() => {
                                const activeRefund = userRefunds.find(r => String(r.order) === String(selectedOrder?._id) && r.status !== 'cancelled' && r.status !== 'denied');
                                return (
                                    <div style={styles.actionsPanel}>
                                        {activeRefund ? (
                                            <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '12px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                                                <div style={{ fontWeight: '600', color: '#1E40AF', marginBottom: '8px', textTransform: 'capitalize' }}>Request File Status: {activeRefund.status}</div>
                                                <div style={{ fontSize: '14px', color: '#3B82F6', marginBottom: '12px' }}>You already have an ongoing request for this order.</div>
                                                <button style={{ ...styles.btnSecondary, background: '#fff', color: '#1E40AF', borderColor: '#BFDBFE', padding: '8px 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }} onClick={() => {
                                                    alert('Please check your Refunds tab to view your request.');
                                                }}>See your request</button>
                                            </div>
                                        ) : !showRefundForm ? (
                                            <button style={styles.btnSecondary} onClick={() => setShowRefundForm(true)}>
                                                {selectedOrder.status === 'delivered' ? 'Apply for Return / Refund' : 'Apply for Refund'}
                                            </button>
                                        ) : (
                                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                                <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a' }}>Request a Return/Refund</h4>

                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Resolution Type</label>
                                                    <select
                                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', background: '#f8fafc', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                                                        value={refundType}
                                                        onChange={e => setRefundType(e.target.value)}
                                                    >
                                                        <option value="Refund Only">Refund Only (Item not received or missing)</option>
                                                        <option value="Return & Refund">Return Item & Refund</option>
                                                    </select>
                                                </div>

                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Reason for Request</label>
                                                    <select
                                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', background: '#f8fafc', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                                                        value={refundCategory}
                                                        onChange={e => setRefundCategory(e.target.value)}
                                                    >
                                                        <option value="Item arrived damaged or defective">Item arrived damaged or defective</option>
                                                        <option value="Wrong item was sent">Wrong item was sent</option>
                                                        <option value="Item not as described">Item not as described</option>
                                                        <option value="Missing parts or accessories">Missing parts or accessories</option>
                                                        <option value="Package did not arrive">Package did not arrive</option>
                                                        <option value="Changed my mind">Changed my mind</option>
                                                    </select>
                                                </div>

                                                <div style={{ marginBottom: '24px' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Additional Details</label>
                                                    <textarea
                                                        style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '100px', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                                                        value={refundReason}
                                                        onChange={e => setRefundReason(e.target.value)}
                                                        placeholder="Please provide specific details about the issue..."
                                                    />
                                                </div>

                                                <div style={{ marginBottom: '24px' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Attach Images (Optional, max 3)</label>
                                                    {refundImages.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                            {refundImages.map((img, idx) => (
                                                                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                    <img src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} alt="Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    <button onClick={() => setRefundImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>×</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {refundImages.length < 3 && (
                                                        <div>
                                                            <input type="file" id="refund-images" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImages} />
                                                            <label htmlFor="refund-images" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: uploadingImages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569', transition: 'all 0.2s' }}>
                                                                {uploadingImages ? 'Uploading...' : '📷 Upload Images'}
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button style={{ ...styles.btnDanger, flex: 1, padding: '12px', fontSize: '14px' }} disabled={loading || uploadingImages} onClick={handleRequestRefund}>
                                                        {loading || uploadingImages ? 'Processing...' : 'Submit Request'}
                                                    </button>
                                                    <button style={{ ...styles.btnSecondary, padding: '12px', fontSize: '14px' }} onClick={() => setShowRefundForm(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <style>{pulseKeyframes}</style>
            <div style={styles.titleContainer}>
                <h2 style={styles.sectionTitle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                    Order History
                </h2>
                <div style={styles.badgeInfo}>{orders.length} Total Orders</div>
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', background: '#FAFAFA', borderRadius: '32px', border: '2px dashed #eee' }}>
                    <div style={{ fontSize: '72px', marginBottom: '24px' }}>🛒</div>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '8px' }}>No orders yet</h3>
                    <p style={{ fontSize: '16px', color: '#666', maxWidth: '400px', margin: '0 auto' }}>When you discover something sweet and place an order, it will appear here.</p>
                </div>
            ) : (
                <div style={styles.listContainer}>
                    {orders.map(order => {
                        const theme = getStatusTheme(order.status);
                        const displayItems = order.items?.slice(0, 3) || [];
                        const remainingItems = (order.items?.length || 0) - 3;

                        return (
                            <div
                                key={order.id || order._id}
                                style={styles.card}
                                onMouseEnter={(e) => { Object.assign(e.currentTarget.style, styles.cardHover) }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.04)';
                                    e.currentTarget.style.borderColor = '#f0f0f0';
                                }}
                            >
                                <div style={styles.cardTop}>
                                    <div>
                                        <div style={styles.orderId}>#{order.orderId}</div>
                                        <div style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                    </div>
                                    <div style={styles.statusBadge(theme)}>
                                        {theme.pulse && (
                                            <span style={{ width: '8px', height: '8px', background: theme.text, borderRadius: '50%', animation: 'pulseDot 2s infinite' }}></span>
                                        )}
                                        {theme.icon} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </div>
                                </div>

                                <div style={styles.previewImages}>
                                    {displayItems.map((item, idx) => {
                                        const imgUrl = item.image ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`) : null;
                                        return (
                                            <div key={idx} style={styles.imgWrapper} title={item.name}>
                                                {imgUrl ? <img src={imgUrl} alt="" style={styles.img} /> : null}
                                            </div>
                                        );
                                    })}
                                    {remainingItems > 0 && (
                                        <div style={styles.moreImgCount}>+{remainingItems}</div>
                                    )}
                                </div>

                                <div style={styles.cardBottom}>
                                    <div>
                                        <div style={styles.totalLabel}>Total</div>
                                        <div style={styles.totalAmount}>${order.total?.toFixed(2)}</div>
                                    </div>
                                    <button
                                        style={styles.viewDetailBtn}
                                        onClick={() => setSelectedOrder(order)}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#ddd'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
