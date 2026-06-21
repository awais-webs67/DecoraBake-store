import { useState, useRef, useEffect } from 'react';
import API_BASE_URL from '../../config/api';

export default function ChatTab({
    isMobile,
    user,
    chats,
    selectedChat,
    setSelectedChat,
    unreadChats,
    fetchChats,
    createNewChat,
    markChatAsRead,
    products, // For product picker
    orders    // For order history
}) {
    const [chatMessage, setChatMessage] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState('history');
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedChat?.messages?.length]);

    const sendChatMessage = async (messageType = 'text', attachment = null) => {
        if (messageType === 'text' && !chatMessage.trim()) return;
        try {
            await fetch(`${API_BASE_URL}/api/support-chats/${selectedChat.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: 'customer', message: chatMessage, messageType, attachment })
            });
            setChatMessage('');
            setShowProductPicker(false);
            fetchChats();
        } catch (err) {
            setError('Failed to send message');
        }
    };

    const sendProductInChat = (item) => {
        sendChatMessage('product', {
            type: 'product',
            id: item.id || item._id || item.productId,
            name: item.name,
            image: item.images?.[0] || item.image,
            price: item.salePrice || item.price,
            quantity: item.quantity,
            orderId: item.orderId
        });
    };

    const getOrderHistoryItems = () => {
        const items = [];
        orders.forEach(order => {
            order.items?.forEach(item => {
                items.push({
                    id: item.productId || item._id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity || 1,
                    orderId: order.orderId,
                    orderDate: order.createdAt,
                    orderStatus: order.status
                });
            });
        });
        return items;
    };

    const styles = {
        titleContainer: { marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' },
        sectionTitle: { fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 },
        btnNewChat: { padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },

        container: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: 'calc(100vh - 200px)', minHeight: '400px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },

        // Sidebar (Chat List)
        sidebar: { width: isMobile ? '100%' : '320px', background: '#f8fafc', borderRight: isMobile ? 'none' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 },
        sidebarHeader: { padding: '20px', borderBottom: '1px solid #f1f5f9' },
        sidebarTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 },
        chatList: { flex: 1, overflowY: 'auto', padding: '12px' },
        chatItem: (active) => ({ padding: '12px', borderRadius: '12px', background: active ? '#fff' : 'transparent', border: active ? '1px solid #e2e8f0' : '1px solid transparent', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.02)' : 'none', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '8px', flexShrink: 0 }),
        chatItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
        chatId: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
        chatTime: { fontSize: '11px', color: '#64748b', fontWeight: '500' },
        chatPreview: { fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        badgeUnread: { background: '#EF4444', color: '#fff', padding: '2px 6px', borderRadius: '100px', fontSize: '10px', fontWeight: '700', marginLeft: '8px' },
        statusDot: (status) => ({ width: '8px', height: '8px', borderRadius: '50%', background: status === 'resolved' ? '#10B981' : '#F59E0B', display: 'inline-block', marginRight: '6px' }),

        // Main Chat Area
        main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative' },
        chatHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', zIndex: 10 },
        headerBackBtn: { background: 'none', border: 'none', fontSize: '20px', color: '#0f172a', cursor: 'pointer', marginRight: '16px', display: isMobile ? 'block' : 'none' },
        headerTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a' },
        headerSub: { fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', marginTop: '2px' },

        messagesArea: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' },
        dateSeparator: { textAlign: 'center', margin: '8px 0' },
        dateText: { background: '#e2e8f0', color: '#475569', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '100px' },

        bubbleWrapper: (isCustomer) => ({ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start', width: '100%' }),
        bubble: (isCustomer) => ({
            background: isCustomer ? '#0f172a' : '#fff',
            color: isCustomer ? '#fff' : '#1e293b',
            padding: isMobile ? '10px 14px' : '12px 16px',
            borderRadius: isCustomer ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            maxWidth: isMobile ? '90%' : '75%',
            fontSize: isMobile ? '13px' : '14px',
            lineHeight: '1.5',
            boxShadow: isCustomer ? '0 2px 4px rgba(15,23,42,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
            border: isCustomer ? 'none' : '1px solid #e2e8f0',
            wordBreak: 'break-word'
        }),
        bubbleTime: (isCustomer) => ({ fontSize: '10px', marginTop: '4px', textAlign: isCustomer ? 'right' : 'left', opacity: isCustomer ? 0.8 : 0.5, fontWeight: '500' }),

        productAttachment: (isCustomer) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'flex-start' : 'center', background: isCustomer ? 'rgba(255,255,255,0.1)' : '#f1f5f9', padding: '10px', borderRadius: '12px', marginTop: '8px', border: isCustomer ? 'none' : '1px solid #e2e8f0' }),
        productAttImg: { width: isMobile ? '100%' : '56px', height: isMobile ? '100px' : '56px', borderRadius: '8px', objectFit: 'cover' },
        productAttName: { fontSize: '13px', fontWeight: '600', marginBottom: '4px' },
        productAttPrice: { fontSize: '14px', fontWeight: '700' },

        inputArea: { padding: isMobile ? '12px' : '16px', background: '#fff', borderTop: '1px solid #e2e8f0', boxSizing: 'border-box' },
        inputBox: { display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', background: '#f8fafc', padding: '6px', borderRadius: '100px', border: '1px solid #cbd5e1', transition: 'all 0.2s', boxSizing: 'border-box' },
        attachBtn: { width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'all 0.2s', flexShrink: 0 },
        textInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: isMobile ? '13px' : '14px', padding: '0 10px', color: '#0f172a', minWidth: 0 },
        sendBtn: { width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', borderRadius: '50%', background: '#0f172a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(15,23,42,0.1)', flexShrink: 0 },

        // Product Picker Modal
        pickerOverlay: { position: 'absolute', bottom: isMobile ? '70px' : '80px', left: isMobile ? '0' : '20px', right: isMobile ? '0' : 'auto', width: isMobile ? '100%' : '320px', background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' },
        pickerHeader: { padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        pickerTabs: { display: 'flex', padding: '8px', gap: '6px', background: '#fff', borderBottom: '1px solid #e2e8f0' },
        pickerTab: (active) => ({ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '600', color: active ? '#fff' : '#64748b', background: active ? '#0f172a' : '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }),
        pickerList: { maxHeight: '260px', overflowY: 'auto', padding: '8px' },
        pickerItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '12px', background: '#f8fafc', marginBottom: '6px', border: '1px solid #f1f5f9', gap: '8px' },
        pickerBtn: { padding: '6px 12px', background: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', flexShrink: 0 }
    };

    if (isMobile && selectedChat) {
        // Mobile Chat View (Takes up full space)
        return (
            <div style={{ ...styles.container, border: 'none', boxShadow: 'none', height: 'calc(100vh - 120px)' }}>
                {renderChatView()}
            </div>
        );
    }

    return (
        <div>
            <div style={styles.titleContainer}>
                <h2 style={styles.sectionTitle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Support Tickets
                </h2>
                {!selectedChat && (
                    <button style={styles.btnNewChat} onClick={createNewChat}>+ Start New Chat</button>
                )}
            </div>

            <div style={styles.container}>
                {/* Sidebar List */}
                {(!isMobile || !selectedChat) && (
                    <div style={styles.sidebar}>
                        <div style={styles.sidebarHeader}>
                            <h3 style={styles.sidebarTitle}>All Conversations</h3>
                        </div>
                        <div style={styles.chatList}>
                            {chats.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>No active chats</div>
                            ) : (
                                chats.map(chat => (
                                    <div
                                        key={chat.id}
                                        style={styles.chatItem(selectedChat?.id === chat.id)}
                                        onClick={() => { setSelectedChat(chat); markChatAsRead(chat.id); }}
                                    >
                                        <div style={styles.chatItemHeader}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={styles.statusDot(chat.status)}></span>
                                                <span style={styles.chatId}>#{chat.chatId}</span>
                                            </div>
                                            <div style={styles.chatTime}>{new Date(chat.lastMessage).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={styles.chatPreview}>{chat.messages?.slice(-1)[0]?.message || 'No messages'}</span>
                                            {chat.unreadCustomer > 0 && <span style={styles.badgeUnread}>{chat.unreadCustomer}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Main View */}
                {(!isMobile || selectedChat) && (
                    <div style={styles.main}>
                        {selectedChat ? renderChatView() : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
                                <div style={{ fontSize: '64px', marginBottom: '24px' }}>💬</div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Select a conversation</h3>
                                <p style={{ color: '#64748b', fontSize: '15px' }}>Choose a ticket from the left or start a new chat.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    function renderChatView() {
        return (
            <>
                <div style={styles.chatHeader}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button style={styles.headerBackBtn} onClick={() => setSelectedChat(null)}>←</button>
                        <div>
                            <div style={styles.headerTitle}>Ticket #{selectedChat.chatId}</div>
                            <div style={styles.headerSub}>
                                <span style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', display: 'inline-block' }}></span>
                                {selectedChat.status === 'resolved' ? 'Resolved Ticket' : 'Support Agent Active'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.messagesArea}>
                    <div style={styles.dateSeparator}>
                        <span style={styles.dateText}>Started • {new Date(selectedChat.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {selectedChat.messages?.map((msg, i) => (
                        <div key={i} style={styles.bubbleWrapper(msg.from === 'customer')}>
                            <div style={styles.bubble(msg.from === 'customer')}>
                                {msg.messageType === 'text' && msg.message}
                                {msg.messageType === 'product' && msg.attachment && (
                                    <div style={styles.productAttachment(msg.from === 'customer')}>
                                        <img src={msg.attachment.image || '/placeholder.svg'} alt="" style={styles.productAttImg} />
                                        <div>
                                            <div style={styles.productAttName}>{msg.attachment.name}</div>
                                            <div style={styles.productAttPrice}>${msg.attachment.price?.toFixed(2)}</div>
                                            {msg.attachment.orderId && <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Order #{msg.attachment.orderId}</div>}
                                        </div>
                                    </div>
                                )}
                                <div style={styles.bubbleTime(msg.from === 'customer')}>
                                    {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div style={styles.inputArea}>
                    {/* Floating Product Picker */}
                    {showProductPicker && (
                        <div style={styles.pickerOverlay}>
                            <div style={styles.pickerHeader}>
                                <span style={{ fontWeight: '800', fontSize: '15px' }}>Attach Product</span>
                                <button onClick={() => setShowProductPicker(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                            </div>
                            <div style={styles.pickerTabs}>
                                <button style={styles.pickerTab(pickerTab === 'history')} onClick={() => setPickerTab('history')}>My Orders ({getOrderHistoryItems().length})</button>
                                <button style={styles.pickerTab(pickerTab === 'all')} onClick={() => setPickerTab('all')}>All Products</button>
                            </div>
                            <div style={styles.pickerList}>
                                {pickerTab === 'history' ? (
                                    getOrderHistoryItems().map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} style={styles.pickerItem}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <img src={item.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Order #{item.orderId}</div>
                                                </div>
                                            </div>
                                            <button style={styles.pickerBtn} onClick={() => sendProductInChat(item)}>Send</button>
                                        </div>
                                    ))
                                ) : (
                                    products.map(product => (
                                        <div key={product.id || product._id} style={styles.pickerItem}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <img src={product.images?.[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                            </div>
                                            <button style={styles.pickerBtn} onClick={() => sendProductInChat(product)}>Send</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div style={styles.inputBox}>
                        <button
                            style={styles.attachBtn}
                            onClick={() => setShowProductPicker(!showProductPicker)}
                            title="Attach Product"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        </button>
                        <input
                            type="text"
                            style={styles.textInput}
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage('text')}
                        />
                        <button style={styles.sendBtn} onClick={() => sendChatMessage('text')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-2px) translateY(2px)' }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </button>
                    </div>
                </div>
            </>
        );
    }
}
