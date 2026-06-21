import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import API_BASE_URL from '../../config/api';

export default function ReviewsTab({ isMobile }) {
    const { token } = useUser();
    const [deliveredProducts, setDeliveredProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDeliveredProducts();
    }, []);

    const fetchDeliveredProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/user/delivered-products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDeliveredProducts(Array.isArray(data) ? data : []);
        } catch (err) { }
        setLoading(false);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.review.trim() || !selectedProduct) return;

        setSubmitting(true); setError(''); setSuccess('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    productId: selectedProduct.productId,
                    orderId: selectedProduct.orderId,
                    rating: reviewForm.rating,
                    title: reviewForm.title,
                    review: reviewForm.review
                })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Review submitted successfully! Thank you for your feedback.');
                setTimeout(() => {
                    setShowModal(false);
                    setSuccess('');
                    fetchDeliveredProducts(); // Refresh list to remove reviewed item
                }, 2000);
            } else {
                setError(data.error || 'Failed to submit review');
            }
        } catch (err) { setError('Network error'); }
        setSubmitting(false);
    };

    const openReviewModal = (product) => {
        setSelectedProduct(product);
        setReviewForm({ rating: 5, title: '', review: '' });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const styles = {
        titleContainer: { marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        sectionTitle: { fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 },
        badgeInfo: { background: '#F1F5F9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },

        listContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: 'calc(100vh - 280px)',
            minHeight: '400px',
            overflowY: 'auto',
            paddingRight: '8px',
            // Custom scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
        },

        listItem: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', padding: '16px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', gap: '16px', flexShrink: 0 },
        listItemHover: { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#cbd5e1' },

        imgWrapper: { width: isMobile ? '100%' : '80px', height: isMobile ? '180px' : '80px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 },
        img: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' },

        infoContainer: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
        productName: { fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '4px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
        orderInfo: { fontSize: '13px', color: '#64748b', fontWeight: '500' },

        actionBtn: { marginTop: isMobile ? '12px' : '0', fontSize: '13px', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0f172a', padding: '10px 20px', borderRadius: '8px', width: isMobile ? '100%' : 'auto', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 },

        // Modal Styles
        overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px', opacity: showModal ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: showModal ? 'auto' : 'none' },
        modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', transform: showModal ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxSizing: 'border-box' },
        modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', zIndex: 10 },
        modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
        closeBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' },

        modalBody: { padding: '24px' },
        productPreview: { display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' },
        previewImg: { width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' },

        starsContainer: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' },
        star: (active) => ({ cursor: 'pointer', fontSize: '32px', color: active ? '#F59E0B' : '#e2e8f0', transition: 'all 0.2s', transform: active ? 'scale(1.1)' : 'scale(1)' }),

        inputGroup: { marginBottom: '20px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' },
        input: { width: '100%', padding: '12px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', boxSizing: 'border-box' },
        inputFocus: { borderColor: '#1a1a1a', boxShadow: '0 0 0 2px rgba(15,23,42,0.1)' },

        submitBtn: { width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', boxSizing: 'border-box' },

        alert: (type) => ({ background: type === 'error' ? '#FEF2F2' : '#ECFDF5', color: type === 'error' ? '#DC2626' : '#059669', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${type === 'error' ? '#FECDD3' : '#A7F3D0'}`, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' })
    };

    return (
        <div>
            <div style={styles.titleContainer}>
                <h2 style={styles.sectionTitle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Write a Review
                </h2>
                {!loading && <div style={styles.badgeInfo}>{deliveredProducts.length} Items</div>}
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading products...</div>
            ) : deliveredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', background: '#FAFAFA', borderRadius: '32px', border: '2px dashed #eee' }}>
                    <div style={{ fontSize: '72px', marginBottom: '24px' }}>⭐</div>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '8px' }}>No items to review</h3>
                    <p style={{ fontSize: '16px', color: '#666', maxWidth: '400px', margin: '0 auto' }}>Products will appear here for review once they have been delivered to you.</p>
                </div>
            ) : (
                <div style={styles.listContainer}>
                    {deliveredProducts.map((item, idx) => (
                        <div
                            key={`${item.productId}-${idx}`}
                            style={styles.listItem}
                            onMouseEnter={(e) => {
                                Object.assign(e.currentTarget.style, styles.listItemHover);
                                const img = e.currentTarget.querySelector('img');
                                if (img) img.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                const img = e.currentTarget.querySelector('img');
                                if (img) img.style.transform = 'scale(1)';
                            }}
                            onClick={() => openReviewModal(item)}
                        >
                            <div style={styles.imgWrapper}>
                                <img src={item.productImage || '/placeholder.svg'} alt="" style={styles.img} onError={e => e.target.src = '/placeholder.svg'} />
                            </div>

                            <div style={styles.infoContainer}>
                                <div style={styles.productName}>{item.productName}</div>
                                <div style={styles.orderInfo}>From Order #{item.orderId}</div>
                            </div>

                            <button style={styles.actionBtn}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Write Review
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
                <div style={styles.modal}>
                    <div style={styles.modalHeader}>
                        <h3 style={styles.modalTitle}>Leave a Review</h3>
                        <button style={styles.closeBtn} onClick={() => setShowModal(false)} onMouseEnter={e => e.currentTarget.style.background = '#eee'} onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}>✕</button>
                    </div>

                    <div style={styles.modalBody}>
                        {selectedProduct && (
                            <div style={styles.productPreview}>
                                <img src={selectedProduct.productImage || '/placeholder.svg'} alt="" style={styles.previewImg} />
                                <div>
                                    <div style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '15px', marginBottom: '4px' }}>{selectedProduct.productName}</div>
                                    <div style={{ fontSize: '13px', color: '#888' }}>Order #{selectedProduct.orderId}</div>
                                </div>
                            </div>
                        )}

                        {error && <div style={styles.alert('error')}>{error}</div>}
                        {success ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '64px', marginBottom: '20px' }}>💖</div>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '12px' }}>Thank you!</h3>
                                <p style={{ color: '#666', fontSize: '16px' }}>{success}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitReview}>
                                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Rate this product</span>
                                </div>
                                <div style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <div
                                            key={star}
                                            style={styles.star(star <= reviewForm.rating)}
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                        >
                                            ★
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Review Title</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Summarize your experience"
                                        value={reviewForm.title}
                                        onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                                        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                                        onBlur={e => { e.target.style.borderColor = '#eee'; e.target.style.background = '#FAFAFA' }}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Detailed Feedback <span style={{ color: '#DC2626' }}>*</span></label>
                                    <textarea
                                        style={{ ...styles.input, minHeight: '140px', resize: 'vertical' }}
                                        placeholder="What did you love about it? What could be improved?"
                                        required
                                        value={reviewForm.review}
                                        onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })}
                                        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                                        onBlur={e => { e.target.style.borderColor = '#eee'; e.target.style.background = '#FAFAFA' }}
                                    ></textarea>
                                </div>

                                <button type="submit" style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
