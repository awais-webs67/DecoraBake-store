import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import multer from 'multer'
import ImageKit from 'imagekit'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import fs from 'fs'
import Stripe from 'stripe'
import { stringify } from 'csv-stringify/sync'
import { parse } from 'csv-parse/sync'
import { User, Product, Category, Order, PromoCode, Testimonial, Slider, Settings, Section, Cart, Review, Page, Refund, SupportChat, Subscriber, EmailCampaign, EmailTemplate } from './models.js'
import { sendOrderConfirmation, sendWelcomeEmail, sendShippingNotification, testEmailConnection, sendNewsletterEmail, createTransporter, sendAdminOrderNotification, sendAdminRefundNotification, sendContactFormEmail, sendAdminContactNotification, sendRefundStatusEmail, sendRefundMessageEmail, sendOrderStatusEmail, renderTemplatePreview, DEFAULT_TEMPLATES } from './emailService.js'
import generateSitemap from './sitemap.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this'
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

// ==================== SECURITY MIDDLEWARE ====================
// Helmet - Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// Compression - GZIP responses
app.use(compression())

// Rate limiting - General API
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: IS_PRODUCTION ? 200 : 1000, message: { error: 'Too many requests, please try again later' } }))

// Stricter rate limit for auth endpoints
app.use('/api/users/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts, please try again later' } }))
app.use('/api/users/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many registration attempts' } }))

// CORS - Use environment variable in production
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174').split(',').map(u => u.trim())
// Also allow common local variants
if (!IS_PRODUCTION) {
    ;['http://127.0.0.1:5173', 'http://127.0.0.1:5174'].forEach(u => { if (!allowedOrigins.includes(u)) allowedOrigins.push(u) })
}
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        if (!IS_PRODUCTION) return callback(null, true) // Allow all only in development
        callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))
// Stripe webhook needs raw body BEFORE json parser
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event
    try {
        event = webhookSecret
            ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
            : JSON.parse(req.body)
    } catch (err) {
        console.error('Stripe webhook error:', err.message)
        return res.status(400).json({ error: 'Webhook signature failed' })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        try {
            // Generate sequential order ID
            const lastOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderId')
            let nextNum = 1
            if (lastOrder?.orderId) {
                const match = lastOrder.orderId.match(/ORD-(\d+)/)
                if (match) nextNum = parseInt(match[1]) + 1
            }
            const orderId = `ORD-${String(nextNum).padStart(4, '0')}`

            // Parse metadata from session
            const metadata = session.metadata || {}
            const items = JSON.parse(metadata.items || '[]')
            const customerData = JSON.parse(metadata.customer || '{}')
            const shippingData = JSON.parse(metadata.shipping || '{}')

            const orderData = {
                orderId,
                customer: {
                    email: session.customer_email || customerData.email,
                    firstName: customerData.firstName,
                    lastName: customerData.lastName,
                    name: `${customerData.firstName} ${customerData.lastName}`,
                    phone: customerData.phone
                },
                shipping: shippingData,
                items,
                subtotal: parseFloat(metadata.subtotal) || 0,
                shippingCost: parseFloat(metadata.shippingCost) || 0,
                promoDiscount: parseFloat(metadata.promoDiscount) || 0,
                promoCode: metadata.promoCode || null,
                total: (session.amount_total || 0) / 100,
                paymentMethod: 'stripe',
                paymentStatus: 'paid',
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent,
                stripeInvoiceId: session.invoice || '',
                status: 'processing'
            }

            const order = await Order.create(orderData)

            // Decrement stock
            for (const item of items) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -(item.quantity || 1) } })
            }

            // Increment promo usage
            if (metadata.promoCode) {
                await PromoCode.findOneAndUpdate(
                    { code: metadata.promoCode.toUpperCase() },
                    { $inc: { usageCount: 1 } }
                )
            }

            // Send confirmation emails
            const settings = await Settings.findOne()
            try {
                if (settings) await sendOrderConfirmation(settings, order)
            } catch (emailErr) { console.error('Order email error:', emailErr.message) }

            try {
                if (settings?.emailEnabled && (settings?.adminEmail || settings?.adminNotificationEmail)) {
                    await sendAdminOrderNotification(settings, order)
                }
            } catch (emailErr) { if (!IS_PRODUCTION) console.error('Admin notification error:', emailErr.message) }

            console.log(`✅ Stripe order created: ${orderId}`)
        } catch (err) {
            console.error('Stripe webhook order creation error:', err.message)
        }
    }

    // Handle invoice.paid — store invoice URL on order
    if (event.type === 'invoice.paid') {
        try {
            const invoice = event.data.object
            // Find order by Stripe session ID stored in invoice metadata
            if (invoice.metadata?.checkout_session_id || invoice.id) {
                const order = await Order.findOne({
                    $or: [
                        { stripeInvoiceId: invoice.id },
                        { stripeSessionId: invoice.metadata?.checkout_session_id }
                    ]
                })
                if (order) {
                    order.stripeInvoiceId = invoice.id
                    order.stripeInvoiceUrl = invoice.hosted_invoice_url || ''
                    await order.save()
                    console.log(`✅ Invoice URL saved for order: ${order.orderId}`)
                }
            }
        } catch (err) {
            console.error('Invoice webhook error:', err.message)
        }
    }

    res.json({ received: true })
})

// Sitemap
app.get('/sitemap.xml', generateSitemap)

// Body parser with size limit
app.use(express.json({ limit: '1mb' }))

// ImageKit — single source of truth is MongoDB. .env is only the initial seed.
const getImageKitInstance = (settings) => {
    // DB keys take priority; .env is fallback seed only
    const pub = (settings?.imagekitPublicKey || '').trim() || (process.env.IMAGEKIT_PUBLIC_KEY || '').trim()
    const priv = (settings?.imagekitPrivateKey || '').trim() || (process.env.IMAGEKIT_PRIVATE_KEY || '').trim()
    const url = (settings?.imagekitUrlEndpoint || '').trim() || (process.env.IMAGEKIT_URL_ENDPOINT || '').trim()
    if (!pub || !priv || !url) return null
    try { return new ImageKit({ publicKey: pub, privateKey: priv, urlEndpoint: url }) }
    catch { return null }
}

// Upload buffer → ImageKit, return URL. Falls back to local disk if ImageKit not configured.
const uploadToImageKit = async (buffer, originalName, folder = 'decorabake') => {
    const settings = await Settings.findOne().lean()
    const ik = getImageKitInstance(settings)
    if (!ik) {
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extname(originalName).toLowerCase()}`
        fs.writeFileSync(join(uploadsDir, filename), buffer)
        return `/uploads/${filename}`
    }
    const ext = extname(originalName).toLowerCase()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`
    const result = await ik.upload({ file: buffer, fileName, folder })
    return result.url
}

// Delete a URL from ImageKit (no-op if local or not ImageKit)
const deleteFromImageKit = async (url) => {
    if (!url || !url.startsWith('https://ik.imagekit.io')) return
    try {
        const settings = await Settings.findOne().lean()
        const ik = getImageKitInstance(settings)
        if (!ik) return
        const urlPath = new URL(url).pathname  // e.g. /xjbkaiwiu/decorabake/file.jpg
        const fileName = urlPath.split('/').pop()
        const files = await ik.listFiles({ name: fileName, limit: 20 })
        const match = files.find(f => f.url === url || url.includes(f.filePath || ''))
        if (match) await ik.deleteFile(match.fileId)
    } catch (err) {
        if (!IS_PRODUCTION) console.error('ImageKit delete error:', err.message)
    }
}

// Local fallback uploads dir (used when ImageKit not configured)
const uploadsDir = join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// File upload config with type validation
const allowedFileTypes = /jpeg|jpg|png|gif|webp|svg|avif/
// Use memory storage — files go to ImageKit, not disk
const storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = allowedFileTypes.test(extname(file.originalname).toLowerCase())
        const mime = allowedFileTypes.test(file.mimetype)
        if (ext && mime) return cb(null, true)
        cb(new Error('Only image files (jpg, png, gif, webp, svg) are allowed'))
    }
})

// Error handler helper
const apiError = (res, err, status = 500) => {
    if (!IS_PRODUCTION) console.error(err)
    res.status(status).json({ error: IS_PRODUCTION ? 'Server error' : err.message })
}

// ==================== AUTH MIDDLEWARE ====================
// JWT Middleware - verifies token for any logged-in user
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Token required' })
    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        res.status(403).json({ error: 'Invalid token' })
    }
}

// Admin Middleware - verifies token AND admin role
const adminMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Token required' })
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
        req.user = decoded
        next()
    } catch {
        res.status(403).json({ error: 'Invalid token' })
    }
}

const generateToken = (user) => jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

// Seed ImageKit (and other env keys) into MongoDB Settings if DB fields are empty
const seedSettingsFromEnv = async () => {
    const s = await Settings.findOne()
    if (!s) return
    const updates = {}
    if (!s.imagekitPublicKey && process.env.IMAGEKIT_PUBLIC_KEY) updates.imagekitPublicKey = process.env.IMAGEKIT_PUBLIC_KEY.trim()
    if (!s.imagekitPrivateKey && process.env.IMAGEKIT_PRIVATE_KEY) updates.imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY.trim()
    if (!s.imagekitUrlEndpoint && process.env.IMAGEKIT_URL_ENDPOINT) updates.imagekitUrlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT.trim()
    if (updates.imagekitPublicKey || updates.imagekitPrivateKey || updates.imagekitUrlEndpoint) updates.imagekitEnabled = true
    if (!s.geminiApiKey && process.env.GEMINI_API_KEY) updates.geminiApiKey = process.env.GEMINI_API_KEY.trim()
    if (!s.qwenApiKey && process.env.QWEN_API_KEY) updates.qwenApiKey = process.env.QWEN_API_KEY.trim()
    if (!s.openRouterApiKey && process.env.OPENROUTER_API_KEY) updates.openRouterApiKey = process.env.OPENROUTER_API_KEY.trim()
    if (!s.longcatApiKey && process.env.LONGCAT_API_KEY) updates.longcatApiKey = process.env.LONGCAT_API_KEY.trim()
    if (Object.keys(updates).length) {
        Object.assign(s, updates)
        await s.save()
        console.log('✅ Seeded settings from .env:', Object.keys(updates).join(', '))
    }
}

