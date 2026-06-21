import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { useSEO } from '../hooks/useSEO'
import { trackViewProduct, trackAddToCart } from '../components/Analytics'
import RecentlyViewed, { trackRecentlyViewed } from '../components/RecentlyViewed'
import API_BASE_URL from '../config/api'

function useWindowSize() {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return width
}

function ProductDetail() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [relatedProducts, setRelatedProducts] = useState([])
    const [reviews, setReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 })
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [mainImgError, setMainImgError] = useState(false)
    const [zoomActive, setZoomActive] = useState(false)
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
    const [addedToCart, setAddedToCart] = useState(false)
    const [activeTab, setActiveTab] = useState('description')
    const [selectedVariant, setSelectedVariant] = useState(null)
    const imgContainerRef = useRef(null)
    const { addToCart, setCartDrawerOpen } = useCart()
    const { showToast } = useToast()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const productId = product?.id || product?._id || id
    const wishlisted = isInWishlist(productId)
    const width = useWindowSize()
    const isMobile = width < 768

    useEffect(() => {
        setLoading(true)
        setMainImgError(false)
        setSelectedImage(0)
        fetch(`${API_BASE_URL}/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data)
                setLoading(false)
                if (data.categoryId) {
                    fetch(`${API_BASE_URL}/api/products?category=${data.categoryId}&limit=4&exclude=${id}`)
                        .then(res => res.json())
                        .then(related => setRelatedProducts(related.products || related || []))
                        .catch(console.error)
                }
            })
            .catch(() => setLoading(false))

        fetch(`${API_BASE_URL}/api/reviews/${id}`)
            .then(res => res.json())
            .then(data => setReviews({ reviews: data.reviews || [], averageRating: data.average || 0, totalReviews: data.count || 0 }))
            .catch(console.error)
    }, [id])

    useSEO({
        title: product?.name,
        description: product?.description?.substring(0, 160),
        image: product?.images?.[0] || product?.image,
        url: `/product/${id}`,
        type: 'product',
        product: product ? {
            name: product.name,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice,
            images: product.images || [product.image],
            sku: product.sku,
            stock: product.stock,
            id: product.id || product._id,
            rating: reviews.averageRating,
            reviewCount: reviews.totalReviews
        } : null,
        breadcrumbs: product ? [
            { name: 'Home', url: '/' },
            { name: 'Products', url: '/products' },
            { name: product.name }
        ] : null
    })

    useEffect(() => {
        if (product) {
            trackViewProduct(product)
            trackRecentlyViewed(product)
        }
    }, [product])

    const activeVariant = selectedVariant && product?.variants?.find(v => v._id === selectedVariant)
    const hasDiscount = activeVariant
        ? (activeVariant.salePrice && activeVariant.salePrice > 0 && activeVariant.salePrice < activeVariant.price)
        : (product?.salePrice && product.salePrice > 0 && product.salePrice < product.price)
    const displayPrice = activeVariant
        ? (hasDiscount ? activeVariant.salePrice : activeVariant.price)
        : (hasDiscount ? product?.salePrice : product?.price)
    const activeStock = activeVariant ? activeVariant.stock : product?.stock
    const discountPercent = hasDiscount
        ? Math.round((1 - (activeVariant ? activeVariant.salePrice / activeVariant.price : product.salePrice / product.price)) * 100)
        : 0

    const handleAddToCart = () => {
        let productToAdd = { ...product }
        if (activeVariant) {
            productToAdd = {
                ...product,
                name: `${product.name} - ${activeVariant.name}`,
                price: activeVariant.price,
                salePrice: activeVariant.salePrice || null,
                image: activeVariant.image || product.images?.[0] || product.image,
                stock: activeVariant.stock,
                customShipping: product.customShipping || 0
            }
        } else {
            productToAdd.customShipping = product.customShipping || 0
        }

        addToCart(productToAdd, quantity)
        trackAddToCart(productToAdd, quantity)
        setQuantity(1)
        setAddedToCart(true)
        showToast(`${product.name} added to cart!`, 'success')
        setCartDrawerOpen(true)
        setTimeout(() => setAddedToCart(false), 2000)
    }

    if (loading) {
        return (
            <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '48px', height: '48px', border: '3px solid #f0f0f0', borderTopColor: '#6B2346',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
            </div>
        )
    }

    if (!product) {
        return (
            <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '20px', color: '#222' }}>Product not found</h2>
                    <Link to="/products" style={{
                        display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg, #6B2346, #8B3A5E)',
                        color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: '600'
                    }}>View All Products</Link>
                </div>
            </div>
        )
    }

    const images = product.images?.length > 0 ? product.images : [product.image || '/placeholder.svg']
    const currentImage = mainImgError ? '/placeholder.svg' : (images[selectedImage] || '/placeholder.svg')

    const trustBadges = [
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, text: 'Free Shipping $149+' },
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, text: 'Secure Checkout' },
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="1.5"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>, text: '30-Day Returns' }
    ]

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '80px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px' : '40px 20px' }}>
                {/* Breadcrumb */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '28px' }}>
                    <Link to="/" style={{ color: '#6B2346', textDecoration: 'none' }}>Home</Link>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    <Link to="/products" style={{ color: '#6B2346', textDecoration: 'none' }}>Products</Link>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    <span style={{ color: '#555', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                </nav>

                {/* Main product section */}
                <div style={{
                    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '48px',
                    background: '#fff', borderRadius: '24px', padding: isMobile ? '20px' : '40px',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0'
                }}>
                    {/* Gallery */}
                    <div>
                        <div
                            ref={imgContainerRef}
                            style={{
                                position: 'relative', background: '#f8f8f8', borderRadius: '16px',
                                overflow: 'hidden', marginBottom: '14px', cursor: zoomActive ? 'zoom-out' : 'zoom-in'
                            }}
                            onClick={() => setZoomActive(!zoomActive)}
                            onMouseMove={(e) => {
                                if (!zoomActive || !imgContainerRef.current) return
                                const rect = imgContainerRef.current.getBoundingClientRect()
                                const x = ((e.clientX - rect.left) / rect.width) * 100
                                const y = ((e.clientY - rect.top) / rect.height) * 100
                                setZoomPos({ x, y })
                            }}
                            onMouseLeave={() => setZoomActive(false)}
                        >
                            {hasDiscount && (
                                <span style={{
                                    position: 'absolute', top: '16px', left: '16px', zIndex: 2,
                                    background: 'linear-gradient(135deg, #e53935, #c62828)', color: '#fff',
                                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                                    boxShadow: '0 2px 8px rgba(229,57,53,0.3)'
                                }}>{discountPercent}% OFF</span>
                            )}
                            <img
                                src={currentImage} alt={product.name}
                                style={{
                                    width: '100%', height: isMobile ? '280px' : '480px', objectFit: 'cover',
                                    transform: zoomActive ? 'scale(2)' : 'scale(1)',
                                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                    transition: zoomActive ? 'none' : 'transform 0.3s ease'
                                }}
                                onError={() => !mainImgError && setMainImgError(true)}
                            />
                            {!zoomActive && !isMobile && (
                                <div style={{
                                    position: 'absolute', bottom: '14px', right: '14px',
                                    background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '6px 12px', borderRadius: '8px',
                                    fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)'
                                }}>
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                    Click to zoom
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {images.map((img, index) => (
                                    <button key={index} onClick={() => { setSelectedImage(index); setMainImgError(false) }}
                                        style={{
                                            width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                            border: index === selectedImage ? '2.5px solid #6B2346' : '2.5px solid transparent',
                                            background: 'none', padding: 0, transition: 'all 0.2s',
                                            opacity: index === selectedImage ? 1 : 0.6
                                        }}>
                                        <img src={img || '/placeholder.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div>
                        {product.category && (
                            <Link to={`/category/${product.categorySlug}`} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '12px', color: '#6B2346', textTransform: 'uppercase', letterSpacing: '1.5px',
                                fontWeight: '600', textDecoration: 'none', marginBottom: '14px',
                                background: '#FDF2F5', padding: '6px 14px', borderRadius: '100px'
                            }}>{product.category}</Link>
                        )}

                        <h1 style={{
                            fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '22px' : '32px',
                            fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px', lineHeight: '1.25'
                        }}>{product.name}</h1>

                        {/* Rating summary */}
                        {reviews.totalReviews > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(reviews.averageRating) ? '#C9A865' : '#e0e0e0'}>
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ))}
                                </div>
                                <span style={{ fontSize: '14px', color: '#888' }}>{reviews.averageRating.toFixed(1)} ({reviews.totalReviews})</span>
                            </div>
                        )}

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px' }}>
                            <span style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '700', color: '#6B2346' }}>${displayPrice?.toFixed(2)}</span>
                            {hasDiscount && (
                                <>
                                    <span style={{ fontSize: isMobile ? '16px' : '18px', color: '#bbb', textDecoration: 'line-through' }}>${product.price.toFixed(2)}</span>
                                    <span style={{
                                        background: 'linear-gradient(135deg, #FCE8ED, #FDF2F5)', color: '#6B2346',
                                        padding: '6px 14px', borderRadius: '8px', fontSize: isMobile ? '12px' : '13px', fontWeight: '600'
                                    }}>Save ${(product.price - product.salePrice).toFixed(2)}</span>
                                </>
                            )}
                        </div>

                        {/* Stock */}
                        <div style={{ marginBottom: '24px' }}>
                            {(activeStock === undefined || activeStock > 0) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        color: '#059669', fontSize: '14px', fontWeight: '600',
                                        background: '#ECFDF5', padding: '6px 14px', borderRadius: '8px'
                                    }}>
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                        In Stock {activeStock !== undefined && `(${activeStock})`}
                                    </span>
                                    {activeStock !== undefined && activeStock > 0 && activeStock <= 5 && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            background: '#FEF3CD', color: '#856404', padding: '6px 12px', borderRadius: '8px',
                                            fontSize: '12px', fontWeight: '600', animation: 'pulse 2s infinite'
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" /></svg>
                                            Only {product.stock} left!
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e53935', fontSize: '14px', fontWeight: '600', background: '#FFEEF0', padding: '6px 14px', borderRadius: '8px' }}>Out of Stock</span>
                            )}
                        </div>

                        {/* Short description */}
                        <p style={{ fontSize: isMobile ? '14px' : '15px', color: '#666', lineHeight: '1.6', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                            {product.description?.substring(0, 200) || 'Premium quality cake decorating supply. Perfect for professionals and hobbyists alike.'}
                            {product.description?.length > 200 && '...'}
                        </p>

                        {/* Variant Selector */}
                        {product.variants && product.variants.filter(v => v.enabled !== false).length > 0 && (
                            <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Select Option</span>
                                    {selectedVariant && <span style={{ fontSize: '13px', color: '#6B2346', fontWeight: '600' }}>{activeVariant?.name || 'Original'}</span>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    <label
                                        style={{
                                            display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer',
                                            padding: '16px', borderRadius: '12px', border: !selectedVariant ? '2px solid #6B2346' : '2px solid #eaeaea',
                                            background: !selectedVariant ? '#FDF2F5' : '#fff', transition: 'all 0.2s ease', height: '100%',
                                            boxShadow: !selectedVariant ? '0 4px 12px rgba(107,35,70,0.1)' : 'none'
                                        }}
                                        onClick={() => setSelectedVariant(null)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: !selectedVariant ? '#6B2346' : '#333', lineHeight: '1.4' }}>{product.name} (Original)</span>
                                            {!selectedVariant && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>}
                                        </div>
                                    </label>
                                    {product.variants.filter(v => v.enabled !== false).map(v => (
                                        <label
                                            key={v._id}
                                            style={{
                                                display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer',
                                                padding: '16px', borderRadius: '12px', border: selectedVariant === v._id ? '2px solid #6B2346' : '2px solid #eaeaea',
                                                background: selectedVariant === v._id ? '#FDF2F5' : '#fff', transition: 'all 0.2s ease', height: '100%',
                                                boxShadow: selectedVariant === v._id ? '0 4px 12px rgba(107,35,70,0.1)' : 'none'
                                            }}
                                            onClick={() => {
                                                setSelectedVariant(v._id)
                                                if (v.image) {
                                                    const idx = images.findIndex(img => img === v.image)
                                                    if (idx >= 0) setSelectedImage(idx)
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: selectedVariant === v._id ? '#6B2346' : '#333', lineHeight: '1.4', overflowWrap: 'anywhere' }}>{v.name}</span>
                                                {selectedVariant === v._id && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>}
                                            </div>
                                            {v.price > 0 && <div style={{ fontSize: '13px', color: selectedVariant === v._id ? '#8B3A5E' : '#666', fontWeight: '500', marginTop: 'auto' }}>${v.price.toFixed(2)}</div>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {(activeStock === undefined || activeStock > 0) && (
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '10px' : '14px', marginBottom: '28px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', border: '2px solid #e8e8e8',
                                    borderRadius: '12px', overflow: 'hidden', background: '#FAFAFA'
                                }}>
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                                        style={{
                                            width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px', border: 'none', background: 'transparent',
                                            fontSize: '20px', cursor: quantity <= 1 ? 'default' : 'pointer',
                                            color: quantity <= 1 ? '#ccc' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>−</button>
                                    <span style={{ width: isMobile ? '40px' : '52px', textAlign: 'center', fontSize: isMobile ? '15px' : '16px', fontWeight: '700', color: '#222' }}>{quantity}</span>
                                    <button onClick={() => setQuantity(q => Math.min(product.stock || 999, q + 1))} disabled={product.stock && quantity >= product.stock}
                                        style={{
                                            width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px', border: 'none', background: 'transparent',
                                            fontSize: '20px', cursor: 'pointer', color: '#333',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>+</button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                                    style={{
                                        flex: 1, minWidth: isMobile ? '180px' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: isMobile ? '12px 20px' : '16px 32px',
                                        background: addedToCart ? '#059669' : 'linear-gradient(135deg, #6B2346, #8B3A5E)',
                                        color: '#fff', border: 'none', borderRadius: '14px', fontSize: isMobile ? '14px' : '16px', fontWeight: '600',
                                        cursor: 'pointer', boxShadow: addedToCart ? '0 4px 16px rgba(5,150,105,0.3)' : '0 4px 20px rgba(107,35,70,0.35)',
                                        transition: 'all 0.3s ease', letterSpacing: '0.3px', whiteSpace: 'nowrap'
                                    }}
                                >
                                    {addedToCart ? (
                                        <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Added!</>
                                    ) : (
                                        <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                            <line x1="3" y1="6" x2="21" y2="6" />
                                            <path d="M16 10a4 4 0 01-8 0" />
                                        </svg>Add to Bag</>
                                    )}
                                </button>

                                <button
                                    style={{
                                        width: isMobile ? '44px' : '50px', height: isMobile ? '44px' : '50px', borderRadius: '14px',
                                        border: wishlisted ? '2px solid #EF4444' : '2px solid #e8e8e8',
                                        background: wishlisted ? '#FEF2F2' : '#fff', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => { const added = toggleWishlist(product); showToast(added ? `${product.name} added to wishlist` : `${product.name} removed from wishlist`, added ? 'success' : 'info') }}
                                    title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22">
                                        <path fill={wishlisted ? '#EF4444' : 'none'} stroke={wishlisted ? '#EF4444' : '#bbb'} strokeWidth="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Meta */}
                        {product.sku && (
                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '24px' }}>
                                <span>SKU: </span><span style={{ color: '#555' }}>{product.sku}</span>
                            </div>
                        )}

                        {/* Trust badges */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px',
                            padding: '20px', background: '#FAFAFA', borderRadius: '16px', border: '1px solid #f0f0f0'
                        }}>
                            {trustBadges.map((badge, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#555', fontWeight: '500' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FDF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {badge.icon}
                                    </div>
                                    {badge.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs: Description / Reviews */}
                <div style={{ marginTop: '48px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: '#fff', padding: '6px', borderRadius: '14px', border: '1px solid #f0f0f0', width: 'fit-content' }}>
                        {['description', 'reviews'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                padding: '12px 28px', border: 'none', borderRadius: '10px', fontSize: '14px',
                                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                                background: activeTab === tab ? '#6B2346' : 'transparent',
                                color: activeTab === tab ? '#fff' : '#888'
                            }}>
                                {tab === 'description' ? 'Description' : `Reviews (${reviews.totalReviews})`}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'description' && (
                        <div style={{ background: '#fff', padding: isMobile ? '24px' : '36px', borderRadius: '20px', border: '1px solid #f0f0f0' }}>
                            <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.8', margin: 0 }}>
                                {product.description || 'Premium quality cake decorating supply. Perfect for professionals and hobbyists alike.'}
                            </p>
                        </div>
                    )}

                    {activeTab === 'reviews' && (() => {
                        const AVATAR_COLORS = ['#6B2346', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#4F46E5'];
                        const getInitials = (name) => {
                            if (!name || name === 'undefined undefined') return '?';
                            return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                        };
                        const getAvatarColor = (name) => AVATAR_COLORS[Math.abs((name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
                        const displayName = (name) => (!name || name === 'undefined undefined') ? 'Happy Customer' : name;
                        const previewReviews = reviews.reviews.slice(0, 3);
                        const hasMore = reviews.reviews.length > 3;

                        const ReviewCard = ({ review, compact }) => (
                            <div style={{ background: '#fff', padding: compact ? '16px' : (isMobile ? '20px' : '24px'), borderRadius: '14px', border: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(review.reviewerName),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                                        fontSize: '13px', fontWeight: '700', flexShrink: 0
                                    }}>{getInitials(review.reviewerName)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <strong style={{ fontSize: '14px', color: '#1a1a1a' }}>{displayName(review.reviewerName)}</strong>
                                            {review.isVerifiedPurchase && (
                                                <span style={{ fontSize: '10px', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>✓ Verified</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= review.rating ? '#C9A865' : '#e0e0e0'}>
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#999' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {review.title && <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>{review.title}</div>}
                                <p style={{ color: '#555', lineHeight: '1.6', margin: 0, fontSize: '13px' }}>{review.review}</p>
                            </div>
                        );

                        return (
                            <div>
                                {reviews.totalReviews > 0 ? (
                                    <>
                                        {/* Summary Bar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '20px 24px', borderRadius: '14px', border: '1px solid #f0f0f0', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a1a' }}>{reviews.averageRating.toFixed(1)}</div>
                                            <div>
                                                <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill={s <= Math.round(reviews.averageRating) ? '#C9A865' : '#e0e0e0'}>
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#666' }}>{reviews.totalReviews} review{reviews.totalReviews !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>

                                        {/* See All Button */}
                                        {reviews.totalReviews > 0 && (
                                            <button onClick={() => setActiveTab('reviews-modal')} style={{
                                                width: '100%', padding: '14px', marginTop: '8px', background: '#fff', border: '2px solid #6B2346',
                                                borderRadius: '12px', color: '#6B2346', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseEnter={e => { e.target.style.background = '#6B2346'; e.target.style.color = '#fff' }}
                                                onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#6B2346' }}
                                            >Read All {reviews.totalReviews} Reviews</button>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ background: '#fff', padding: '48px', borderRadius: '16px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
                                        <p style={{ color: '#999', margin: 0, fontSize: '15px' }}>No reviews yet. Be the first to review this product!</p>
                                    </div>
                                )}

                                {/* Reviews Modal */}
                                {activeTab === 'reviews-modal' && (
                                    <div style={{
                                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
                                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '20px', backdropFilter: 'blur(4px)'
                                    }} onClick={() => setActiveTab('reviews')}>
                                        <div style={{
                                            background: '#FAFAFA', borderRadius: '20px', width: '100%', maxWidth: '600px',
                                            maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                            boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
                                        }} onClick={e => e.stopPropagation()}>
                                            {/* Modal Header */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff',
                                                borderRadius: '20px 20px 0 0'
                                            }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>Customer Reviews</h3>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>{reviews.totalReviews} reviews · {reviews.averageRating.toFixed(1)} avg</span>
                                                </div>
                                                <button onClick={() => setActiveTab('reviews')} style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                                                    background: '#f0f0f0', cursor: 'pointer', fontSize: '18px', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', color: '#666'
                                                }}>✕</button>
                                            </div>
                                            {/* Modal Body — Scrollable */}
                                            <div style={{ overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {reviews.reviews.map(r => <ReviewCard key={r._id} review={r} compact />)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section style={{ marginTop: '60px' }}>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700',
                            color: '#1a1a1a', marginBottom: '32px', textAlign: 'center'
                        }}>You May Also Like</h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: isMobile ? '12px' : '20px'
                        }}>
                            {relatedProducts.map(p => {
                                const pId = p.id || p._id
                                if (!pId) return null
                                const pImg = p.image || p.images?.[0] || '/placeholder.svg'
                                const pPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price
                                return (
                                    <Link key={pId} to={`/product/${pId}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            background: '#fff', borderRadius: '16px', overflow: 'hidden',
                                            border: '1px solid #f0f0f0', transition: 'all 0.3s'
                                        }}>
                                            <img src={pImg} alt={p.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} loading="lazy" onError={e => e.target.src = '/placeholder.svg'} />
                                            <div style={{ padding: '16px' }}>
                                                <h3 style={{
                                                    fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: '600',
                                                    color: '#222', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                }}>{p.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#6B2346' }}>${pPrice?.toFixed ? pPrice.toFixed(2) : pPrice}</span>
                                                    {p.salePrice && p.salePrice < p.price && (
                                                        <span style={{ fontSize: '12px', color: '#bbb', textDecoration: 'line-through' }}>${p.price?.toFixed ? p.price.toFixed(2) : p.price}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Social sharing */}
                <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#999', fontWeight: '500' }}>Share:</span>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                        style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
                    </a>
                    <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer"
                        style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E60023', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2Z" /></svg>
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href) }}
                        style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', cursor: 'pointer' }} title="Copy link">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" /></svg>
                    </button>
                </div>

                <RecentlyViewed exclude={id} />
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
            `}</style>
        </div>
    )
}

export default ProductDetail
