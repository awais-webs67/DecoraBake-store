import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import API_BASE_URL from '../../config/api';

export default function RefundsTab({ isMobile }) {
    const { user, token } = useUser();
    const [refunds, setRefunds] = useState([]);
    const [expandedRefundId, setExpandedRefundId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyImages, setReplyImages] = useState([]);
    const [sending, setSending] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRefunds();
        }
    }, [user]);

    const fetchRefunds = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/refunds/customer/${user.email}`);
            const data = await res.json();
            setRefunds(data || []);
        } catch (err) { }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        if (replyImages.length + files.length > 3) {
            alert('Maximum 3 images allowed per message.');
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
                setReplyImages(prev => [...prev, ...data.urls]);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (err) { }
        setUploadingImages(false);
    };

    const handleSendMessage = async (refundId) => {
        if (!replyText.trim() && replyImages.length === 0) return;
        setSending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/refunds/${refundId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: replyText, from: 'customer', images: replyImages })
            });
            if (res.ok) {
                setReplyText('');
                setReplyImages([]);
                fetchRefunds(); // refresh data
            }
        } catch (err) { }
        setSending(false);
    };

    const getRefundTheme = (status) => {
        const themes = {
            pending: { bg: '#FFF3E0', text: '#E65100', icon: '⏳' },
            reviewing: { bg: '#E3F2FD', text: '#1565C0', icon: '🔍' },
            approved: { bg: '#E8F5E9', text: '#2E7D32', icon: '👍' },
            denied: { bg: '#FFEBEE', text: '#C62828', icon: '✕' },
            processed: { bg: '#ECFDF5', text: '#059669', icon: '💸' },
            completed: { bg: '#D1FAE5', text: '#065F46', icon: '✅' }
        };
        return themes[status] || { bg: '#f0f0f0', text: '#666', icon: '❓' };
    };

    const getRefundStep = (status) => {
        const steps = { 'pending': 1, 'reviewing': 2, 'approved': 3, 'processed': 4, 'completed': 5, 'denied': -1 };
        return steps[status] || 1;
    };

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
            // Custom scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
        },

        card: { background: '#fff', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.2s', overflow: 'hidden', flexShrink: 0 },
        cardHeader: { padding: isMobile ? '16px' : '20px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '0', cursor: 'pointer', background: '#fff', transition: 'background 0.2s' },
        headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
        expandIcon: (expanded) => ({ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: '#64748b' }),
        refundIdLabel: { fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', marginBottom: '2px' },
        refundId: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
        orderInfo: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
        statusBadge: (theme) => ({ background: theme.bg, color: theme.text, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', border: `1px solid ${theme.text}30` }),

        // Details Area (Collapsible)
        detailsArea: { padding: '0 20px 20px 20px', borderTop: '1px solid #f1f5f9' },

        infoBox: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9', marginTop: '20px', marginBottom: '20px', boxSizing: 'border-box' },
        infoBlock: { flex: 1 },
        infoLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' },
        infoValue: { fontSize: '14px', color: '#0f172a', fontWeight: '500', wordBreak: 'break-word' },
        amountValue: { fontSize: '16px', fontWeight: '700', color: '#1a1a1a' },

        // Progress Bar
        progressWrapper: { position: 'relative', margin: '24px 0 16px' },
        progressTrack: { height: '6px', background: '#e2e8f0', borderRadius: '100px', overflow: 'hidden' },
        progressFill: (percent, color) => ({ height: '100%', width: percent, background: color, borderRadius: '100px', transition: 'width 1s ease-in-out' }),
        progressLabels: { display: 'flex', justifyContent: 'space-between', marginTop: '8px' },
        progressLabel: (active, color) => ({ fontSize: isMobile ? '10px' : '11px', fontWeight: '700', color: active ? color : '#94a3b8', width: '20%', textAlign: 'center', transition: 'color 0.3s' }),

        // Denied state
        deniedAlert: { background: '#FEF2F2', padding: '12px', borderRadius: '8px', border: '1px solid #FECDD3', color: '#DC2626', fontSize: '13px', fontWeight: '600', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' },

        // Embedded Messages
        messagesArea: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' },
        msgTitle: { fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' },
        msgBubble: (isAdmin) => ({ background: isAdmin ? '#F0F9FF' : '#f8fafc', border: `1px solid ${isAdmin ? '#BAE6FD' : '#f1f5f9'}`, padding: '12px', borderRadius: isAdmin ? '12px 12px 12px 4px' : '12px 12px 4px 12px', marginLeft: isAdmin ? 0 : 'auto', marginRight: isAdmin ? 'auto' : 0, maxWidth: '85%', marginBottom: '12px', position: 'relative' }),
        msgHeader: (isAdmin) => ({ fontSize: '11px', fontWeight: '700', color: isAdmin ? '#0284C7' : '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }),
        msgText: { fontSize: '13px', color: '#334155', lineHeight: '1.5' }
    };

    return (
        <div>
            <div style={styles.titleContainer}>
                <h2 style={styles.sectionTitle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    Refund Requests
                </h2>
                <div style={styles.badgeInfo}>{refunds.length} Active</div>
            </div>

            {refunds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', background: '#FAFAFA', borderRadius: '32px', border: '2px dashed #eee' }}>
                    <div style={{ fontSize: '72px', marginBottom: '24px' }}>💰</div>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '8px' }}>No refund requests</h3>
                    <p style={{ fontSize: '16px', color: '#666', maxWidth: '400px', margin: '0 auto' }}>You haven't submitted any refund requests yet.</p>
                </div>
            ) : (
                <div style={styles.listContainer}>
                    {refunds.map(refund => {
                        const theme = getRefundTheme(refund.status);
                        const step = getRefundStep(refund.status);
                        const isDenied = step === -1;
                        let percent = '0%';
                        if (step === 1) percent = '20%';
                        if (step === 2) percent = '40%';
                        if (step === 3) percent = '60%';
                        if (step === 4) percent = '80%';
                        if (step === 5) percent = '100%';

                        const isExpanded = expandedRefundId === refund._id || expandedRefundId === refund.id;

                        return (
                            <div key={refund.id || refund._id} style={styles.card}>
                                <div
                                    style={styles.cardHeader}
                                    onClick={() => setExpandedRefundId(isExpanded ? null : (refund._id || refund.id))}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                >
                                    <div style={styles.headerLeft}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.expandIcon(isExpanded)}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                        <div>
                                            <div style={styles.refundIdLabel}>Refund ID</div>
                                            <div style={styles.refundId}>#{refund.refundId}</div>
                                            <div style={styles.orderInfo}>For Order <strong>#{refund.orderId}</strong></div>
                                        </div>
                                    </div>
                                    <div style={styles.statusBadge(theme)}>
                                        {theme.icon} {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={styles.detailsArea}>
                                        <div style={styles.infoBox}>
                                            <div style={styles.infoBlock}>
                                                <div style={styles.infoLabel}>Reason</div>
                                                <div style={styles.infoValue}>"{refund.reason}"</div>
                                            </div>
                                            <div style={{ width: isMobile ? '100%' : '1px', height: isMobile ? '1px' : 'auto', alignSelf: 'stretch', background: '#eee' }}></div>
                                            <div style={{ paddingRight: '20px' }}>
                                                <div style={styles.infoLabel}>Amount</div>
                                                <div style={styles.amountValue}>${refund.amount?.toFixed(2)} AUD</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {!isDenied ? (
                                            <div style={styles.progressWrapper}>
                                                <div style={styles.progressTrack}>
                                                    <div style={styles.progressFill(percent, theme.text)}></div>
                                                </div>
                                                <div style={styles.progressLabels}>
                                                    <div style={{ ...styles.progressLabel(step >= 1, theme.text), textAlign: 'left' }}>Requested</div>
                                                    <div style={styles.progressLabel(step >= 2, theme.text)}>Reviewing</div>
                                                    <div style={styles.progressLabel(step >= 3, theme.text)}>Approved</div>
                                                    <div style={styles.progressLabel(step >= 4, theme.text)}>Processed</div>
                                                    <div style={{ ...styles.progressLabel(step >= 5, theme.text), textAlign: 'right' }}>Completed</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={styles.deniedAlert}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                                This refund request has been denied.
                                            </div>
                                        )}

                                        <div style={styles.messagesArea}>
                                            <div style={styles.msgTitle}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                Conversation Details
                                            </div>

                                            {refund.messages?.map((msg, i) => (
                                                <div key={i} style={styles.msgBubble(msg.from === 'admin')}>
                                                    <div style={styles.msgHeader(msg.from === 'admin')}>{msg.from === 'admin' ? 'Support Team' : 'You'} <span style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.7, marginLeft: '6px' }}>{msg.date ? new Date(msg.date).toLocaleDateString() : ''}</span></div>
                                                    <div style={styles.msgText}>{msg.message}</div>
                                                    {msg.images && msg.images.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                            {msg.images.map((img, idx) => (
                                                                <a key={idx} href={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} target="_blank" rel="noopener noreferrer">
                                                                    <img src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} alt="Attached" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {(!refund.messages || refund.messages.length === 0) && (
                                                <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', fontStyle: 'italic', padding: '12px' }}>
                                                    No messages found.
                                                </div>
                                            )}
                                        </div>

                                        {!['denied', 'cancelled', 'completed'].includes(refund.status) && (
                                            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                                <textarea
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                                                    placeholder="Type a reply to Admin..."
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                />

                                                {replyImages.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                        {replyImages.map((img, idx) => (
                                                            <div key={idx} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                <img src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <button onClick={() => setReplyImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                                    <div>
                                                        <input type="file" id={`reply-images-${refund._id || refund.id}`} multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImages || replyImages.length >= 3} />
                                                        <label htmlFor={`reply-images-${refund._id || refund.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: (uploadingImages || replyImages.length >= 3) ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                                            {uploadingImages ? 'Uploading...' : '📷 Attach Image'}
                                                        </label>
                                                    </div>
                                                    <button
                                                        style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: (sending || (!replyText.trim() && replyImages.length === 0)) ? 'not-allowed' : 'pointer', opacity: (sending || (!replyText.trim() && replyImages.length === 0)) ? 0.7 : 1 }}
                                                        disabled={sending || (!replyText.trim() && replyImages.length === 0)}
                                                        onClick={() => handleSendMessage(refund._id || refund.id)}
                                                    >
                                                        {sending ? 'Sending...' : 'Send Reply'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