// MongoDB Connection with retry
const connectDB = async (retries = 10) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI)
            console.log('✅ MongoDB connected!')
            if (!(await Settings.findOne())) await Settings.create({})
            await seedSettingsFromEnv()
            return
        } catch (err) {
            console.error(`❌ MongoDB error (attempt ${i + 1}/${retries}):`, err.message)
            if (i < retries - 1) {
                console.log('⏳ Retrying in 5 seconds...')
                await new Promise(r => setTimeout(r, 5000))
            }
        }
    }
    console.error('❌ Could not connect to MongoDB after all retries. Server will continue running without DB.')
}
connectDB()

// ==================== USER AUTH ====================
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body
        if (!email || !password || !firstName || !lastName) return res.status(400).json({ error: 'All fields required' })
        if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' })
        if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ error: 'Email already registered' })

        const user = await User.create({ email, password, firstName, lastName, phone })
        const token = generateToken(user)
        const userObj = user.toObject(); delete userObj.password

        // Send welcome email
        try {
            const settings = await Settings.findOne()
            if (settings) await sendWelcomeEmail(settings, user)
        } catch (emailErr) { console.error('Welcome email error:', emailErr.message) }

        res.status(201).json({ success: true, user: userObj, token })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' })

        const token = generateToken(user)
        const userObj = user.toObject(); delete userObj.password
        res.json({ success: true, user: userObj, token })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Not authorized' })
        const { email, password, ...updates } = req.body
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
        res.json({ success: true, user })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/users/:id/orders', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ error: 'User not found' })
        const orders = await Order.find({ 'customer.email': user.email.toLowerCase() }).sort({ createdAt: -1 })

        // Collect all unique productIds from all orders
        const allProductIds = [...new Set(orders.flatMap(o => (o.items || []).map(i => i.productId).filter(Boolean)))]

        // Fetch all those products in one query
        const products = await Product.find({ _id: { $in: allProductIds } }).select('images').lean()
        const productMap = {}
        products.forEach(p => { productMap[p._id.toString()] = p.images })

        // Attach image to each order item
        const enrichedOrders = orders.map(o => {
            const obj = o.toObject()
            obj.items = (obj.items || []).map(item => {
                const imgs = productMap[item.productId]
                if (imgs && imgs.length > 0) {
                    item.image = imgs[0]
                }
                return item
            })
            return obj
        })

        res.json(enrichedOrders)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Forgot password — send reset link via email
app.post('/api/users/forgot-password', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email is required' })

        const user = await User.findOne({ email: email.toLowerCase() })
        // Always respond success to prevent email enumeration
        if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })

        const token = crypto.randomBytes(32).toString('hex')
        user.resetPasswordToken = token
        user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        await user.save()

        const settings = await Settings.findOne()
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${token}`

        if (settings?.emailEnabled) {
            try {
                const { sendGenericEmail } = await import('./emailService.js')
                await sendGenericEmail(settings, {
                    to: user.email,
                    subject: 'Reset Your DecoraBake Password',
                    html: `<p>Hi ${user.firstName},</p>
<p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
<p><a href="${resetUrl}" style="background:#6B2346;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a></p>
<p>Or copy this link: ${resetUrl}</p>
<p>If you didn't request this, you can ignore this email.</p>`
                })
            } catch (emailErr) { console.error('Reset email error:', emailErr.message) }
        }

        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Reset password with token
app.post('/api/users/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required' })
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiry: { $gt: new Date() } })
        if (!user) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' })

        user.password = password
        user.resetPasswordToken = null
        user.resetPasswordExpiry = null
        await user.save()

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Password update endpoint
app.put('/api/users/:id/password', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Not authorized' })
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' })
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' })

        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ error: 'User not found' })

        const isMatch = await user.comparePassword(currentPassword)
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' })

        user.password = newPassword
        await user.save()
        res.json({ success: true, message: 'Password updated successfully' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CART ENDPOINTS ====================
// Get user's cart
app.get('/api/cart', authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id })
        if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] })
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update entire cart (sync from frontend)
app.put('/api/cart', authMiddleware, async (req, res) => {
    try {
        const { items } = req.body
        let cart = await Cart.findOneAndUpdate(
            { userId: req.user.id },
            { userId: req.user.id, items },
            { upsert: true, new: true }
        )
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add item to cart
app.post('/api/cart/add', authMiddleware, async (req, res) => {
    try {
        const { productId, name, price, salePrice, image, quantity = 1 } = req.body
        let cart = await Cart.findOne({ userId: req.user.id })

        if (!cart) {
            cart = await Cart.create({ userId: req.user.id, items: [{ productId, name, price, salePrice, image, quantity }] })
        } else {
            const existingItem = cart.items.find(item => item.productId === productId)
            if (existingItem) {
                existingItem.quantity += quantity
            } else {
                cart.items.push({ productId, name, price, salePrice, image, quantity })
            }
            await cart.save()
        }
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Remove item from cart
app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id })
        if (!cart) return res.status(404).json({ error: 'Cart not found' })

        cart.items = cart.items.filter(item => item.productId !== req.params.productId)
        await cart.save()
        res.json(cart)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Clear cart
app.delete('/api/cart', authMiddleware, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user.id })
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Helper to convert relative paths to full URLs
const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === '/' || imagePath === '') return '/placeholder.svg'
    if (imagePath.startsWith('http')) return imagePath
    if (imagePath.startsWith('/uploads/')) return `${process.env.BACKEND_URL || `http://localhost:${PORT}`}${imagePath}`
    if (imagePath.startsWith('/')) return imagePath
    return imagePath
}

// ==================== PRODUCTS ====================
app.get('/api/products', async (req, res) => {
    try {
        const { category, featured, search, limit = 50, sort = 'newest' } = req.query
        let query = { enabled: { $ne: false } }

        // Handle category filter - can be categoryId or slug
        if (category) {
            // First try to find by slug
            const cat = await Category.findOne({ slug: category })
            if (cat) {
                query.categoryId = cat._id.toString()
            } else {
                // Maybe it's already a categoryId
                query.categoryId = category
            }
        }

        if (featured === 'true') query.isFeatured = true
        if (search) query.name = { $regex: search, $options: 'i' }

        // Determine sort order based on sort parameter
        let sortOption = { createdAt: -1 } // default: newest first
        switch (sort) {
            case 'price-low':
                sortOption = { price: 1 }
                break
            case 'price-high':
                sortOption = { price: -1 }
                break
            case 'name':
                sortOption = { name: 1 }
                break
            case 'newest':
            default:
                sortOption = { createdAt: -1 }
        }

        const products = await Product.find(query).limit(parseInt(limit)).sort(sortOption).lean()
        // Map _id to id for frontend compatibility
        const mappedProducts = products.map(p => {
            const firstImage = p.images?.[0] || p.image
            return {
                ...p,
                id: p._id.toString(),
                image: getImageUrl(firstImage),
                images: (p.images || []).map(img => getImageUrl(img))
            }
        })
        res.json({ products: mappedProducts, total: mappedProducts.length })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/products/:id', async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined') return res.status(400).json({ error: 'Invalid product ID' })
        const product = await Product.findById(req.params.id).lean()
        if (!product) return res.status(404).json({ error: 'Not found' })
        const firstImage = product.images?.[0] || product.image
        res.json({
            ...product,
            id: product._id.toString(),
            image: getImageUrl(firstImage),
            images: (product.images || []).map(img => getImageUrl(img))
        })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/products', adminMiddleware, async (req, res) => {
    try { res.status(201).json(await Product.create(req.body)) }
    catch (err) { apiError(res, err) }
})

app.put('/api/products/:id', adminMiddleware, async (req, res) => {
    try {
        const old = await Product.findById(req.params.id)
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
        // Delete old ImageKit images that were replaced
        if (old?.images?.length && req.body.images) {
            const newSet = new Set(req.body.images)
            for (const img of old.images) { if (!newSet.has(img)) deleteFromImageKit(img) }
        }
        res.json(updated)
    } catch (err) { apiError(res, err) }
})

app.delete('/api/products/:id', adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        await Product.findByIdAndDelete(req.params.id)
        if (product?.images?.length) product.images.forEach(img => deleteFromImageKit(img))
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

app.post('/api/admin/products/bulk-delete', adminMiddleware, async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No IDs provided' })
        const products = await Product.find({ _id: { $in: ids } }).lean()
        await Product.deleteMany({ _id: { $in: ids } })
        for (const p of products) {
            if (p.images?.length) p.images.forEach(img => deleteFromImageKit(img))
        }
        res.json({ success: true, message: `${ids.length} products deleted` })
    } catch (err) { apiError(res, err) }
})

// ==================== PRODUCT CSV ENDPOINTS ====================
app.get('/api/admin/products/export', adminMiddleware, async (req, res) => {
    try {
        const products = await Product.find().lean()
        const rows = []
        for (const p of products) {
            // Base product row
            rows.push({
                Title: p.name || '',
                Description: p.description || '',
                Price: p.price || 0,
                SalePrice: p.salePrice || '',
                Category: p.categoryId || '',
                Stock: p.stock || 0,
                Image: p.images?.[0] || p.image || '',
                IsNew: p.isNew ? 'TRUE' : 'FALSE',
                IsFeatured: p.isFeatured ? 'TRUE' : 'FALSE',
                CustomShipping: p.customShipping || '',
                VariantName: '',
                VariantPrice: '',
                VariantStock: '',
                VariantImage: '',
                VariantDescription: ''
            })
            // Variant rows
            if (p.variants && p.variants.length > 0) {
                for (const v of p.variants) {
                    rows.push({
                        Title: p.name || '', // Keep title for grouping
                        Description: '',
                        Price: '',
                        SalePrice: '',
                        Category: '',
                        Stock: '',
                        Image: '',
                        IsNew: '',
                        IsFeatured: '',
                        CustomShipping: '',
                        VariantName: v.name || '',
                        VariantPrice: v.price || '',
                        VariantStock: v.stock || 0,
                        VariantImage: v.image || '',
                        VariantDescription: v.description || ''
                    })
                }
            }
        }

        const csvString = stringify(rows, { header: true })
        res.header('Content-Type', 'text/csv')
        res.attachment('products.csv')
        return res.send(csvString)
    } catch (err) { apiError(res, err) }
})

