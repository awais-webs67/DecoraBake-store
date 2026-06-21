import { useState } from 'react'
import API_BASE_URL from '../config/api'

const PLACEHOLDER = '/placeholder.svg'

// Prevents infinite onError loop by tracking if fallback already tried
export function ProductImage({ src, alt, style, className }) {
    const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER)
    const [hasError, setHasError] = useState(false)

    const handleError = () => {
        if (!hasError) {
            setHasError(true)
            setImgSrc(PLACEHOLDER)
        }
    }

    return (
        <img
            src={imgSrc}
            alt={alt || 'Product'}
            style={style}
            className={className}
            onError={handleError}
        />
    )
}

// Helper to get full image URL for uploaded images
export function getImageUrl(path) {
    if (!path) return PLACEHOLDER
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads/')) return `${API_BASE_URL}${path}`
    if (path.startsWith('uploads/')) return `${API_BASE_URL}/${path}`
    return path
}

export default ProductImage
