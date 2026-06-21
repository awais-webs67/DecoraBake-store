import { useState, useEffect } from 'react'
import API_BASE_URL from '../config/api'

// Common Australian first names, last names, and cities to generate realistic names
const firstNames = [
    'Sarah', 'Emma', 'Olivia', 'Ava', 'Charlotte', 'Mia', 'Amelia', 'Harper',
    'Ella', 'Isabella', 'Sophia', 'Grace', 'Lily', 'Chloe', 'Zoe', 'Isla',
    'Oliver', 'Noah', 'Leo', 'William', 'Henry', 'Jack', 'Theodore', 'Hudson',
    'Charlie', 'Thomas', 'Lucas', 'Liam', 'Alexander', 'Ethan', 'Mason', 'Harrison'
]

const lastNames = [
    'Alex', 'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson',
    'Martin', 'White', 'Anderson', 'Thompson', 'Walker', 'Harris', 'Ryan',
    'Robinson', 'Kelly', 'Davis', 'Simpson', 'Wright', 'Patterson'
]

const cities = [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast',
    'Canberra', 'Hobart', 'Darwin', 'Newcastle', 'Wollongong', 'Geelong'
]

// Fallbacks in case backend API is not available or has empty inventory
const fallbackProducts = [
    'Cake Board', 'Fondant Rolling Set', 'Rainbow Sprinkle Mix', 'Piping Tip Collection',
    'Edible Gold Leaf', 'Cake Turntable Pro', 'Silicone Mould Set',
    'Food Colouring Gel Pack', 'Cake Leveler', 'Flower Nail Kit',
    'Ganache Drip Bottle', 'Buttercream Smoother', 'Wafer Paper Sheets'
]

// Sleek Feather Eye Icon SVG for View notifications
const EyeIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

// Sleek Feather Shopping Bag Icon SVG for Purchase notifications
const ShoppingBagIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
)

function SocialProof() {
    const [productsList, setProductsList] = useState(fallbackProducts)
    const [notification, setNotification] = useState(null)
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    // Fetch active products from inventory database on mount
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/products`)
            .then(res => res.json())
            .then(data => {
                if (data && data.products && data.products.length > 0) {
                    // Only include active and in-stock products
                    const available = data.products
                        .filter(p => p.enabled !== false && p.stock > 0)
                        .map(p => p.name)
                    if (available.length > 0) {
                        setProductsList(available)
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching inventory products for social proof:', err)
            })
    }, [])

    // Loop through notifications with randomized delays (e.g., 2 to 5 minutes)
    useEffect(() => {
        if (dismissed) return

        let timerId = null

        const showNotification = () => {
            if (productsList.length === 0) return

            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
            const city = cities[Math.floor(Math.random() * cities.length)]
            
            // Randomize name pattern (e.g. "Sarah Alex" or "Sarah Alex from Sydney")
            const name = Math.random() > 0.4
                ? `${firstName} ${lastName} from ${city}`
                : `${firstName} ${lastName}`

            const product = productsList[Math.floor(Math.random() * productsList.length)]
            
            // Randomize notification action (50% views, 50% purchases)
            const type = Math.random() > 0.5 ? 'view' : 'purchase'
            
            const timesAgo = ['just now', '1 minute ago', '2 minutes ago', '3 minutes ago', '5 minutes ago']
            const time = timesAgo[Math.floor(Math.random() * timesAgo.length)]

            setNotification({ name, product, time, type })
            setVisible(true)

            // Auto-hide after 6 seconds
            setTimeout(() => {
                setVisible(false)
            }, 6000)
        }

        const triggerNext = (delay) => {
            timerId = setTimeout(() => {
                showNotification()
                // Random delay for next popup: between 2 minutes (120000ms) and 5 minutes (300000ms)
                const nextDelay = 120000 + Math.random() * 180000
                triggerNext(nextDelay)
            }, delay)
        }

        // Show first notification after 40 seconds on initial load
        triggerNext(40000)

        return () => {
            if (timerId) clearTimeout(timerId)
        }
    }, [dismissed, productsList])

    if (!notification || dismissed) return null

    const isMobile = window.innerWidth < 768
    const isViewType = notification.type === 'view'

    // Premium styling config based on action type
    const config = isViewType
        ? {
            iconColor: '#0d9488', // Premium Teal
            iconBg: 'linear-gradient(135deg, #F0FDF4, #CCFBF1)',
            actionText: 'just viewed',
            badgeText: 'Live Activity',
            badgeBg: '#E0F2FE',
            badgeColor: '#0369a1',
            icon: <EyeIcon />
        }
        : {
            iconColor: '#6B2346', // Plum
            iconBg: 'linear-gradient(135deg, #FCE8ED, #F8CCD6)',
            actionText: 'just purchased',
            badgeText: 'Verified Purchase',
            badgeBg: '#FCE8ED',
            badgeColor: '#6B2346',
            icon: <ShoppingBagIcon />
        }

    return (
        <div style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '24px',
            left: isMobile ? '12px' : '24px',
            maxWidth: isMobile ? 'calc(100% - 24px)' : '350px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(107, 35, 70, 0.12)',
            padding: '14px 16px',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(120px) scale(0.95)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '1px solid rgba(107, 35, 70, 0.08)'
        }}>
            {/* Action Icon Badge */}
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: config.iconBg,
                color: config.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.03)'
            }}>
                {config.icon}
            </div>

            {/* Notification content */}
            <div style={{ flex: 1, fontFamily: "'Poppins', sans-serif" }}>
                <p style={{
                    margin: '0 0 2px 0',
                    fontSize: '12.5px',
                    color: '#222',
                    fontWeight: '600',
                    lineHeight: '1.4'
                }}>
                    {notification.name}
                </p>
                <p style={{
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    color: '#444',
                    lineHeight: '1.3'
                }}>
                    {config.actionText} <strong style={{ color: config.iconColor, fontWeight: '600' }}>{notification.product}</strong>
                </p>
                
                {/* Meta details footer row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10.5px', color: '#888' }}>
                        {notification.time}
                    </span>
                    <span style={{
                        fontSize: '9.5px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: config.badgeBg,
                        color: config.badgeColor,
                        letterSpacing: '0.2px'
                    }}>
                        {config.badgeText}
                    </span>
                </div>
            </div>

            {/* Close Button */}
            <button
                onClick={() => setDismissed(true)}
                style={{
                    background: 'rgba(0,0,0,0.03)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    color: '#888',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    transition: 'all 0.2s',
                    padding: 0,
                    alignSelf: 'flex-start',
                    marginTop: '-2px',
                    marginRight: '-4px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.08)'
                    e.currentTarget.style.color = '#333'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                    e.currentTarget.style.color = '#888'
                }}
            >
                ✕
            </button>
        </div>
    )
}

export default SocialProof