const uploadCsv = multer({ storage: multer.memoryStorage() })
app.post('/api/admin/products/import', adminMiddleware, uploadCsv.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

        const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true })

        let currentProduct = null
        for (const row of records) {
            if (row.Title && row.Price) {
                if (currentProduct) await Product.create(currentProduct)

                currentProduct = {
                    name: row.Title,
                    description: row.Description || '',
                    price: parseFloat(row.Price) || 0,
                    salePrice: row.SalePrice ? parseFloat(row.SalePrice) : null,
                    categoryId: row.Category || null,
                    stock: parseInt(row.Stock) || 0,
                    images: row.Image ? [row.Image] : [],
                    isNew: row.IsNew?.toUpperCase() === 'TRUE',
                    isFeatured: row.IsFeatured?.toUpperCase() === 'TRUE',
                    customShipping: row.CustomShipping ? parseFloat(row.CustomShipping) : null,
                    variants: []
                }
            } else if (row.Title && row.VariantName && currentProduct && row.Title === currentProduct.name) {
                currentProduct.variants.push({
                    name: row.VariantName,
                    price: parseFloat(row.VariantPrice) || currentProduct.price,
                    stock: parseInt(row.VariantStock) || 0,
                    image: row.VariantImage || '',
                    description: row.VariantDescription || ''
                })
            }
        }
        if (currentProduct) await Product.create(currentProduct)

        res.json({ success: true, message: `Imported successfully` })
    } catch (err) { apiError(res, err) }
})

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
    try {
        const { showOnHome, showInNav } = req.query
        let query = {}
        if (showOnHome === 'true') query.showOnHome = true
        if (showInNav === 'true') query.showInNav = true

        const cats = await Category.find(query).sort({ order: 1 }).lean()
        const result = await Promise.all(cats.map(async c => ({
            ...c,
            id: c._id,
            image: getImageUrl(c.image),
            productCount: await Product.countDocuments({ categoryId: c._id.toString() })
        })))
        res.json(result)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/categories/:slug', async (req, res) => {
    try {
        const cat = await Category.findOne({ slug: req.params.slug })
        if (!cat) return res.status(404).json({ error: 'Not found' })
        res.json({ ...cat.toObject(), id: cat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/categories', adminMiddleware, async (req, res) => {
    try { const c = await Category.create(req.body); res.status(201).json({ ...c.toObject(), id: c._id }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/categories/:id', adminMiddleware, async (req, res) => {
    try {
        const old = await Category.findById(req.params.id)
        const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (old?.image && req.body.image && old.image !== req.body.image) deleteFromImageKit(old.image)
        res.json({ ...c.toObject(), id: c._id })
    } catch (err) { apiError(res, err) }
})

app.delete('/api/categories/:id', adminMiddleware, async (req, res) => {
    try {
        const cat = await Category.findById(req.params.id)
        await Category.findByIdAndDelete(req.params.id)
        if (cat?.image) deleteFromImageKit(cat.image)
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

// ==================== ORDERS ====================
app.get('/api/orders', adminMiddleware, async (req, res) => {
    try { res.json((await Order.find().sort({ createdAt: -1 }).lean()).map(o => ({ ...o, id: o._id }))) }
    catch (err) { apiError(res, err) }
})

app.post('/api/orders', async (req, res) => {
    try {
        // Generate sequential order ID (ORD-0001, ORD-0002, etc.)
        const lastOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderId')
        let nextNum = 1
        if (lastOrder?.orderId) {
            const match = lastOrder.orderId.match(/ORD-(\d+)/)
            if (match) nextNum = parseInt(match[1]) + 1
        }
        const orderId = `ORD-${String(nextNum).padStart(4, '0')}`

        // Normalize customer email to lowercase for consistent matching with user accounts
        const orderData = { ...req.body, orderId }
        if (orderData.customer?.email) {
            orderData.customer.email = orderData.customer.email.toLowerCase()
        }

        const order = await Order.create(orderData)
        for (const item of req.body.items || []) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -(item.quantity || 1) } })
        if (req.body.promoCode) await PromoCode.findOneAndUpdate({ code: req.body.promoCode.toUpperCase() }, { $inc: { usageCount: 1 } })

        // Send order confirmation email to customer
        const settings = await Settings.findOne()
        try {
            if (settings) await sendOrderConfirmation(settings, order)
        } catch (emailErr) { console.error('Order email error:', emailErr.message) }

        // Send admin notification email for new order
        try {
            if (settings?.emailEnabled && (settings?.adminEmail || settings?.adminNotificationEmail)) {
                await sendAdminOrderNotification(settings, order)
            }
        } catch (emailErr) { if (!IS_PRODUCTION) console.error('Admin order notification error:', emailErr.message) }

        res.status(201).json({ orderId, order: { ...order.toObject(), id: order._id } })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Upload bank transfer receipt (public — customer uploads after placing order)
app.post('/api/orders/:id/bank-receipt', upload.single('receipt'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        if (order.paymentMethod !== 'bank_transfer') return res.status(400).json({ error: 'Only for bank transfer orders' })
        if (!req.file) return res.status(400).json({ error: 'No receipt file provided' })

        const receiptUrl = await uploadToImageKit(req.file.buffer, req.file.originalname, 'decorabake/receipts')
        order.bankReceiptUrl = receiptUrl
        order.paymentStatus = 'pending'
        await order.save()

        // Notify admin that receipt has been uploaded
        const settings = await Settings.findOne()
        try {
            if (settings?.emailEnabled && (settings?.adminEmail || settings?.adminNotificationEmail)) {
                await sendAdminOrderNotification(settings, order)
            }
        } catch (emailErr) {
            if (!IS_PRODUCTION) console.error('Admin order update notification error:', emailErr.message)
        }

        res.json({ success: true, receiptUrl: order.bankReceiptUrl })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/orders/:id', adminMiddleware, async (req, res) => {
    try { const o = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...o.toObject(), id: o._id }) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/admin/orders/:id', adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

app.post('/api/admin/orders/bulk-delete', adminMiddleware, async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No IDs provided' })
        await Order.deleteMany({ _id: { $in: ids } })
        res.json({ success: true, message: `${ids.length} orders deleted` })
    } catch (err) { apiError(res, err) }
})

// ============ STRIPE CHECKOUT SESSION ============
app.post('/api/stripe/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe payments are not configured. Please add STRIPE_SECRET_KEY to your .env file.' })

    try {
        const { items, customer, shipping, subtotal, shippingCost, promoDiscount, promoCode, total } = req.body
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

        // Build line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'aud',
                product_data: {
                    name: item.name,
                    ...(item.image && { images: [item.image.startsWith('http') ? item.image : `${process.env.BACKEND_URL || 'http://localhost:3001'}${item.image}`] })
                },
                unit_amount: Math.round((item.salePrice && item.salePrice < item.price ? item.salePrice : item.price) * 100)
            },
            quantity: item.quantity || 1
        }))

        // Add shipping as a line item if > 0
        if (shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'aud',
                    product_data: { name: 'Shipping' },
                    unit_amount: Math.round(shippingCost * 100)
                },
                quantity: 1
            })
        }

        // Prepare discount coupon if promo applied
        let discounts = []
        if (promoDiscount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: Math.round(promoDiscount * 100),
                currency: 'aud',
                duration: 'once',
                name: promoCode || 'Discount'
            })
            discounts = [{ coupon: coupon.id }]
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            ...(discounts.length > 0 && { discounts }),
            customer_email: customer?.email,
            invoice_creation: { enabled: true },
            success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/checkout`,
            metadata: {
                items: JSON.stringify(items.map(i => ({
                    productId: i.productId || i.id,
                    name: i.name,
                    price: i.salePrice && i.salePrice < i.price ? i.salePrice : i.price,
                    quantity: i.quantity,
                    customShipping: i.customShipping
                }))),
                customer: JSON.stringify(customer),
                shipping: JSON.stringify(shipping),
                subtotal: String(subtotal),
                shippingCost: String(shippingCost),
                promoDiscount: String(promoDiscount || 0),
                promoCode: promoCode || ''
            }
        })

        res.json({ sessionId: session.id, url: session.url })
    } catch (err) {
        console.error('Stripe session error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// Get Stripe session status (for success page)
app.get('/api/stripe/session/:sessionId', async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId)
        // Find the order created by webhook
        const order = await Order.findOne({ stripeSessionId: session.id })
        res.json({
            status: session.payment_status,
            customerEmail: session.customer_email,
            orderId: order?.orderId,
            amountTotal: session.amount_total ? session.amount_total / 100 : order?.total || 0,
            items: order?.items || JSON.parse(session.metadata?.items || '[]'),
            order: order ? { ...order.toObject(), id: order._id } : null
        })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update order status with email notification
// Get Stripe invoice URL for an order
app.get('/api/admin/orders/:orderId/invoice', adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
        if (!order) return res.status(404).json({ error: 'Order not found' })

        // If we already have the invoice URL cached
        if (order.stripeInvoiceUrl) {
            return res.json({ invoiceUrl: order.stripeInvoiceUrl, invoiceId: order.stripeInvoiceId })
        }

        // Try to fetch from Stripe
        if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })

        // If we have the invoice ID, retrieve it
        if (order.stripeInvoiceId) {
            const invoice = await stripe.invoices.retrieve(order.stripeInvoiceId)
            order.stripeInvoiceUrl = invoice.hosted_invoice_url || ''
            await order.save()
            return res.json({ invoiceUrl: invoice.hosted_invoice_url, invoiceId: invoice.id, invoicePdf: invoice.invoice_pdf })
        }

        // If we have the session ID, look up the invoice from the session
        if (order.stripeSessionId) {
            const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
            if (session.invoice) {
                const invoice = await stripe.invoices.retrieve(session.invoice)
                order.stripeInvoiceId = invoice.id
                order.stripeInvoiceUrl = invoice.hosted_invoice_url || ''
                await order.save()
                return res.json({ invoiceUrl: invoice.hosted_invoice_url, invoiceId: invoice.id, invoicePdf: invoice.invoice_pdf })
            }
        }

        return res.status(404).json({ error: 'No Stripe invoice found for this order' })
    } catch (err) { apiError(res, err) }
})

// Full Stripe payment details for an order
app.get('/api/admin/orders/:orderId/stripe-details', adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })
        if (!order.stripeSessionId) return res.status(404).json({ error: 'No Stripe session for this order' })

        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
            expand: ['payment_intent', 'customer']
        })
        const pi = session.payment_intent

        const details = {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            amountTotal: (session.amount_total / 100).toFixed(2),
            currency: session.currency?.toUpperCase(),
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name,
            paymentIntentId: pi?.id || null,
            paymentMethod: pi?.payment_method_types?.[0] || 'card',
            cardBrand: pi?.payment_method?.card?.brand || null,
            cardLast4: pi?.payment_method?.card?.last4 || null,
            receiptUrl: pi?.charges?.data?.[0]?.receipt_url || null,
            created: session.created ? new Date(session.created * 1000).toISOString() : null,
            invoiceUrl: order.stripeInvoiceUrl || null
        }
        res.json(details)
    } catch (err) { apiError(res, err) }
})

// Admin: approve bank transfer receipt
app.put('/api/admin/orders/:id/approve-payment', adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        order.paymentStatus = 'paid'
        if (order.status === 'pending') order.status = 'processing'
        await order.save()
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

// Admin: reject bank transfer receipt
app.put('/api/admin/orders/:id/reject-payment', adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        order.paymentStatus = 'failed'
        await order.save()
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

app.put('/api/orders/:id/status', adminMiddleware, async (req, res) => {
    try {
        const { status, sendEmail, trackingNumber, courier, trackingUrl, deliveryDays } = req.body

        const updateData = { status }
        if (trackingNumber) updateData.trackingNumber = trackingNumber
        if (courier) updateData.courier = courier
        if (trackingUrl) updateData.trackingUrl = trackingUrl
        if (deliveryDays) updateData.deliveryDays = deliveryDays

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
        if (!order) return res.status(404).json({ error: 'Order not found' })

        let emailSent = false
        let emailError = null

        if (sendEmail) {
            try {
                const settings = await Settings.findOne()
                if (settings && settings.emailEnabled) {
                    const { sendOrderStatusEmail } = await import('./emailService.js')
                    emailSent = await sendOrderStatusEmail(settings, order, status, { trackingNumber, courier, trackingUrl, deliveryDays })
                }
            } catch (emailErr) {
                emailError = emailErr.message
                console.error('Status email error:', emailErr.message)
            }
        }

        res.json({
            ...order.toObject(),
            id: order._id,
            emailSent,
            emailError
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ==================== CUSTOMERS ====================
app.get('/api/customers', adminMiddleware, async (req, res) => {
    try {
        const customers = await Order.aggregate([
            { $match: { 'customer.email': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: { $toLower: '$customer.email' },
                    name: { $first: { $ifNull: ['$customer.name', { $concat: [{ $ifNull: ['$customer.firstName', ''] }, ' ', { $ifNull: ['$customer.lastName', ''] }] }] } },
                    orders: { $push: '$orderId' },
                    totalSpent: { $sum: { $ifNull: ['$total', 0] } },
                    createdAt: { $min: '$createdAt' }
                }
            },
            { $project: { _id: 0, id: '$_id', email: '$_id', name: 1, orders: 1, totalSpent: 1, createdAt: 1 } },
            { $sort: { createdAt: -1 } }
        ])
        res.json(customers)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== REFUND REQUESTS ====================
// Get all refunds (admin)
app.get('/api/refunds', adminMiddleware, async (req, res) => {
    try {
        const refunds = await Refund.find().sort({ createdAt: -1 }).lean()
        res.json(refunds.map(r => ({ ...r, id: r._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get refunds for a customer (by email)
app.get('/api/refunds/customer/:email', async (req, res) => {
    try {
        const refunds = await Refund.find({ 'customer.email': req.params.email.toLowerCase() }).sort({ createdAt: -1 }).lean()
        res.json(refunds.map(r => ({ ...r, id: r._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create refund request (customer)
app.post('/api/refunds', async (req, res) => {
    try {
        const { orderId, reason } = req.body
        const order = await Order.findById(orderId)
        if (!order) return res.status(404).json({ error: 'Order not found' })

        // Check if refund already exists
        const existing = await Refund.findOne({ order: orderId })
        if (existing) return res.status(400).json({ error: 'Refund request already exists for this order' })

        const refundId = `REF-${Date.now()}`
        const refund = await Refund.create({
            refundId,
            order: orderId,
            orderId: order.orderId,
            customer: {
                email: order.customer.email,
                firstName: order.customer.firstName,
                lastName: order.customer.lastName,
                phone: order.customer.phone
            },
            amount: order.total,
            reason,
            status: 'pending',
            messages: [{
                from: 'customer',
                message: reason,
                images: req.body.images || [],
                date: new Date()
            }]
        })

        // Send admin notification for new refund request
        try {
            const settings = await Settings.findOne()
            if (settings?.emailEnabled && (settings?.adminEmail || settings?.adminNotificationEmail)) {
                await sendAdminRefundNotification(settings, refund)
            }
        } catch (emailErr) { console.error('Admin refund notification error:', emailErr.message) }

        res.status(201).json({ ...refund.toObject(), id: refund._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update refund status (admin)
app.put('/api/refunds/:id', adminMiddleware, async (req, res) => {
    try {
        const { status, adminNotes, sendEmail } = req.body
        const updateData = { status }
        if (adminNotes) updateData.adminNotes = adminNotes
        if (status === 'completed') updateData.processedAt = new Date()

        const refund = await Refund.findByIdAndUpdate(req.params.id, updateData, { new: true })

        // Send email notification if requested
        if (sendEmail && refund) {
            try {
                const settings = await Settings.findOne()
                if (settings && settings.emailEnabled) {
                    await sendRefundStatusEmail(settings, refund, status)
                }
            } catch (emailErr) {
                console.error('Refund email error:', emailErr.message)
            }
        }

        res.json({ ...refund.toObject(), id: refund._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add message to refund
app.post('/api/refunds/:id/message', async (req, res) => {
    try {
        const { message, from, sendEmail, images } = req.body
        const refund = await Refund.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: { from, message, images: images || [], date: new Date() } } },
            { new: true }
        )

        // Send email notification if from admin
        if (sendEmail && from === 'admin' && refund) {
            try {
                const settings = await Settings.findOne()
                if (settings && settings.emailEnabled) {
                    await sendRefundMessageEmail(settings, refund, message)
                }
            } catch (emailErr) {
                console.error('Refund message email error:', emailErr.message)
            }
        }

        res.json({ ...refund.toObject(), id: refund._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== CUSTOMER ORDER ACTIONS ====================
// Cancel order (customer - only if pending or processing)
app.put('/api/orders/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        if (order.user && order.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' })

        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ error: 'Order cannot be cancelled at this stage' })
        }

        order.status = 'cancelled'
        await order.save()

        // Send cancellation email
        try {
            const settings = await Settings.findOne()
            if (settings && settings.emailEnabled) {
                const { sendOrderStatusEmail } = await import('./emailService.js')
                await sendOrderStatusEmail(settings, order, 'cancelled', {})
            }
        } catch (emailErr) {
            console.error('Cancellation email error:', emailErr.message)
        }

        res.json({ ...order.toObject(), id: order._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update order shipping address (customer - only if pending or processing)
app.put('/api/orders/:id/shipping', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ error: 'Order not found' })
        if (order.user && order.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' })

        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ error: 'Shipping address cannot be changed at this stage' })
        }

        const { address, city, state, postcode } = req.body
        order.shipping = { address, city, state, postcode }
        await order.save()

        res.json({ ...order.toObject(), id: order._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== SUPPORT CHAT ====================
// Get all chats (admin)
app.get('/api/support-chats', async (req, res) => {
    try {
        const chats = await SupportChat.find().sort({ lastMessage: -1 }).lean()
        res.json(chats.map(c => ({ ...c, id: c._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get chats for a customer
app.get('/api/support-chats/customer/:email', async (req, res) => {
    try {
        const chats = await SupportChat.find({ 'customer.email': req.params.email.toLowerCase() }).sort({ lastMessage: -1 }).lean()
        res.json(chats.map(c => ({ ...c, id: c._id })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get single chat
app.get('/api/support-chats/:id', async (req, res) => {
    try {
        const chat = await SupportChat.findById(req.params.id)
        if (!chat) return res.status(404).json({ error: 'Chat not found' })
        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create new chat (customer)
app.post('/api/support-chats', async (req, res) => {
    try {
        const { customer, subject, message } = req.body
        const chatId = `CHAT-${Date.now()}`

        const chat = await SupportChat.create({
            chatId,
            customer: {
                id: customer.id,
                email: customer.email.toLowerCase(),
                firstName: customer.firstName,
                lastName: customer.lastName
            },
            subject: subject || 'Support Request',
            status: 'open',
            unreadAdmin: 1,
            messages: message ? [{
                from: 'customer',
                message,
                messageType: 'text',
                date: new Date()
            }] : [],
            lastMessage: new Date()
        })

        res.status(201).json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Send message to chat
app.post('/api/support-chats/:id/message', async (req, res) => {
    try {
        const { from, message, messageType, attachment } = req.body

        const newMessage = {
            from,
            message,
            messageType: messageType || 'text',
            attachment: attachment || undefined,
            date: new Date(),
            read: false
        }

        const updateData = {
            $push: { messages: newMessage },
            lastMessage: new Date(),
            status: 'active'
        }

        // Update unread counter
        if (from === 'customer') {
            updateData.$inc = { unreadAdmin: 1 }
            updateData.unreadCustomer = 0
        } else {
            updateData.$inc = { unreadCustomer: 1 }
            updateData.unreadAdmin = 0
        }

        const chat = await SupportChat.findByIdAndUpdate(req.params.id, updateData, { new: true })
        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update chat status (admin)
app.put('/api/support-chats/:id', async (req, res) => {
    try {
        const chat = await SupportChat.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Mark messages as read
app.put('/api/support-chats/:id/read', async (req, res) => {
    try {
        const { readBy } = req.body // 'customer' or 'admin'

        const updateData = readBy === 'customer' ? { unreadCustomer: 0 } : { unreadAdmin: 0 }

        // Also mark individual messages as read
        const chat = await SupportChat.findById(req.params.id)
        if (chat) {
            chat.messages.forEach(msg => {
                if (msg.from !== readBy) msg.read = true
            })
            Object.assign(chat, updateData)
            await chat.save()
        }

        res.json({ ...chat.toObject(), id: chat._id })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get unread count for customer
app.get('/api/support-chats/unread/:email', async (req, res) => {
    try {
        const chats = await SupportChat.find({ 'customer.email': req.params.email.toLowerCase() })
        const unreadCount = chats.reduce((sum, c) => sum + (c.unreadCustomer || 0), 0)
        res.json({ unreadCount })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get total unread for admin
app.get('/api/support-chats/admin/unread', async (req, res) => {
    try {
        const chats = await SupportChat.find()
        const unreadCount = chats.reduce((sum, c) => sum + (c.unreadAdmin || 0), 0)
        const openChats = chats.filter(c => c.status === 'open' || c.status === 'active').length
        res.json({ unreadCount, openChats })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== PROMO CODES ====================
app.get('/api/promo-codes', adminMiddleware, async (req, res) => {
    try {
        const codes = await PromoCode.find().sort({ createdAt: -1 }).lean();
        res.json(codes.map(c => ({ ...c, id: c._id.toString(), _id: c._id.toString() })))
    }
    catch (err) { apiError(res, err) }
})

app.post('/api/promo-codes', adminMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, code: req.body.code.toUpperCase() };
        if (data.expiryDate === '') data.expiryDate = null;
        const c = await PromoCode.create(data);
        res.status(201).json({ ...c.toObject(), id: c._id })
    }
    catch (err) { apiError(res, err) }
})

app.put('/api/promo-codes/:id', adminMiddleware, async (req, res) => {
    try {
        console.log("Promo PUT Request ID:", req.params.id)
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;
        if (updateData.expiryDate === '') updateData.expiryDate = null;
        const c = await PromoCode.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!c) return res.status(404).json({ error: "Promo code not found" });
        res.json({ ...c.toObject(), id: c._id })
    }
    catch (err) {
        console.error("Promo update error:", err);
        res.status(500).json({ error: err.message });
    }
})

app.delete('/api/promo-codes/:id', adminMiddleware, async (req, res) => {
    try {
        console.log("Promo DELETE Request ID:", req.params.id)
        const c = await PromoCode.findByIdAndDelete(req.params.id);
        if (!c) return res.status(404).json({ error: "Promo code not found" });
        res.json({ success: true })
    }
    catch (err) {
        console.error("Promo delete error:", err);
        res.status(500).json({ error: err.message });
    }
})

app.post('/api/promo-codes/validate', async (req, res) => {
    try {
        const { code, orderTotal } = req.body
        const p = await PromoCode.findOne({ code: code.toUpperCase() })
        if (!p) return res.status(400).json({ valid: false, error: 'Invalid code' })
        if (!p.active) return res.status(400).json({ valid: false, error: 'Not active' })
        if (p.expiryDate && new Date(p.expiryDate) < new Date()) return res.status(400).json({ valid: false, error: 'Expired' })
        if (p.usageLimit > 0 && p.usageCount >= p.usageLimit) return res.status(400).json({ valid: false, error: 'Limit reached' })
        if (p.minOrder && orderTotal < p.minOrder) return res.status(400).json({ valid: false, error: `Min order $${p.minOrder}` })
        res.json({ valid: true, promo: { ...p.toObject(), id: p._id } })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== TESTIMONIALS ====================
app.get('/api/testimonials', async (req, res) => {
    try { res.json((await Testimonial.find({ enabled: { $ne: false } }).sort({ createdAt: -1 }).lean()).map(t => ({ ...t, id: t._id }))) }
    catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/testimonials', adminMiddleware, async (req, res) => {
    try { const t = await Testimonial.create(req.body); res.status(201).json({ ...t.toObject(), id: t._id }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/testimonials/:id', adminMiddleware, async (req, res) => {
    try { const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ ...t.toObject(), id: t._id }) }
    catch (err) { apiError(res, err) }
})

app.delete('/api/testimonials/:id', adminMiddleware, async (req, res) => {
    try { await Testimonial.findByIdAndDelete(req.params.id); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== SLIDER ====================
app.get('/api/slider', async (req, res) => {
    try {
        const slides = await Slider.find().sort({ order: 1 }).lean()
        res.json(slides.map(s => ({ ...s, id: s._id, image: getImageUrl(s.image) })))
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/slider', adminMiddleware, async (req, res) => {
    try { const s = await Slider.create(req.body); res.status(201).json({ ...s.toObject(), id: s._id, image: getImageUrl(s.image) }) }
    catch (err) { apiError(res, err) }
})

app.put('/api/slider/:id', adminMiddleware, async (req, res) => {
    try {
        const old = await Slider.findById(req.params.id)
        const s = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (old?.image && req.body.image && old.image !== req.body.image) deleteFromImageKit(old.image)
        res.json({ ...s.toObject(), id: s._id, image: getImageUrl(s.image) })
    } catch (err) { apiError(res, err) }
})

app.delete('/api/slider/:id', adminMiddleware, async (req, res) => {
    try {
        const slider = await Slider.findById(req.params.id)
        await Slider.findByIdAndDelete(req.params.id)
        if (slider?.image) deleteFromImageKit(slider.image)
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

// ==================== SETTINGS ====================
app.get('/api/settings', async (req, res) => {
    try {
        let s = await Settings.findOne()
        if (!s) s = await Settings.create({})
        const settingsObj = s.toObject()
        // Remove sensitive fields from public response
        const { adminPassword, geminiApiKey, longcatApiKey, qwenApiKey, openRouterApiKey, smtpPassword, smtpUser, smtpHost, smtpPort, smtpSecure, emailFrom, adminEmail, adminNotificationEmail, backupEmail, imagekitPrivateKey, ...pub } = settingsObj
        res.json(pub)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/admin/settings', adminMiddleware, async (req, res) => {
    try {
        let s = await Settings.findOne()
        if (!s) s = await Settings.create({})
        res.json(s)
    } catch (err) { apiError(res, err) }
})

app.put('/api/settings', adminMiddleware, async (req, res) => {
    try {
        let s = await Settings.findOne()
        if (!s) { s = await Settings.create(req.body); return res.json({ success: true }) }
        // Delete old logo/favicon from ImageKit if replaced
        if (req.body.siteLogo && s.siteLogo && req.body.siteLogo !== s.siteLogo) deleteFromImageKit(s.siteLogo)
        if (req.body.footerLogo && s.footerLogo && req.body.footerLogo !== s.footerLogo) deleteFromImageKit(s.footerLogo)
        Object.assign(s, req.body)
        await s.save()
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})


// ==================== SECTIONS ====================
app.get('/api/sections/:key', async (req, res) => {
    try { const s = await Section.findOne({ key: req.params.key }); res.json(s?.data || []) }
    catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/sections/:key', adminMiddleware, async (req, res) => {
    try { await Section.findOneAndUpdate({ key: req.params.key }, { key: req.params.key, data: req.body }, { upsert: true }); res.json({ success: true }) }
    catch (err) { apiError(res, err) }
})

// ==================== REPORTS ====================
app.get('/api/reports/sales', adminMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        let query = {}
        if (startDate || endDate) {
            query.createdAt = {}
            if (startDate) query.createdAt.$gte = new Date(startDate)
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z')
        }

        const [allOrders, paidOrders, topProducts] = await Promise.all([
            Order.find(query).sort({ createdAt: -1 }).limit(500).lean(),
            Order.find({ ...query, paymentStatus: 'paid' }).lean(),
            Order.aggregate([
                { $match: { ...query, paymentStatus: 'paid' } },
                { $unwind: '$items' },
                { $group: { _id: '$items.name', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, units: { $sum: '$items.quantity' } } },
                { $sort: { revenue: -1 } }, { $limit: 10 }
            ])
        ])

        const totalSales = paidOrders.reduce((s, o) => s + (o.total || 0), 0)
        const totalOrders = allOrders.length
        const paidCount = paidOrders.length
        const averageOrder = paidCount > 0 ? totalSales / paidCount : 0

        const dailySales = {}
        paidOrders.forEach(o => {
            const date = new Date(o.createdAt).toISOString().split('T')[0]
            if (!dailySales[date]) dailySales[date] = { date, sales: 0, orders: 0 }
            dailySales[date].sales += o.total || 0
            dailySales[date].orders += 1
        })

        const statusBreakdown = allOrders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1
            return acc
        }, {})

        res.json({
            totalSales, totalOrders, paidCount, averageOrder,
            orders: allOrders.map(o => ({ ...o, id: o._id })),
            dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
            topProducts,
            statusBreakdown
        })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== ADMIN AUTH ====================
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const s = await Settings.findOne()

        // Check Master Admin (from settings)
        if (username === (s?.adminUsername || 'Decoraadmin') && password === (s?.adminPassword || 'Abcd1234@')) {
            return res.json({ admin: { username, role: 'admin', isMaster: true }, token: jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET || 'default-secret-change-this', { expiresIn: '7d' }) })
        }

        // Check Secondary Admins (from users collection)
        const user = await User.findOne({ email: username.toLowerCase(), role: 'admin' })
        if (user && await user.comparePassword(password)) {
            return res.json({ admin: { username, role: 'admin', id: user._id }, token: jwt.sign({ id: user._id, username, role: 'admin' }, process.env.JWT_SECRET || 'default-secret-change-this', { expiresIn: '7d' }) })
        }

        res.status(401).json({ message: 'Invalid credentials' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Manage Additional Admins
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password').lean()
        res.json(admins)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            existing.role = 'admin'
            if (password) existing.password = password
            await existing.save()
            return res.json({ success: true, user: existing })
        }

        const newUser = await User.create({
            email, password, firstName: firstName || 'Admin', lastName: lastName || 'User', role: 'admin'
        })
        res.json({ success: true, user: newUser })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== IMAGEKIT ADMIN ====================
app.post('/api/admin/imagekit/test', adminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.findOne()
        const ik = getImageKitInstance(settings)
        if (!ik) return res.status(400).json({ success: false, error: 'ImageKit not configured. Add your keys in Settings first.' })
        await ik.listFiles({ limit: 1 })
        res.json({ success: true, message: 'ImageKit connected successfully!' })
    } catch (err) {
        res.status(400).json({ success: false, error: err.message })
    }
})

app.post('/api/admin/imagekit/migrate', adminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.findOne()
        const ik = getImageKitInstance(settings)
        if (!ik) return res.status(400).json({ error: 'ImageKit not configured.' })

        const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`
        const stats = { migrated: 0, skipped: 0, failed: 0 }

        const migrateUrl = async (url) => {
            if (!url) return url
            if (url.startsWith('https://ik.imagekit.io')) return url // already ImageKit

            let filePath = null
            if (url.startsWith('/uploads/')) filePath = join(__dirname, url)
            else if (url.startsWith(backendUrl + '/uploads/')) filePath = join(__dirname, url.replace(backendUrl, ''))
            else { stats.skipped++; return url }

            if (!fs.existsSync(filePath)) { stats.skipped++; return url }

            const buffer = fs.readFileSync(filePath)
            const ext = extname(filePath).toLowerCase()
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`
            const result = await ik.upload({ file: buffer, fileName, folder: 'decorabake' })
            stats.migrated++
            return result.url
        }

        // Products
        for (const product of await Product.find({})) {
            if (!product.images?.length) continue
            let changed = false
            const newImages = []
            for (const img of product.images) {
                const newImg = await migrateUrl(img).catch(() => { stats.failed++; return img })
                newImages.push(newImg)
                if (newImg !== img) changed = true
            }
            if (changed) { product.images = newImages; await product.save() }
        }

        // Categories
        for (const cat of await Category.find({})) {
            if (!cat.image) continue
            const newImg = await migrateUrl(cat.image).catch(() => { stats.failed++; return cat.image })
            if (newImg !== cat.image) { cat.image = newImg; await cat.save() }
        }

        // Sliders
        for (const slider of await Slider.find({})) {
            if (!slider.image) continue
            const newImg = await migrateUrl(slider.image).catch(() => { stats.failed++; return slider.image })
            if (newImg !== slider.image) { slider.image = newImg; await slider.save() }
        }

        // Settings logo/favicon
        if (settings) {
            let changed = false
            if (settings.siteLogo) { const n = await migrateUrl(settings.siteLogo).catch(() => settings.siteLogo); if (n !== settings.siteLogo) { settings.siteLogo = n; changed = true } }
            if (settings.footerLogo) { const n = await migrateUrl(settings.footerLogo).catch(() => settings.footerLogo); if (n !== settings.footerLogo) { settings.footerLogo = n; changed = true } }
            if (changed) await settings.save()
        }

        res.json({ success: true, ...stats })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ==================== FILE UPLOAD ====================
app.post('/api/upload', adminMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    try {
        const url = await uploadToImageKit(req.file.buffer, req.file.originalname)
        res.json({ url })
    } catch (err) { res.status(500).json({ error: 'Upload failed: ' + err.message }) }
})

app.post('/api/upload/multiple', adminMiddleware, upload.array('files', 10), async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'No files' })
    try {
        const urls = await Promise.all(req.files.map(f => uploadToImageKit(f.buffer, f.originalname)))
        res.json({ urls })
    } catch (err) { res.status(500).json({ error: 'Upload failed: ' + err.message }) }
})

app.post('/api/upload/customer-multiple', authMiddleware, upload.array('files', 5), async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'No files' })
    try {
        const urls = await Promise.all(req.files.map(f => uploadToImageKit(f.buffer, f.originalname)))
        res.json({ urls })
    } catch (err) { res.status(500).json({ error: 'Upload failed: ' + err.message }) }
})

// ==================== REVIEWS ====================
// Get reviews for a product
app.get('/api/products/:productId/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId, isApproved: true })
            .sort({ createdAt: -1 })
        const avg = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
        res.json({ reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add a review (user)
app.post('/api/products/:productId/reviews', authMiddleware, async (req, res) => {
    try {
        const { rating, title, review } = req.body
        const user = await User.findById(req.user.id)

        // Check if user has purchased and received this product
        const completedOrder = await Order.findOne({
            'customer.email': user.email,
            'items.productId': req.params.productId,
            status: { $in: ['completed', 'delivered'] }
        })

        const newReview = await Review.create({
            productId: req.params.productId,
            userId: req.user.id,
            orderId: completedOrder?._id,
            rating,
            title,
            review,
            reviewerName: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.firstName || user.lastName || user.email?.split('@')[0] || 'Happy Customer'),
            isVerifiedPurchase: !!completedOrder,
            isAdminReview: false
        })

        res.json(newReview)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Add admin review
app.post('/api/admin/products/:productId/reviews', adminMiddleware, async (req, res) => {
    try {
        const { rating, title, review, reviewerName } = req.body
        const newReview = await Review.create({
            productId: req.params.productId,
            rating,
            title,
            review,
            reviewerName: reviewerName || 'Happy Customer',
            isVerifiedPurchase: true,
            isAdminReview: true
        })
        res.json(newReview)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update review
app.put('/api/reviews/:id', adminMiddleware, async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json(review)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Delete review
app.delete('/api/reviews/:id', adminMiddleware, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get all reviews for admin
app.get('/api/admin/reviews', adminMiddleware, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('productId', 'name')
            .sort({ createdAt: -1 })
        res.json(reviews)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Helper to call Gemini API
async function callGemini(apiKey, prompt) {
    try {
        // Using gemini-2.5-flash as specified by user
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            })
        })
        const data = await response.json()
        if (!IS_PRODUCTION) console.log('Gemini response:', JSON.stringify(data).substring(0, 300))
        if (data?.error) {
            console.error('Gemini API error:', data.error.message)
            throw new Error(data.error.message || 'Gemini API error')
        }
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text
        }
        throw new Error('No response from Gemini')
    } catch (err) {
        console.error('callGemini error:', err.message)
        throw err
    }
}

// Helper to call LongCat 2.0 Preview API
async function callLongcat(apiKey, prompt) {
    try {
        const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'LongCat-2.0-Preview',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            })
        })
        const data = await response.json()
        if (!IS_PRODUCTION) console.log('LongCat response:', JSON.stringify(data).substring(0, 300))
        if (data?.error) throw new Error(data.error.message || 'LongCat API error')
        if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content
        throw new Error('No response from LongCat')
    } catch (err) {
        console.error('callLongcat error:', err.message)
        throw err
    }
}

// Helper to call Qwen (Alibaba Cloud MaaS - OpenAI compatible)
async function callQwen(apiKey, prompt) {
    try {
        const response = await fetch('https://ws-h7cc6n8hbkqf5i0x.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            })
        })
        const data = await response.json()
        if (!IS_PRODUCTION) console.log('Qwen response:', JSON.stringify(data).substring(0, 300))
        if (data?.error) throw new Error(data.error.message || 'Qwen API error')
        if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content
        throw new Error('No response from Qwen')
    } catch (err) {
        console.error('callQwen error:', err.message)
        throw err
    }
}

// Helper to call OpenRouter (free reliable models)
async function callOpenRouter(apiKey, prompt) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://decorabake.com.au',
                'X-Title': 'DecoraBake'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b:free',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            })
        })
        const data = await response.json()
        if (!IS_PRODUCTION) console.log('OpenRouter response:', JSON.stringify(data).substring(0, 300))
        if (data?.error) throw new Error(data.error.message || 'OpenRouter API error')
        if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content
        throw new Error('No response from OpenRouter')
    } catch (err) {
        console.error('callOpenRouter error:', err.message)
        throw err
    }
}

// Test individual chatbot API
app.post('/api/chatbot/test', async (req, res) => {
    const { apiType } = req.body
    const settings = await Settings.findOne()
    const TEST_PROMPT = 'Say "API test successful" in one line.'

    const providers = {
        gemini:      { key: settings?.geminiApiKey || process.env.GEMINI_API_KEY,           fn: callGemini,      label: 'Gemini' },
        qwen:        { key: settings?.qwenApiKey || process.env.QWEN_API_KEY,               fn: callQwen,        label: 'Qwen' },
        openrouter:  { key: settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY,   fn: callOpenRouter,  label: 'OpenRouter' },
        longcat:     { key: settings?.longcatApiKey || process.env.LONGCAT_API_KEY,         fn: callLongcat,     label: 'LongCat 2.0' },
    }

    try {
        const provider = providers[apiType]
        if (!provider) return res.json({ success: false, error: 'Invalid API type' })
        if (!provider.key) return res.json({ success: false, error: `${provider.label} API key not configured` })
        await provider.fn(provider.key, TEST_PROMPT)
        return res.json({ success: true, message: `${provider.label} API is working!` })
    } catch (err) {
        res.json({ success: false, error: err.message })
    }
})

// Test all chatbot APIs at once — returns status for each provider
app.post('/api/chatbot/test-all', adminMiddleware, async (req, res) => {
    const settings = await Settings.findOne()
    const TEST_PROMPT = 'Say "ok" in one word.'

    const providers = [
        { key: 'gemini',     apiKey: settings?.geminiApiKey || process.env.GEMINI_API_KEY,          fn: callGemini },
        { key: 'qwen',       apiKey: settings?.qwenApiKey || process.env.QWEN_API_KEY,              fn: callQwen },
        { key: 'openrouter', apiKey: settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY,  fn: callOpenRouter },
        { key: 'longcat',    apiKey: settings?.longcatApiKey || process.env.LONGCAT_API_KEY,        fn: callLongcat },
    ]

    const results = {}
    await Promise.all(providers.map(async (p) => {
        if (!p.apiKey) { results[p.key] = { success: false, error: 'Not configured' }; return }
        try {
            await p.fn(p.apiKey, TEST_PROMPT)
            results[p.key] = { success: true }
        } catch (e) {
            results[p.key] = { success: false, error: e.message }
        }
    }))

    res.json(results)
})

// Test email connection
app.post('/api/email/test', async (req, res) => {
    try {
        const settings = await Settings.findOne()
        if (!settings) return res.json({ success: false, error: 'Settings not found' })

        const result = await testEmailConnection(settings)
        res.json(result)
    } catch (err) {
        res.json({ success: false, error: err.message })
    }
})

app.post('/api/chatbot', async (req, res) => {
    try {
        const { message } = req.body
        const settings = await Settings.findOne()

        // Only disable if explicitly set to false (default is enabled)
        if (settings?.chatbotEnabled === false) {
            return res.json({ response: "Sorry, the chat assistant is currently unavailable. Please contact us directly." })
        }

        const geminiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY
        const qwenKey = settings?.qwenApiKey || process.env.QWEN_API_KEY
        const openRouterKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY
        const longcatKey = settings?.longcatApiKey || process.env.LONGCAT_API_KEY

        if (!geminiKey && !qwenKey && !openRouterKey && !longcatKey) {
            return res.json({ response: "Chat is not configured. Please contact customer support." })
        }

        // Fetch store info for context
        const categories = await Category.find().limit(5)
        const products = await Product.find({ enabled: true }).limit(10).select('name price category')

        const storeContext = `
You are DecoraBake's friendly AI assistant 🎂 - Australia's premier cake decorating supplies store.

=== STORE INFO ===
📧 Email: ${settings.contactEmail}
📞 Phone: ${settings.contactPhone}
📍 Location: ${settings.address || 'Sydney, Australia'}
🚚 Free Shipping: ${settings.freeShippingEnabled ? `Orders over $${settings.freeShippingThreshold}` : 'Not available'}
📦 Standard Shipping: $${settings.shippingCost}

=== PRODUCTS & CATEGORIES ===
Categories: ${categories.map(c => c.name).join(', ')}
Popular Items: ${products.map(p => `${p.name} ($${p.price})`).join(', ')}

=== YOUR RESPONSE STYLE ===
1. Be warm, friendly and enthusiastic about baking! Use emojis sparingly 🎂
2. Keep responses SHORT (2-4 sentences max) but helpful
3. Use plain text only - NO markdown (**bold**, *italic*, bullets, etc.)
4. Match the customer's language (Urdu, Arabic, etc.)
5. Always offer to help further

=== RESPONSE TEMPLATES ===

For product questions:
"Great choice! [Product/category] is perfect for [use case]. You can find it in our [Category] section. Need help finding anything specific?"

For shipping questions:
"We offer free shipping on orders over $${settings.freeShippingThreshold}! Standard shipping is just $${settings.shippingCost}. Most orders arrive within 3-5 business days."

For order/account issues:
"I'd be happy to help! For order inquiries, please email us at ${settings.contactEmail} or call ${settings.contactPhone}. We typically respond within 24 hours."

For general help:
"Welcome to DecoraBake! 🎂 I can help you find cake decorating supplies, answer shipping questions, or point you to the right products. What would you like to know?"

=== CUSTOMER MESSAGE ===
${message}`

        let botResponse = null
        let activeProvider = null

        // Auto-fallback: Gemini → Qwen → OpenRouter → LongCat
        const providerChain = [
            { name: 'gemini',     key: geminiKey,      fn: callGemini },
            { name: 'qwen',       key: qwenKey,        fn: callQwen },
            { name: 'openrouter', key: openRouterKey,  fn: callOpenRouter },
            { name: 'longcat',    key: longcatKey,     fn: callLongcat },
        ]

        for (const provider of providerChain) {
            if (!provider.key) continue
            try {
                botResponse = await provider.fn(provider.key, storeContext)
                activeProvider = provider.name
                break
            } catch (e) {
                console.log(`${provider.name} failed, trying next provider... (${e.message})`)
            }
        }

        if (!botResponse) {
            return res.json({ response: "I'm having trouble connecting right now. Please try again or contact us directly." })
        }

        // Clean up any markdown formatting
        botResponse = botResponse
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/`/g, '')
            .replace(/#{1,6}\s/g, '')
            .trim()

        res.json({ response: botResponse, provider: activeProvider })
    } catch (err) {
        console.error('Chatbot error:', err)
        res.json({ response: "Sorry, I'm having trouble right now. Please try again or contact us directly." })
    }
})

