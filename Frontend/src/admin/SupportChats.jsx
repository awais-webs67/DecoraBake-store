import { useState, useEffect, useRef } from 'react'
import API_BASE_URL from '../config/api'
import { adminApi } from '../config/adminApi'

function useWindowSize() {
    const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const h = () => setW(window.innerWidth)
        window.addEventListener('resize', h)
        return () => window.removeEventListener('resize', h)
    }, [])
    return w
}

function SupportChats() {
    const [chats, setChats] = useState([])
    const [products, setProducts] = useState([])
    const [customerOrders, setCustomerOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedChat, setSelectedChat] = useState(null)
    const [filterStatus, setFilterStatus] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [showProductPicker, setShowProductPicker] = useState(false)
    const [productSearch, setProductSearch] = useState('')
    const [pickerTab, setPickerTab] = useState('history')
    const messagesEndRef = useRef(null)
    const width = useWindowSize()
    const isMobile = width < 768

    useEffect(() => {
        fetchChats()
        fetchProducts()
        const interval = setInterval(fetchChats, 3000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [selectedChat?.messages?.length])

    useEffect(() => {
        if (selectedChat?.customer?.email) {
            fetchCustomerOrders(selectedChat.customer.email)
        }
    }, [selectedChat?.id])

    const fetchChats = async () => {
        try {
            const data = await adminApi.get('/api/support-chats')
            setChats(Array.isArray(data) ? data : [])
            if (selectedChat) {
                const updated = data.find(c => c.id === selectedChat.id || c._id === selectedChat._id)
                if (updated) setSelectedChat(updated)
            }
        } catch (err) {
            console.error('Fetch chats error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products`)
            const data = await res.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Fetch products error:', err)
        }
    }

    const fetchCustomerOrders = async (email) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders?email=${encodeURIComponent(email)}`)
            const data = await res.json()
            setCustomerOrders(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Fetch customer orders error:', err)
            setCustomerOrders([])
        }
    }

    const getOrderHistoryItems = () => {
        const items = []
        customerOrders.forEach(order => {
            order.items?.forEach(item => {
                items.push({
                    id: item.productId || item._id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity || 1,
                    orderId: order.orderId,
                    orderDate: order.createdAt,
                    orderStatus: order.status,
                    orderTotal: order.total
                })
            })
        })
        return items
    }

    const sendMessage = async (messageType = 'text', attachment = null) => {
        if (!selectedChat) return
        if (messageType === 'text' && !newMessage.trim()) return

        try {
            const chatId = selectedChat.id || selectedChat._id
            await adminApi.post(`/api/support-chats/${chatId}/message`, {
                from: 'admin',
                message: messageType === 'text' ? newMessage : `Shared product: ${attachment?.name || ''}`,
                messageType,
                attachment
            })
            setNewMessage('')
            setShowProductPicker(false)
            await fetchChats()
        } catch (err) {
            alert('Failed to send message: ' + err.message)
        }
    }

    const sendProduct = (product) => {
        const attachment = {
            type: 'product',
            id: product.id || product._id || product.productId,
            name: product.name,
            image: product.images?.[0] || product.image || '/placeholder.svg',
            price: product.salePrice || product.price,
            orderId: product.orderId
        }
        sendMessage('product', attachment)
    }

    const updateChatStatus = async (status) => {
        if (!selectedChat) return
        try {
            const chatId = selectedChat.id || selectedChat._id
            await adminApi.put(`/api/support-chats/${chatId}`, { status })
            await fetchChats()
        } catch (err) {
            alert('Failed to update status')
        }
    }

    const markAsRead = async (chatId) => {
        try {
            await adminApi.put(`/api/support-chats/${chatId}/read`, { readBy: 'admin' })
        } catch (err) { }
    }

    const selectChat = (chat) => {
        setSelectedChat(chat)
        markAsRead(chat.id || chat._id)
    }

    const filteredChats = chats.filter(c => !filterStatus || c.status === filterStatus)
    const historyItems = getOrderHistoryItems().filter(p =>
        (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
    )
    const allProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10)

    const getStatusColor = (status) => {
        const colors = {
            open: { bg: '#FFF3E0', color: '#E65100' },
            active: { bg: '#E3F2FD', color: '#1565C0' },
            resolved: { bg: '#E8F5E9', color: '#2E7D32' },
            closed: { bg: '#f0f0f0', color: '#666' }
        }
        return colors[status] || colors.open
    }

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', fontSize: '16px' }}>Loading support chats...</div>
    }

    if (error) {
        return (
            <div style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ color: '#C62828', marginBottom: '20px' }}>Error: {error}</p>
                <button onClick={fetchChats} style={{ padding: '12px 24px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
            </div>
        )
    }

    // On mobile, show either list or detail
    const showList = !isMobile || !selectedChat
    const showDetail = !isMobile || !!selectedChat

    return (
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 200px)', minHeight: '400px', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Chat List */}
            {showList && (
                <div style={{
                    width: isMobile ? '100%' : '300px', flexShrink: 0,
                    background: '#fff', borderRadius: '14px', padding: '16px',
                    border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column',
                    maxHeight: isMobile ? '100%' : 'unset'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', margin: '0 0 12px' }}>💬 Support Chats</h2>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {['', 'open', 'active', 'resolved'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '5px 10px',
                                    border: filterStatus === status ? 'none' : '1px solid #ddd',
                                    borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                    background: filterStatus === status ? '#6B2346' : '#fff',
                                    color: filterStatus === status ? '#fff' : '#666'
                                }}
                            >
                                {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {filteredChats.length === 0 ? (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No chats found</p>
                        ) : (
                            filteredChats.map(chat => (
                                <div
                                    key={chat.id || chat._id}
                                    onClick={() => selectChat(chat)}
                                    style={{
                                        padding: '12px', marginBottom: '6px', borderRadius: '8px', cursor: 'pointer',
                                        background: selectedChat?.id === chat.id || selectedChat?._id === chat._id ? '#FCE8ED' : '#f8f8f8',
                                        border: '1px solid #eee'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <strong style={{ fontSize: '13px' }}>{chat.customer?.firstName} {chat.customer?.lastName}</strong>
                                        {chat.unreadAdmin > 0 && (
                                            <span style={{ background: '#C62828', color: '#fff', fontSize: '10px', padding: '1px 7px', borderRadius: '10px' }}>{chat.unreadAdmin}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chat.messages?.slice(-1)[0]?.message || 'No messages'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ ...getStatusColor(chat.status), padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '600' }}>{chat.status}</span>
                                        <span style={{ fontSize: '10px', color: '#999' }}>{chat.lastMessage ? new Date(chat.lastMessage).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Chat Detail */}
            {showDetail && (
                <div style={{ flex: 1, background: '#fff', borderRadius: '14px', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isMobile && (
                                        <button
                                            onClick={() => setSelectedChat(null)}
                                            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
                                        >
                                            ←
                                        </button>
                                    )}
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '15px' }}>{selectedChat.customer?.firstName} {selectedChat.customer?.lastName}</h3>
                                        <p style={{ margin: '2px 0 0', color: '#888', fontSize: '12px' }}>{selectedChat.customer?.email} • {customerOrders.length} orders</p>
                                    </div>
                                </div>
                                <select
                                    value={selectedChat.status}
                                    onChange={e => updateChatStatus(e.target.value)}
                                    style={{ padding: '6px 12px', border: '2px solid #6B2346', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    <option value="open">📋 Open</option>
                                    <option value="active">💬 Active</option>
                                    <option value="resolved">✅ Resolved</option>
                                    <option value="closed">🔒 Closed</option>
                                </select>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#fafafa', minHeight: '200px' }}>
                                {selectedChat.messages?.map((msg, i) => (
                                    <div key={i} style={{ marginBottom: '14px', maxWidth: isMobile ? '85%' : '70%', marginLeft: msg.from === 'admin' ? 'auto' : 0 }}>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: '14px',
                                            background: msg.from === 'admin' ? '#6B2346' : '#fff',
                                            color: msg.from === 'admin' ? '#fff' : '#333',
                                            border: msg.from === 'admin' ? 'none' : '1px solid #e5e5e5'
                                        }}>
                                            {msg.messageType === 'text' && <span style={{ fontSize: '14px' }}>{msg.message}</span>}
                                            {msg.messageType === 'product' && msg.attachment && (
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px' }}>
                                                    <img src={msg.attachment.image || '/placeholder.svg'} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.src = '/placeholder.svg'} />
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{msg.attachment.name}</div>
                                                        <div style={{ fontWeight: '700', fontSize: '13px', color: msg.from === 'admin' ? '#fff' : '#6B2346' }}>${msg.attachment.price?.toFixed(2)}</div>
                                                        {msg.attachment.orderId && <div style={{ fontSize: '10px', opacity: 0.8 }}>Order: {msg.attachment.orderId}</div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#888', marginTop: '3px', textAlign: msg.from === 'admin' ? 'right' : 'left' }}>
                                            {msg.from === 'admin' ? '👤 You' : '🛒 Customer'} • {new Date(msg.date).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div style={{ padding: '12px', borderTop: '1px solid #eee', position: 'relative' }}>
                                {showProductPicker && (
                                    <div style={{
                                        position: 'absolute', bottom: '100%', left: '12px', right: '12px',
                                        background: '#fff', border: '1px solid #ddd', borderRadius: '10px',
                                        padding: '14px', boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
                                        maxHeight: '280px', overflow: 'auto', zIndex: 10
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <strong style={{ fontSize: '13px' }}>Share a Product</strong>
                                            <button onClick={() => setShowProductPicker(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>×</button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                            <button
                                                onClick={() => setPickerTab('history')}
                                                style={{
                                                    flex: 1, padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px',
                                                    background: pickerTab === 'history' ? '#6B2346' : '#f0f0f0',
                                                    color: pickerTab === 'history' ? '#fff' : '#666'
                                                }}
                                            >📦 Orders ({historyItems.length})</button>
                                            <button
                                                onClick={() => setPickerTab('all')}
                                                style={{
                                                    flex: 1, padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px',
                                                    background: pickerTab === 'all' ? '#6B2346' : '#f0f0f0',
                                                    color: pickerTab === 'all' ? '#fff' : '#666'
                                                }}
                                            >🛍️ All Products</button>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box', fontSize: '13px' }}
                                        />

                                        {pickerTab === 'history' ? (
                                            historyItems.length === 0 ? (
                                                <p style={{ color: '#888', textAlign: 'center', padding: '16px', fontSize: '13px' }}>No products in order history</p>
                                            ) : (
                                                historyItems.map((item, idx) => (
                                                    <div
                                                        key={`${item.id}-${idx}`}
                                                        onClick={() => sendProduct(item)}
                                                        style={{ display: 'flex', gap: '10px', padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #eee', marginBottom: '6px', background: '#FFF8E1' }}
                                                    >
                                                        <img src={item.image || '/placeholder.svg'} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.src = '/placeholder.svg'} />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                            <div style={{ fontSize: '11px', color: '#6B2346', fontWeight: '700' }}>${item.price?.toFixed(2)} • Qty: {item.quantity}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        ) : (
                                            allProducts.length === 0 ? (
                                                <p style={{ color: '#888', textAlign: 'center', fontSize: '13px' }}>No products found</p>
                                            ) : (
                                                allProducts.map(product => (
                                                    <div
                                                        key={product.id || product._id}
                                                        onClick={() => sendProduct(product)}
                                                        style={{ display: 'flex', gap: '10px', padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #eee', marginBottom: '6px' }}
                                                    >
                                                        <img src={product.images?.[0] || product.image || '/placeholder.svg'} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '5px' }} onError={e => e.target.src = '/placeholder.svg'} />
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '12px' }}>{product.name}</div>
                                                            <div style={{ color: '#6B2346', fontWeight: '700', fontSize: '12px' }}>${(product.salePrice || product.price)?.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        )}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setShowProductPicker(!showProductPicker)}
                                        style={{ padding: '10px 12px', background: '#E3F2FD', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}
                                        title="Share Product"
                                    >📦</button>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                                        style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', outline: 'none', minWidth: 0 }}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        style={{ padding: '10px 18px', background: '#6B2346', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}
                                    >Send</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                            <span style={{ fontSize: '40px', marginBottom: '12px' }}>💬</span>
                            <span style={{ fontSize: '14px' }}>Select a chat to start messaging</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SupportChats
