// API Configuration for Frontend
// Reads from environment variable VITE_API_URL

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl

export default API_BASE_URL

// Helper for getting full image URLs
export const getImageUrl = (path) => {
    if (!path) return '/logo.png'
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads')) return `${API_BASE_URL}${path}`
    return path
}

// Fetch wrapper that automatically includes the base URL
export const api = {
    get: async (endpoint) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`)
        return res.json()
    },
    post: async (endpoint, data) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return res.json()
    },
    put: async (endpoint, data) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return res.json()
    },
    delete: async (endpoint) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' })
        return res.json()
    },
    upload: async (endpoint, file) => {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData
        })
        return res.json()
    }
}