// ==================== SYSTEM DIAGNOSTICS ====================
app.get('/api/diagnostics', adminMiddleware, async (req, res) => {
    try {
        const results = {
            database: { status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' },
            collections: {}
        }

        // Count documents in main collections
        results.collections.users = await User.countDocuments()
        results.collections.products = await Product.countDocuments()
        results.collections.categories = await Category.countDocuments()
        results.collections.orders = await Order.countDocuments()
        results.collections.carts = await Cart.countDocuments()

        // Check settings
        const settings = await Settings.findOne()
        results.settings = {
            exists: !!settings,
            chatbotEnabled: settings?.chatbotEnabled,
            geminiConfigured: !!(settings?.geminiApiKey || process.env.GEMINI_API_KEY),
            qwenConfigured: !!(settings?.qwenApiKey || process.env.QWEN_API_KEY),
            openRouterConfigured: !!(settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY),
            longcatConfigured: !!(settings?.longcatApiKey || process.env.LONGCAT_API_KEY),
            whatsappEnabled: settings?.whatsappEnabled
        }

        res.json({ success: true, ...results })
    } catch (err) {
        res.json({ success: false, error: err.message })
    }
})

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 }))

// ==================== PAGES CMS ====================
// Get all pages (admin)
app.get('/api/admin/pages', adminMiddleware, async (req, res) => {
    try {
        const pages = await Page.find().sort({ createdAt: -1 }).lean()
        res.json(pages)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get all blog posts
app.get('/api/blog', async (req, res) => {
    try {
        const posts = await Page.find({ type: 'blog', isPublished: true }).sort({ createdAt: -1 }).lean()
        res.json(posts)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get single page by slug
app.get('/api/pages/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug, isPublished: true }).lean()
        if (!page) return res.status(404).json({ error: 'Page not found' })
        res.json(page)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Create page (admin)
app.post('/api/admin/pages', adminMiddleware, async (req, res) => {
    try {
        const page = new Page(req.body)
        await page.save()
        res.json(page)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update page (admin)
app.put('/api/admin/pages/:id', adminMiddleware, async (req, res) => {
    try {
        const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.json(page)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// Delete page (admin)
app.delete('/api/admin/pages/:id', adminMiddleware, async (req, res) => {
    try {
        await Page.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})


// ============ PRODUCT SEARCH ============
app.get('/api/search', async (req, res) => {
    try {
        const q = req.query.q?.trim()
        if (!q || q.length < 2) return res.json([])

        const products = await Product.find({
            enabled: { $ne: false },
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ]
        })
            .select('name price salePrice image images category slug _id')
            .limit(20)
            .lean()

        res.json(products)
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ============ NEWSLETTER SUBSCRIBE (Public) ============
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email is required' })
        const cleanEmail = email.toLowerCase().trim()

        // Also add/update subscriber
        await Subscriber.findOneAndUpdate(
            { email: cleanEmail },
            { email: cleanEmail, source: 'newsletter', isActive: true },
            { upsert: true, new: true }
        )

        // Update user if exists
        let user = await User.findOne({ email: cleanEmail })
        if (user) { user.newsletter = true; await user.save() }

        res.json({ success: true, message: 'Subscribed successfully' })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ============ CONTACT FORM ============
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body
        if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required' })
        // Create support chat from contact form
        const chatId = `CONTACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        const chat = new SupportChat({
            chatId,
            customer: { firstName: name, email, phone: phone || '' },
            subject: subject || 'Contact Form',
            messages: [{ from: 'customer', message }]
        })
        await chat.save()

        // Send confirmation email to customer + admin notification
        try {
            const settings = await Settings.findOne()
            if (settings?.emailEnabled) {
                await sendContactFormEmail(settings, { name, email, subject, message })
                await sendAdminContactNotification(settings, { name, email, phone, subject, message })
            }
        } catch (emailErr) { console.error('Contact form email error:', emailErr.message) }

        res.json({ success: true })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// ============ ADMIN: SUBSCRIBER MANAGEMENT ============
app.get('/api/admin/subscribers', adminMiddleware, async (req, res) => {
    try {
        const { filter, search, page = 1, limit = 50 } = req.query
        const query = { isActive: true }
        if (filter && filter !== 'all') query.source = filter
        if (search) query.email = { $regex: search, $options: 'i' }
        const total = await Subscriber.countDocuments(query)
        const subscribers = await Subscriber.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
        res.json({ subscribers, total, page: parseInt(page), pages: Math.ceil(total / limit) })
    } catch (err) { apiError(res, err) }
})

app.get('/api/admin/subscribers/stats', adminMiddleware, async (req, res) => {
    try {
        const all = await Subscriber.countDocuments({ isActive: true })
        const newsletter = await Subscriber.countDocuments({ isActive: true, source: 'newsletter' })
        const register = await Subscriber.countDocuments({ isActive: true, source: 'register' })
        const purchase = await Subscriber.countDocuments({ isActive: true, source: 'purchase' })
        const imported = await Subscriber.countDocuments({ isActive: true, source: 'import' })
        res.json({ all, newsletter, register, purchase, import: imported })
    } catch (err) { apiError(res, err) }
})

app.delete('/api/admin/subscribers/:id', adminMiddleware, async (req, res) => {
    try {
        await Subscriber.findByIdAndUpdate(req.params.id, { isActive: false })
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

// CSV Import
app.post('/api/admin/subscribers/import', adminMiddleware, async (req, res) => {
    try {
        const { subscribers: rows } = req.body
        if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'No data provided' })
        let imported = 0, skipped = 0
        for (const row of rows) {
            const email = (row.email || '').toLowerCase().trim()
            if (!email || !email.includes('@')) { skipped++; continue }
            try {
                await Subscriber.findOneAndUpdate(
                    { email },
                    { email, firstName: row.firstName || row.first_name || '', lastName: row.lastName || row.last_name || '', source: 'import', isActive: true },
                    { upsert: true }
                )
                imported++
            } catch { skipped++ }
        }
        res.json({ success: true, imported, skipped })
    } catch (err) { apiError(res, err) }
})

// CSV Export
app.get('/api/admin/subscribers/export', adminMiddleware, async (req, res) => {
    try {
        const { filter } = req.query
        const query = { isActive: true }
        if (filter && filter !== 'all') query.source = filter
        const subscribers = await Subscriber.find(query).sort({ createdAt: -1 })
        let csv = 'email,first_name,last_name,source,subscribed_date\n'
        subscribers.forEach(s => {
            csv += `${s.email},${s.firstName},${s.lastName},${s.source},${s.createdAt.toISOString().split('T')[0]}\n`
        })
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv')
        res.send(csv)
    } catch (err) { apiError(res, err) }
})

// ============ ADMIN: EMAIL CAMPAIGNS ============
app.get('/api/admin/campaigns', adminMiddleware, async (req, res) => {
    try {
        const campaigns = await EmailCampaign.find().sort({ createdAt: -1 }).limit(50)
        res.json(campaigns)
    } catch (err) { apiError(res, err) }
})

app.post('/api/admin/campaigns', adminMiddleware, async (req, res) => {
    try {
        const campaign = new EmailCampaign(req.body)
        await campaign.save()
        res.json(campaign)
    } catch (err) { apiError(res, err) }
})

app.post('/api/admin/campaigns/:id/send', adminMiddleware, async (req, res) => {
    try {
        const campaign = await EmailCampaign.findById(req.params.id)
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
        if (campaign.status === 'sending') return res.status(400).json({ error: 'Already sending' })

        const settings = await Settings.findOne()
        if (!settings?.emailEnabled) return res.status(400).json({ error: 'Email not configured' })

        const query = { isActive: true }
        if (campaign.filter !== 'all') query.source = campaign.filter
        const subscribers = await Subscriber.find(query)

        campaign.status = 'sending'
        campaign.totalRecipients = subscribers.length
        campaign.sentCount = 0
        campaign.failedCount = 0
        await campaign.save()

        res.json({ success: true, totalRecipients: subscribers.length, message: 'Campaign started' })

            // Send emails in background (throttled — 1 per 2 seconds)
            ; (async () => {
                for (const sub of subscribers) {
                    try {
                        await sendNewsletterEmail(settings, sub.email, campaign.subject, campaign.body)
                        campaign.sentCount++
                    } catch {
                        campaign.failedCount++
                    }
                    await campaign.save()
                    await new Promise(r => setTimeout(r, 2000)) // Throttle
                }
                campaign.status = 'sent'
                campaign.completedAt = new Date()
                await campaign.save()
            })()
    } catch (err) { apiError(res, err) }
})


// ============ EMAIL TEMPLATE PREVIEWS ============
app.get('/api/admin/email-templates/preview/:type', adminMiddleware, async (req, res) => {
    try {
        const settings = await Settings.findOne()
        const html = await renderTemplatePreview(settings || {}, req.params.type)
        if (!html) return res.status(404).json({ error: 'Template not found' })
        res.json({ html, type: req.params.type })
    } catch (err) { apiError(res, err) }
})

// Get all email template customizations
app.get('/api/admin/email-templates/custom', adminMiddleware, async (req, res) => {
    try {
        const templates = await EmailTemplate.find()
        const map = {}
        templates.forEach(t => { map[t.type] = t })
        res.json(map)
    } catch (err) { apiError(res, err) }
})

// Save email template customization
// Get default template content
app.get('/api/admin/email-templates/defaults/:type', adminMiddleware, async (req, res) => {
    try {
        const { type } = req.params
        const settings = await Settings.findOne().lean() || {}
        const content = await renderTemplatePreview(settings, type)
        if (!content) return res.status(404).json({ error: 'Default template not found' })
        res.json({ content })
    } catch (err) { apiError(res, err) }
})

app.put('/api/admin/email-templates/custom/:type', adminMiddleware, async (req, res) => {
    try {
        const { type } = req.params
        const { subject, headerText, footerText, bodyContent, enabled } = req.body
        const template = await EmailTemplate.findOneAndUpdate(
            { type },
            { type, subject, headerText, footerText, bodyContent, enabled },
            { upsert: true, new: true }
        )
        res.json(template)
    } catch (err) { apiError(res, err) }
})

// Delete email template customization (reset to default)
app.delete('/api/admin/email-templates/custom/:type', adminMiddleware, async (req, res) => {
    try {
        await EmailTemplate.findOneAndDelete({ type: req.params.type })
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})



// ==================== REVIEWS API ====================

// Get user's delivered order items that are eligible for review (MUST be before :productId route)
app.get('/api/reviews/user/delivered-products', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ 'customer.email': req.user.email, status: 'delivered' }).lean()
        const existingReviews = await Review.find({ userId: req.user._id }).select('productId orderId').lean()
        const reviewedKeys = new Set(existingReviews.map(r => `${r.productId}-${r.orderId}`))
        const items = []
        orders.forEach(order => {
            order.items?.forEach(item => {
                const key = `${item.productId}-${order._id}`
                if (!reviewedKeys.has(key)) {
                    items.push({
                        productId: item.productId,
                        productName: item.name,
                        productImage: item.image,
                        price: item.price,
                        quantity: item.quantity,
                        orderId: order.orderId,
                        orderObjectId: order._id,
                        orderDate: order.createdAt
                    })
                }
            })
        })
        res.json(items)
    } catch (err) { apiError(res, err) }
})

// Get approved reviews for a product
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId, isApproved: true })
            .sort({ createdAt: -1 }).lean()
        const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
        res.json({ reviews, average: Math.round(avg * 10) / 10, count: reviews.length })
    } catch (err) { apiError(res, err) }
})

// Submit a review (authenticated user)
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { productId, orderId, rating, title, review: reviewText } = req.body
        if (!productId || !rating || !reviewText) return res.status(400).json({ error: 'Product, rating (1-5), and review text are required' })
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' })

        // Check the product exists
        const product = await Product.findById(productId)
        if (!product) return res.status(404).json({ error: 'Product not found' })

        // Verify purchase if orderId provided
        let isVerified = false
        if (orderId) {
            const order = await Order.findOne({ orderId, 'customer.email': req.user.email, status: 'delivered' })
            if (order) isVerified = true
        }

        // Check for duplicate review
        const existing = await Review.findOne({ productId, userId: req.user._id, orderId: orderId ? (await Order.findOne({ orderId })?._id) : undefined })
        if (existing) return res.status(400).json({ error: 'You have already reviewed this product for this order' })

        const newReview = await Review.create({
            productId,
            userId: req.user._id,
            orderId: orderId ? (await Order.findOne({ orderId }))?._id : undefined,
            rating: Math.round(rating),
            title: title || '',
            review: reviewText,
            reviewerName: (req.user.firstName && req.user.lastName) ? `${req.user.firstName} ${req.user.lastName}` : (req.user.firstName || req.user.lastName || req.user.email?.split('@')[0] || 'Happy Customer'),
            isVerifiedPurchase: isVerified,
            isApproved: true
        })

        res.status(201).json(newReview)
    } catch (err) { apiError(res, err) }
})

// Admin: Get all reviews
app.get('/api/admin/reviews', adminMiddleware, async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 }).populate('productId', 'name').lean()
        res.json(reviews)
    } catch (err) { apiError(res, err) }
})

// Admin: Delete review
app.delete('/api/admin/reviews/:id', adminMiddleware, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) { apiError(res, err) }
})

// Dynamic Sitemap Endpoints for Search Engine crawlers
app.get('/sitemap.xml', generateSitemap)
app.get('/api/sitemap', generateSitemap)

// Start server (only when not on Vercel — Vercel uses the exported app)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Backend: http://localhost:${PORT}`)
        console.log(`📡 Frontend: ${process.env.FRONTEND_URL}`)
    })
}

// Export for Vercel serverless
export default app
