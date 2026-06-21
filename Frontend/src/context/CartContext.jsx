import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react'
import API_BASE_URL from '../config/api'

const CartContext = createContext()

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const productId = action.payload.id || action.payload._id
            const existingItem = state.items.find(item => (item.id || item._id) === productId)
            if (existingItem) {
                return {
                    ...state,
                    items: state.items.map(item =>
                        (item.id || item._id) === productId
                            ? {
                                ...item,
                                quantity: item.quantity + (action.payload.quantity || 1),
                                customShipping: action.payload.customShipping || item.customShipping || 0,
                                price: action.payload.price || item.price,
                                salePrice: action.payload.salePrice !== undefined ? action.payload.salePrice : item.salePrice
                            }
                            : item
                    )
                }
            }
            return {
                ...state,
                items: [...state.items, { ...action.payload, id: productId, quantity: action.payload.quantity || 1, customShipping: action.payload.customShipping || 0 }]
            }
        }
        case 'REMOVE_FROM_CART':
            return { ...state, items: state.items.filter(item => (item.id || item._id) !== action.payload) }
        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: state.items.map(item =>
                    (item.id || item._id) === action.payload.id
                        ? { ...item, quantity: Math.max(1, action.payload.quantity) }
                        : item
                )
            }
        case 'CLEAR_CART':
            return { ...state, items: [] }
        case 'LOAD_CART':
            return { ...state, items: action.payload || [] }
        default:
            return state
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [] })
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
    const syncTimeoutRef = useRef(null)
    const isInitializedRef = useRef(false)

    // Get token from localStorage
    const getToken = () => localStorage.getItem('decorabake_token')

    // Sync cart to backend (debounced)
    const syncToBackend = useCallback(async (items) => {
        const token = getToken()
        if (!token) return

        try {
            await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: items.map(item => ({
                        productId: item.id || item._id,
                        name: item.name,
                        price: item.price,
                        salePrice: item.salePrice,
                        image: item.image || item.images?.[0],
                        quantity: item.quantity,
                        customShipping: item.customShipping || 0
                    }))
                })
            })
        } catch (err) { console.error('Failed to sync cart:', err) }
    }, [])

    // Load cart on mount - prefer backend for logged-in users
    useEffect(() => {
        const initCart = async () => {
            const token = getToken()

            if (token) {
                // Logged in - try to load from backend
                try {
                    const res = await fetch(`${API_BASE_URL}/api/cart`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.items?.length > 0) {
                            // Convert backend format to frontend format
                            const items = data.items.map(item => ({
                                id: item.productId,
                                name: item.name,
                                price: item.price,
                                salePrice: item.salePrice,
                                image: item.image,
                                quantity: item.quantity,
                                customShipping: item.customShipping || 0
                            }))
                            dispatch({ type: 'LOAD_CART', payload: items })
                            localStorage.setItem('decorabake_cart', JSON.stringify(items))
                            isInitializedRef.current = true
                            return
                        }
                    }
                } catch (err) { console.error('Failed to load cart from backend:', err) }
            }

            // Fall back to localStorage
            const savedCart = localStorage.getItem('decorabake_cart')
            if (savedCart) {
                try {
                    const items = JSON.parse(savedCart)
                    dispatch({ type: 'LOAD_CART', payload: items })
                    // If logged in, sync localStorage cart to backend
                    if (token && items.length > 0) {
                        syncToBackend(items)
                    }
                } catch (e) { console.error('Failed to load cart from localStorage:', e) }
            }
            isInitializedRef.current = true
        }

        initCart()
    }, [syncToBackend])

    // Save cart on change (both localStorage and backend)
    useEffect(() => {
        if (!isInitializedRef.current) return

        localStorage.setItem('decorabake_cart', JSON.stringify(state.items))

        // Debounce backend sync
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = setTimeout(() => {
            syncToBackend(state.items)
        }, 1000)

        return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current) }
    }, [state.items, syncToBackend])

    const addToCart = (product, quantity = 1) => {
        dispatch({ type: 'ADD_TO_CART', payload: { ...product, quantity } })
    }

    const removeFromCart = (productId) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId })
    }

    const updateQuantity = (productId, quantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } })
    }

    const clearCart = async () => {
        dispatch({ type: 'CLEAR_CART' })
        localStorage.removeItem('decorabake_cart')
        const token = getToken()
        if (token) {
            try {
                await fetch(`${API_BASE_URL}/api/cart`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            } catch (err) { console.error('Failed to clear cart:', err) }
        }
    }

    const getCartTotal = () => {
        return state.items.reduce((total, item) => {
            const price = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price
            return total + (price * item.quantity)
        }, 0)
    }

    const getCartCount = () => {
        return state.items.reduce((count, item) => count + item.quantity, 0)
    }

    // Reload cart from backend (call after login)
    const reloadCart = async () => {
        const token = getToken()
        if (!token) return

        try {
            const res = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.items?.length > 0) {
                    const items = data.items.map(item => ({
                        id: item.productId,
                        name: item.name,
                        price: item.price,
                        salePrice: item.salePrice,
                        image: item.image,
                        quantity: item.quantity,
                        customShipping: item.customShipping || 0
                    }))
                    dispatch({ type: 'LOAD_CART', payload: items })
                }
            }
        } catch (err) { console.error('Failed to reload cart:', err) }
    }

    return (
        <CartContext.Provider value={{
            items: state.items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            reloadCart,
            cartDrawerOpen,
            setCartDrawerOpen
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within a CartProvider')
    return context
}
