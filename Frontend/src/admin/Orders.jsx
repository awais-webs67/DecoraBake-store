import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'
import { useState, useEffect } from 'react'

function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [filterStatus, setFilterStatus] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState([])

    // Shipping Modal State
    const [showShippingModal, setShowShippingModal] = useState(false)
    const [shippingInfo, setShippingInfo] = useState({
        trackingNumber: '',
        courier: '',
        trackingUrl: '',
        deliveryDays: '3-5'
    })
    const [statusToUpdate, setStatusToUpdate] = useState('')
    const [updating, setUpdating] = useState(false)
    const [invoiceLoading, setInvoiceLoading] = useState(false)
    const [stripeDetails, setStripeDetails] = useState(null)
    const [stripeLoading, setStripeLoading] = useState(false)
    const [paymentApproving, setPaymentApproving] = useState(false)

    const couriers = [
        { value: 'australia-post', label: 'Australia Post', trackingBase: 'https://auspost.com.au/mypost/track/#/details/' },
        { value: 'startrack', label: 'StarTrack', trackingBase: 'https://startrack.com.au/track/' },
        { value: 'aramex', label: 'Aramex', trackingBase: 'https://www.aramex.com/track/results?ShipmentNumber=' },
        { value: 'dhl', label: 'DHL Express', trackingBase: 'https://www.dhl.com/au-en/home/tracking/tracking-express.html?submit=1&tracking-id=' },
        { value: 'tnt', label: 'TNT', trackingBase: 'https://www.tnt.com/express/en_au/site/shipping-tools/track.html?searchType=CON&cons=' },
        { value: 'fedex', label: 'FedEx', trackingBase: 'https://www.fedex.com/fedextrack/?tracknumbers=' },
        { value: 'sendle', label: 'Sendle', trackingBase: 'https://track.sendle.com/tracking?ref=' },
        { value: 'couriers-please', label: 'Couriers Please', trackingBase: 'https://www.couriersplease.com.au/tools-track?id=' },
        { value: 'other', label: 'Other', trackingBase: '' }
    ]

    const deliveryOptions = [
        { value: '1-2', label: '1-2 Business Days' },
        { value: '2-3', label: '2-3 Business Days' },
        { value: '3-5', label: '3-5 Business Days' },
        { value: '5-7', label: '5-7 Business Days' },
        { value: '7-10', label: '7-10 Business Days' },
        { value: '10-14', label: '10-14 Business Days' },
        { value: '14-21', label: '14-21 Business Days' }
    ]

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = () => {
        adminApi.get('/api/orders')
            .then(data => { setOrders(data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order? This cannot be undone.')) return
        try {
            await adminApi.delete(`/api/admin/orders/${orderId}`)
            setSelectedOrder(null)
            fetchOrders()
        } catch (err) {
            alert('Failed to delete order: ' + err.message)
        }
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const visibleIds = filteredOrders.map(o => o.id || o._id)
            setSelectedIds(prev => {
                const newSet = new Set([...prev, ...visibleIds])
                return Array.from(newSet)
            })
        } else {
            const visibleIds = filteredOrders.map(o => o.id || o._id)
            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
        }
    }

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id])
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id))
        }
    }

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected orders?`)) return
        try {
            await adminApi.post('/api/admin/orders/bulk-delete', { ids: selectedIds })
            setSelectedIds([])
            fetchOrders()
        } catch (err) {
            alert('Failed to delete orders: ' + err.message)
        }
    }

    const handleStatusChange = (orderId, newStatus) => {
        // If changing to shipped, open shipping modal
        if (newStatus === 'shipped') {
            setStatusToUpdate(newStatus)
            setShippingInfo({ trackingNumber: '', courier: '', trackingUrl: '', deliveryDays: '3-5' })
            setShowShippingModal(true)
            return
        }

        // For other statuses, update directly with email notification
        updateOrderStatus(orderId, newStatus, {})
    }

    const updateOrderStatus = async (orderId, status, shippingData = {}) => {
        setUpdating(true)
        try {
            const result = await adminApi.put(`/api/orders/${orderId}/status`, {
                status,
                sendEmail: true,
                ...shippingData
            })

            if (result.emailSent) {
                alert(`✓ Status updated to "${status}" and email sent to customer!`)
            } else {
                alert(`✓ Status updated to "${status}". ${result.emailError ? 'Email failed: ' + result.emailError : 'No email sent.'}`)
            }

            fetchOrders()
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status, ...shippingData })
            }
        } catch (err) {
            alert('Error updating status: ' + err.message)
        }
        setUpdating(false)
        setShowShippingModal(false)
    }

    const handleShippingSubmit = () => {
        if (!shippingInfo.trackingNumber.trim()) {
            alert('Please enter a tracking number')
            return
        }

        // Build tracking URL
        let trackingUrl = shippingInfo.trackingUrl
        if (!trackingUrl && shippingInfo.courier !== 'other') {
            const courier = couriers.find(c => c.value === shippingInfo.courier)
            if (courier) {
                trackingUrl = courier.trackingBase + shippingInfo.trackingNumber
            }
        }

        updateOrderStatus(selectedOrder.id, 'shipped', {
            trackingNumber: shippingInfo.trackingNumber,
            courier: shippingInfo.courier,
            trackingUrl: trackingUrl,
            deliveryDays: shippingInfo.deliveryDays
        })
    }

    const filteredOrders = orders.filter(o => {
        const matchesStatus = !filterStatus || o.status === filterStatus
        if (!searchQuery.trim()) return matchesStatus
        const query = searchQuery.toLowerCase()
        const matchesSearch =
            (o.orderId || '').toLowerCase().includes(query) ||
            (o.customer?.firstName || '').toLowerCase().includes(query) ||
            (o.customer?.lastName || '').toLowerCase().includes(query) ||
            (o.customer?.email || '').toLowerCase().includes(query)
        return matchesStatus && matchesSearch
    })

    const openOrderDetail = (order) => {
        setSelectedOrder(order)
        setStripeDetails(null)
        setStripeLoading(false)
        if (order.paymentMethod !== 'bank_transfer' && order.stripeSessionId) {
            setStripeLoading(true)
            adminApi.get(`/api/admin/orders/${order.id || order._id}/stripe-details`)
                .then(d => setStripeDetails(d))
                .catch(() => setStripeDetails(null))
                .finally(() => setStripeLoading(false))
        }
    }

    const handleApprovePayment = async (orderId) => {
        if (!window.confirm('Mark this payment as APPROVED and move order to Processing?')) return
        setPaymentApproving(true)
        try {
            await adminApi.put(`/api/admin/orders/${orderId}/approve-payment`, {})
            setSelectedOrder(prev => ({ ...prev, paymentStatus: 'paid', status: prev.status === 'pending' ? 'processing' : prev.status }))
            fetchOrders()
        } catch { alert('Failed to approve payment') }
        setPaymentApproving(false)
    }

    const handleRejectPayment = async (orderId) => {
        if (!window.confirm('Mark this payment as REJECTED?')) return
        setPaymentApproving(true)
        try {
            await adminApi.put(`/api/admin/orders/${orderId}/reject-payment`, {})
            setSelectedOrder(prev => ({ ...prev, paymentStatus: 'failed' }))
            fetchOrders()
        } catch { alert('Failed to reject payment') }
        setPaymentApproving(false)
    }

    const handleViewInvoice = async (order) => {
        // If order already has invoice URL cached
        if (order.stripeInvoiceUrl) {
            window.open(order.stripeInvoiceUrl, '_blank')
            return
        }
        // Fetch from API
        setInvoiceLoading(true)
        try {
            const data = await adminApi.get(`/api/admin/orders/${order.id || order._id}/invoice`)
            if (data.invoiceUrl) {
                window.open(data.invoiceUrl, '_blank')
            } else {
                alert('No Stripe invoice found for this order.')
            }
        } catch (err) {
            alert('Invoice not available: ' + (err.message || 'This order may not have been paid via Stripe.'))
        }
        setInvoiceLoading(false)
    }


    const getStatusColor = (status) => {
        const colors = {
            pending: { bg: '#FFF3E0', text: '#E65100' },
            processing: { bg: '#E3F2FD', text: '#1565C0' },
            shipped: { bg: '#E8F5E9', text: '#2E7D32' },
            delivered: { bg: '#E8F5E9', text: '#1B5E20' },
            cancelled: { bg: '#FFEBEE', text: '#C62828' }
        }
        return colors[status] || { bg: '#f0f0f0', text: '#666' }
    }

    const styles = {
        page: {},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#222' },
        searchRow: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
        searchInput: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', minWidth: '250px' },
        filters: { display: 'flex', gap: '12px' },
        select: { padding: '10px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px' },
        stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
        statCard: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e5e5', textAlign: 'center' },
        statValue: { fontSize: '28px', fontWeight: '700', color: '#222' },
        statLabel: { fontSize: '13px', color: '#666', marginTop: '4px' },
        table: { width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e5e5', borderCollapse: 'collapse' },
        th: { padding: '16px', textAlign: 'left', borderBottom: '2px solid #f0f0f0', fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', background: '#fafafa' },
        td: { padding: '16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#333' },
        orderId: { fontWeight: '600', color: '#6B2346' },
        badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
        btn: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: '#E3F2FD', color: '#1565C0' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' },
        modalTitle: { fontSize: '22px', fontWeight: '600', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        section: { marginBottom: '24px' },
        sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#888', textTransform: 'uppercase', marginBottom: '12px' },
        infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
        infoItem: { background: '#f8f8f8', padding: '14px', borderRadius: '10px' },
        infoLabel: { fontSize: '12px', color: '#888', marginBottom: '4px' },
        infoValue: { fontSize: '14px', fontWeight: '500', color: '#222' },
        itemRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
        statusSelect: { padding: '10px 16px', border: '2px solid #6B2346', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: '#fff', cursor: 'pointer' },
        closeBtn: { padding: '10px 20px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' },
        input: { width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' },
        submitBtn: { padding: '14px 28px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginRight: '12px' },
        trackingInfo: { background: '#E8F5E9', padding: '16px', borderRadius: '12px', marginTop: '16px' },
        bulkActionsBar: { display: 'flex', alignItems: 'center', gap: '16px', background: '#FFEBEE', padding: '12px 20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #FFCDD2', color: '#C62828', fontSize: '14px', fontWeight: '500' },
        btnBulkDelete: { padding: '8px 16px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
    }

    const orderStats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Orders</h1>
                <div style={styles.searchRow}>
                    <input
                        type="text"
                        style={styles.searchInput}
                        placeholder="Search by order ID, customer name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <select style={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.stats}>
                <div style={styles.statCard}><div style={styles.statValue}>{orderStats.total}</div><div style={styles.statLabel}>Total Orders</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#E65100' }}>{orderStats.pending}</div><div style={styles.statLabel}>Pending</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#1565C0' }}>{orderStats.processing}</div><div style={styles.statLabel}>Processing</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#2E7D32' }}>{orderStats.shipped}</div><div style={styles.statLabel}>Shipped</div></div>
            </div>

            {selectedIds.length > 0 && (
                <div style={styles.bulkActionsBar}>
                    <span>Selected <strong>{selectedIds.length}</strong> orders</span>
                    <button style={styles.btnBulkDelete} onClick={handleBulkDelete}>Delete Selected</button>
                </div>
            )}

            {/* Orders Table */}
            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #e5e5e5', borderRadius: '16px', background: '#fff' }}>
                <table style={{ ...styles.table, border: 'none', borderRadius: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                            <th style={{ ...styles.th, width: '40px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.id || o._id))} 
                                    onChange={handleSelectAll} 
                                />
                            </th>
                            <th style={styles.th}>Order ID</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Items</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.th}>Payment</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => {
                            const orderId = order.id || order._id
                            return (
                                <tr key={orderId}>
                                    <td style={{ ...styles.td, width: '40px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(orderId)} 
                                            onChange={e => handleSelectOne(orderId, e.target.checked)} 
                                        />
                                    </td>
                                    <td style={styles.td}><span style={styles.orderId}>#{order.orderId || order.id}</span></td>
                                    <td style={styles.td}>{order.customer?.firstName} {order.customer?.lastName}<br /><span style={{ fontSize: '12px', color: '#888' }}>{order.customer?.email}</span></td>
                                    <td style={styles.td}>{order.items?.length || 0} items</td>
                                    <td style={styles.td}><strong>${order.total?.toFixed(2)}</strong></td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                                {order.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 Stripe'}
                                            </span>
                                            <span style={{ ...styles.badge, fontSize: '11px', padding: '2px 8px',
                                                background: order.paymentStatus === 'paid' ? '#DCFCE7' : order.paymentStatus === 'failed' ? '#FEE2E2' : '#FEF9C3',
                                                color: order.paymentStatus === 'paid' ? '#16A34A' : order.paymentStatus === 'failed' ? '#DC2626' : '#D97706'
                                            }}>
                                                {order.paymentStatus || 'pending'}
                                            </span>
                                            {order.paymentMethod === 'bank_transfer' && order.bankReceiptUrl && (
                                                <span style={{ fontSize: '10px', color: '#6B2346', fontWeight: '600' }}>📎 Receipt</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, background: getStatusColor(order.status).bg, color: getStatusColor(order.status).text }}>
                                            {order.status || 'pending'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                                    <td style={styles.td}>
                                        <button style={styles.btn} onClick={() => openOrderDetail(order)}>View Details</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {filteredOrders.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No orders found</div>}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div style={styles.modal} onClick={() => { setSelectedOrder(null); setStripeDetails(null) }}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalTitle}>
                            <div>
                                <span>Order #{selectedOrder.orderId || selectedOrder.id}</span>
                                <div style={{ fontSize: '13px', color: '#888', fontWeight: '400', marginTop: '4px' }}>
                                    Invoice: INV-{selectedOrder.orderId || selectedOrder.id}
                                    {selectedOrder.paymentMethod && <> &middot; Paid via {selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' : (selectedOrder.paymentMethod || 'Stripe')}</>}
                                </div>
                            </div>
                            <select
                                style={styles.statusSelect}
                                value={selectedOrder.status || 'pending'}
                                onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                disabled={updating}
                            >
                                <option value="pending">📋 Pending</option>
                                <option value="processing">⚙️ Processing</option>
                                <option value="shipped">📦 Shipped</option>
                                <option value="delivered">✅ Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
                            </select>
                        </div>

                        {/* Customer Info */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Customer Information</div>
                            <div style={styles.infoGrid}>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Name</div><div style={styles.infoValue}>{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Email</div><div style={styles.infoValue}>{selectedOrder.customer?.email}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Phone</div><div style={styles.infoValue}>{selectedOrder.customer?.phone || '-'}</div></div>
                                <div style={styles.infoItem}><div style={styles.infoLabel}>Date</div><div style={styles.infoValue}>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</div></div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Shipping Address</div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoValue}>
                                    {selectedOrder.shipping?.address}<br />
                                    {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.postcode}
                                </div>
                            </div>
                        </div>

                        {/* Tracking Info (if shipped) */}
                        {selectedOrder.trackingNumber && (
                            <div style={styles.section}>
                                <div style={styles.sectionTitle}>📦 Tracking Information</div>
                                <div style={styles.trackingInfo}>
                                    <div style={{ marginBottom: '8px' }}><strong>Tracking #:</strong> {selectedOrder.trackingNumber}</div>
                                    {selectedOrder.courier && <div style={{ marginBottom: '8px' }}><strong>Courier:</strong> {couriers.find(c => c.value === selectedOrder.courier)?.label || selectedOrder.courier}</div>}
                                    {selectedOrder.deliveryDays && <div style={{ marginBottom: '8px' }}><strong>Est. Delivery:</strong> {selectedOrder.deliveryDays} Business Days</div>}
                                    {selectedOrder.trackingUrl && (
                                        <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6B2346', fontWeight: '600' }}>
                                            Track Package →
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Section */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>
                                {selectedOrder.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer Payment' : '💳 Stripe Payment'}
                            </div>

                            {/* Payment status badge + action buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                                    background: selectedOrder.paymentStatus === 'paid' ? '#DCFCE7' : selectedOrder.paymentStatus === 'failed' ? '#FEE2E2' : '#FEF9C3',
                                    color: selectedOrder.paymentStatus === 'paid' ? '#16A34A' : selectedOrder.paymentStatus === 'failed' ? '#DC2626' : '#D97706'
                                }}>
                                    {selectedOrder.paymentStatus === 'paid' ? '✅ Payment Confirmed' : selectedOrder.paymentStatus === 'failed' ? '❌ Payment Rejected' : '⏳ Awaiting Verification'}
                                </span>
                                {selectedOrder.paymentMethod === 'bank_transfer' && selectedOrder.paymentStatus === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApprovePayment(selectedOrder.id || selectedOrder._id)}
                                            disabled={paymentApproving}
                                            style={{ padding: '8px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            {paymentApproving ? '...' : '✓ Approve Payment'}
                                        </button>
                                        <button
                                            onClick={() => handleRejectPayment(selectedOrder.id || selectedOrder._id)}
                                            disabled={paymentApproving}
                                            style={{ padding: '8px 18px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            {paymentApproving ? '...' : '✕ Reject'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Bank Transfer Receipt */}
                            {selectedOrder.paymentMethod === 'bank_transfer' && (
                                selectedOrder.bankReceiptUrl ? (
                                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', margin: '0 0 12px' }}>Payment Receipt</p>
                                        <a href={selectedOrder.bankReceiptUrl} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={selectedOrder.bankReceiptUrl}
                                                alt="Payment Receipt"
                                                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #FDE68A', display: 'block', cursor: 'pointer' }}
                                            />
                                        </a>
                                        <a href={selectedOrder.bankReceiptUrl} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: '#6B2346', fontWeight: '600', textDecoration: 'none' }}>
                                            🔗 Open Full Size Receipt
                                        </a>
                                    </div>
                                ) : (
                                    <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px', fontSize: '14px', color: '#92400E' }}>
                                        ⚠️ Customer has not uploaded a payment receipt yet.
                                    </div>
                                )
                            )}

                            {/* Stripe Details */}
                            {selectedOrder.paymentMethod !== 'bank_transfer' && (
                                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '16px' }}>
                                    {stripeLoading ? (
                                        <p style={{ fontSize: '13px', color: '#7C3AED', margin: 0 }}>Loading Stripe details...</p>
                                    ) : stripeDetails ? (
                                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                            <tbody>
                                                {stripeDetails.paymentIntentId && <tr><td style={{ padding: '4px 0', color: '#666', width: '140px' }}>Payment Intent</td><td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: '12px', color: '#4C1D95' }}>{stripeDetails.paymentIntentId}</td></tr>}
                                                <tr><td style={{ padding: '4px 0', color: '#666' }}>Session ID</td><td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: '12px', color: '#4C1D95' }}>{stripeDetails.sessionId}</td></tr>
                                                <tr><td style={{ padding: '4px 0', color: '#666' }}>Amount</td><td style={{ padding: '4px 0', fontWeight: '700' }}>AUD ${stripeDetails.amountTotal}</td></tr>
                                                <tr><td style={{ padding: '4px 0', color: '#666' }}>Status</td><td style={{ padding: '4px 0', fontWeight: '700', color: stripeDetails.paymentStatus === 'paid' ? '#16A34A' : '#D97706' }}>{stripeDetails.paymentStatus?.toUpperCase()}</td></tr>
                                                {stripeDetails.cardBrand && <tr><td style={{ padding: '4px 0', color: '#666' }}>Card</td><td style={{ padding: '4px 0', textTransform: 'capitalize' }}>{stripeDetails.cardBrand} •••• {stripeDetails.cardLast4}</td></tr>}
                                                {stripeDetails.receiptUrl && <tr><td style={{ padding: '4px 0', color: '#666' }}>Receipt</td><td style={{ padding: '4px 0' }}><a href={stripeDetails.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED', fontWeight: '600', fontSize: '13px' }}>View Stripe Receipt →</a></td></tr>}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                                            Session: <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{selectedOrder.stripeSessionId || 'N/A'}</span>
                                        </p>
                                    )}
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button
                                            style={{ padding: '8px 16px', background: '#635BFF', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                            onClick={() => handleViewInvoice(selectedOrder)}
                                            disabled={invoiceLoading}
                                        >
                                            {invoiceLoading ? 'Loading...' : '📄 View Stripe Invoice'}
                                        </button>
                                        {stripeDetails?.receiptUrl && (
                                            <a href={stripeDetails.receiptUrl} target="_blank" rel="noopener noreferrer"
                                                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #635BFF', color: '#635BFF', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                                                🧾 Stripe Receipt
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Order Items</div>
                            {selectedOrder.items?.map((item, i) => (
                                <div key={i} style={styles.itemRow}>
                                    <span>{item.name} × {item.quantity}</span>
                                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                                </div>
                            ))}
                            <div style={{ ...styles.itemRow, borderBottom: 'none', paddingTop: '16px' }}>
                                <span>Subtotal</span><span>${selectedOrder.subtotal?.toFixed(2)}</span>
                            </div>
                            <div style={styles.itemRow}>
                                <span>Shipping</span><span>{selectedOrder.shippingCost === 0 ? 'Free' : `$${selectedOrder.shippingCost?.toFixed(2) || '0.00'}`}</span>
                            </div>
                            {selectedOrder.promoCode && (
                                <div style={styles.itemRow}>
                                    <span>Promo ({selectedOrder.promoCode})</span><span style={{ color: '#2E7D32' }}>-${selectedOrder.promoDiscount?.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={styles.itemRow}>
                                <span style={{ color: '#888' }}>GST (incl.)</span><span style={{ color: '#888' }}>${selectedOrder.total ? (selectedOrder.total / 11).toFixed(2) : '0.00'}</span>
                            </div>
                            <div style={{ ...styles.itemRow, fontWeight: '700', fontSize: '18px', color: '#6B2346' }}>
                                <span>Total (AUD)</span><span>${selectedOrder.total?.toFixed(2)}</span>
                            </div>
                        </div>

                        <button style={styles.closeBtn} onClick={() => { setSelectedOrder(null); setStripeDetails(null) }}>Close</button>
                        <button 
                            style={{ ...styles.btn, background: '#FFEBEE', color: '#C62828', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', marginLeft: '12px' }} 
                            onClick={() => handleDeleteOrder(selectedOrder.id || selectedOrder._id)}
                        >
                            Delete Order
                        </button>
                    </div>
                </div>
            )}

            {/* Shipping Modal */}
            {showShippingModal && selectedOrder && (
                <div style={styles.modal} onClick={() => setShowShippingModal(false)}>
                    <div style={{ ...styles.modalContent, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>📦 Ship Order</h2>
                        <p style={{ color: '#666', marginBottom: '24px' }}>Enter shipping details. Customer will receive an email with tracking info.</p>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Tracking Number *</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={shippingInfo.trackingNumber}
                                onChange={e => setShippingInfo({ ...shippingInfo, trackingNumber: e.target.value })}
                                placeholder="Enter tracking number"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Courier / Carrier</label>
                            <select
                                style={styles.input}
                                value={shippingInfo.courier}
                                onChange={e => setShippingInfo({ ...shippingInfo, courier: e.target.value })}
                            >
                                <option value="">Select courier...</option>
                                {couriers.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        {shippingInfo.courier === 'other' && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Custom Tracking URL</label>
                                <input
                                    type="url"
                                    style={styles.input}
                                    value={shippingInfo.trackingUrl}
                                    onChange={e => setShippingInfo({ ...shippingInfo, trackingUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        )}

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Estimated Delivery</label>
                            <select
                                style={styles.input}
                                value={shippingInfo.deliveryDays}
                                onChange={e => setShippingInfo({ ...shippingInfo, deliveryDays: e.target.value })}
                            >
                                {deliveryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button
                                style={styles.submitBtn}
                                onClick={handleShippingSubmit}
                                disabled={updating}
                            >
                                {updating ? 'Sending...' : '📧 Mark as Shipped & Send Email'}
                            </button>
                            <button style={styles.closeBtn} onClick={() => setShowShippingModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Orders
