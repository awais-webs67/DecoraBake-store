import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// ==================== USER MODEL ====================
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    avatar: { type: String, default: '' },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpiry: { type: Date, default: null },
    addresses: [{
        label: String,
        address: String,
        city: String,
        state: String,
        postcode: String,
        isDefault: Boolean
    }]
}, { timestamps: true })

userSchema.index({ role: 1 })

userSchema.pre('save', async function (next) {
    // Auto-generate avatar for new users
    if (this.isNew && !this.avatar) {
        const seed = encodeURIComponent(`${this.firstName} ${this.lastName}`)
        this.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=6B2346&textColor=ffffff&fontSize=42`
    }
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.virtual('name').get(function () {
    return `${this.firstName} ${this.lastName}`
})

export const User = mongoose.model('User', userSchema)

// ==================== CATEGORY MODEL ====================
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    showInNav: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
}, { timestamps: true })

export const Category = mongoose.model('Category', categorySchema)

// ==================== PRODUCT MODEL ====================
const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categoryId: { type: String },
    stock: { type: Number, default: 100, min: 0 },
    isNew: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    customShipping: { type: Number, default: null },
    variants: [{
        name: { type: String, default: '' },
        price: { type: Number, default: 0 },
        salePrice: { type: Number, default: null },
        stock: { type: Number, default: 100 },
        sku: { type: String, default: '' },
        image: { type: String, default: '' },
        enabled: { type: Boolean, default: true }
    }],
    enabled: { type: Boolean, default: true }
}, { timestamps: true })

productSchema.index({ category: 1, enabled: 1 })
productSchema.index({ categoryId: 1, enabled: 1 })
productSchema.index({ name: 1 })
productSchema.index({ isFeatured: 1 })
productSchema.index({ isNew: 1 })
productSchema.index({ price: 1 })
productSchema.index({ createdAt: -1 })

productSchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    next()
})

export const Product = mongoose.model('Product', productSchema)

// ==================== ORDER MODEL ====================
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: {
        email: { type: String, required: true },
        firstName: String,
        lastName: String,
        name: String,
        phone: String
    },
    shipping: {
        address: String,
        city: String,
        state: String,
        postcode: String
    },
    items: [{
        productId: String,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        customShipping: Number
    }],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    promoDiscount: { type: Number, default: 0 },
    promoCode: { type: String, default: null },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'card' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    stripeSessionId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    stripeInvoiceId: { type: String, default: '' },
    stripeInvoiceUrl: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    notes: { type: String, default: '' },
    // Shipping/Tracking Info
    trackingNumber: { type: String, default: '' },
    courier: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    deliveryDays: { type: String, default: '' },
    bankReceiptUrl: { type: String, default: '' },
    isGuestOrder: { type: Boolean, default: false }
}, { timestamps: true })

orderSchema.index({ 'customer.email': 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ user: 1 })

export const Order = mongoose.model('Order', orderSchema)

// ==================== PROMO CODE MODEL ====================
const promoCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    usageLimit: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null },
    active: { type: Boolean, default: true }
}, { timestamps: true })

export const PromoCode = mongoose.model('PromoCode', promoCodeSchema)

// ==================== TESTIMONIAL MODEL ====================
const testimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, default: '' },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatar: { type: String, default: '' },
    enabled: { type: Boolean, default: true }
}, { timestamps: true })

export const Testimonial = mongoose.model('Testimonial', testimonialSchema)

// ==================== SLIDER MODEL ====================
const sliderSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    buttonText: { type: String, default: 'Shop Now' },
    buttonLink: { type: String, default: '/products' },
    order: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true }
}, { timestamps: true })

export const Slider = mongoose.model('Slider', sliderSchema)

// ==================== SETTINGS MODEL ====================
const settingsSchema = new mongoose.Schema({
    siteLogo: { type: String, default: '/logo.png' },
    footerLogo: { type: String, default: '/logo.png' },
    announcementText: { type: String, default: '🎂 Free Australia-Wide Shipping on Orders Over $149!' },
    announcementEnabled: { type: Boolean, default: true },
    freeShippingEnabled: { type: Boolean, default: true },
    freeShippingThreshold: { type: Number, default: 149 },
    shippingCost: { type: Number, default: 9.95 },
    contactEmail: { type: String, default: 'hello@decorabake.com.au' },
    contactPhone: { type: String, default: '1300 123 456' },
    address: { type: String, default: 'Sydney, NSW, Australia' },
    // Social Media URLs
    socialFacebook: { type: String, default: '' },
    socialInstagram: { type: String, default: '' },
    socialPinterest: { type: String, default: '' },
    socialTwitter: { type: String, default: '' },
    socialYoutube: { type: String, default: '' },
    socialTiktok: { type: String, default: '' },
    // Admin
    adminUsername: { type: String, default: 'admin' },
    adminPassword: { type: String, default: 'admin123' },
    siteName: { type: String, default: 'DecoraBake' },
    currency: { type: String, default: 'AUD' },
    // Chatbot settings
    chatbotEnabled: { type: Boolean, default: true },
    geminiApiKey: { type: String, default: '' },
    longcatApiKey: { type: String, default: '' },
    qwenApiKey: { type: String, default: '' },
    openRouterApiKey: { type: String, default: '' },
    whatsappEnabled: { type: Boolean, default: false },
    whatsappNumber: { type: String, default: '' },
    // Email Settings
    emailEnabled: { type: Boolean, default: false },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPassword: { type: String, default: '' },
    emailFrom: { type: String, default: '' },
    emailFromName: { type: String, default: 'DecoraBake' },
    adminEmail: { type: String, default: '' }, // Admin receives notifications for new orders/refunds
    siteUrl: { type: String, default: 'http://localhost:5173' },
    // Email Templates enabled
    // Payment Methods
    paymentStripeEnabled: { type: Boolean, default: true },
    paymentBankTransferEnabled: { type: Boolean, default: false },
    bankName: { type: String, default: '' },
    bankAccountName: { type: String, default: '' },
    bankBSB: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    bankInstructions: { type: String, default: 'Please use your Order ID as the payment reference. Orders will be processed once payment is verified (1-2 business days).' },
    sendOrderConfirmation: { type: Boolean, default: true },
    sendWelcomeEmail: { type: Boolean, default: true },
    sendShippingNotification: { type: Boolean, default: true },
    sendAdminOrderNotification: { type: Boolean, default: true },
    sendAdminRefundNotification: { type: Boolean, default: true },
    // Email template branding
    emailLogo: { type: String, default: '' },
    emailShowTextLogo: { type: Boolean, default: false },
    emailFooterText: { type: String, default: '' },
    emailFooterEmail: { type: String, default: '' },
    adminNotificationEmail: { type: String, default: '' },
    // ImageKit — Cloud Image Storage
    imagekitEnabled: { type: Boolean, default: false },
    imagekitPublicKey: { type: String, default: '' },
    imagekitPrivateKey: { type: String, default: '' },
    imagekitUrlEndpoint: { type: String, default: '' },
    // Homepage section visibility
    homeSections: {
        heroSlider: { type: Boolean, default: true },
        trustFeatures: { type: Boolean, default: true },
        featuredProducts: { type: Boolean, default: true },
        categoryCircles: { type: Boolean, default: true },
        productGrid: { type: Boolean, default: true },
        promoSection: { type: Boolean, default: true },
        testimonials: { type: Boolean, default: true }
    }
}, { timestamps: true })

export const Settings = mongoose.model('Settings', settingsSchema)

// ==================== SECTION MODEL ====================
const sectionSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    data: mongoose.Schema.Types.Mixed
}, { timestamps: true })

export const Section = mongoose.model('Section', sectionSchema)

// ==================== CART MODEL ====================
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{
        productId: { type: String, required: true },
        name: { type: String },
        price: { type: Number },
        salePrice: { type: Number },
        image: { type: String },
        quantity: { type: Number, default: 1 },
        customShipping: { type: Number, default: 0 }
    }]
}, { timestamps: true })

export const Cart = mongoose.model('Cart', cartSchema)

// ==================== REVIEW MODEL ====================
const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for admin reviews
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // for verified purchases
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    review: { type: String, required: true },
    reviewerName: { type: String, required: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    isAdminReview: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true }, // admin can moderate
    helpfulCount: { type: Number, default: 0 }
}, { timestamps: true })

reviewSchema.index({ productId: 1 })
reviewSchema.index({ userId: 1 })
reviewSchema.index({ isApproved: 1 })

export const Review = mongoose.model('Review', reviewSchema)

// ==================== PAGE MODEL (CMS) ====================
const pageSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true }, // e.g., 'about', 'contact', 'privacy'
    title: { type: String, required: true },
    content: { type: String, default: '' }, // HTML content
    metaDescription: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
    type: { type: String, enum: ['page', 'blog'], default: 'page' }, // page or blog post
    featuredImage: { type: String, default: '' },
    excerpt: { type: String, default: '' } // for blog posts
}, { timestamps: true })

export const Page = mongoose.model('Page', pageSchema)

// ==================== REFUND REQUEST MODEL ====================
const refundSchema = new mongoose.Schema({
    refundId: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderId: { type: String, required: true },
    customer: {
        email: { type: String, required: true },
        firstName: String,
        lastName: String,
        phone: String
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'approved', 'denied', 'completed'],
        default: 'pending'
    },
    // Messages between admin and customer
    messages: [{
        from: { type: String, enum: ['admin', 'customer'], required: true },
        message: { type: String, required: true },
        images: [{ type: String }],
        date: { type: Date, default: Date.now }
    }],
    adminNotes: { type: String, default: '' },
    processedAt: { type: Date },
    processedBy: { type: String }
}, { timestamps: true })

refundSchema.index({ 'customer.email': 1 })
refundSchema.index({ status: 1 })
refundSchema.index({ createdAt: -1 })

export const Refund = mongoose.model('Refund', refundSchema)

// ==================== SUPPORT CHAT MODEL ====================
const supportChatSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    customer: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        email: { type: String, required: true },
        firstName: String,
        lastName: String
    },
    status: {
        type: String,
        enum: ['open', 'active', 'resolved', 'closed'],
        default: 'open'
    },
    subject: { type: String, default: 'Support Request' },
    unreadCustomer: { type: Number, default: 0 },
    unreadAdmin: { type: Number, default: 0 },
    lastMessage: { type: Date, default: Date.now },
    messages: [{
        from: { type: String, enum: ['customer', 'admin'], required: true },
        message: { type: String },
        messageType: { type: String, enum: ['text', 'product', 'order', 'image'], default: 'text' },
        // For product/order attachments
        attachment: {
            type: { type: String },
            id: String,
            name: String,
            image: String,
            price: Number,
            orderId: String
        },
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
    }],
    assignedTo: { type: String, default: '' }
}, { timestamps: true })

supportChatSchema.index({ 'customer.email': 1 })
supportChatSchema.index({ status: 1 })
supportChatSchema.index({ lastMessage: -1 })

export const SupportChat = mongoose.model('SupportChat', supportChatSchema)


// ═══════════════════════════════════════════
// SUBSCRIBER (Newsletter)
// ═══════════════════════════════════════════
const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    source: { type: String, enum: ['newsletter', 'register', 'purchase', 'import', 'manual'], default: 'newsletter' },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }]
}, { timestamps: true })

subscriberSchema.index({ email: 1 })
subscriberSchema.index({ source: 1 })
subscriberSchema.index({ isActive: 1 })

export const Subscriber = mongoose.model('Subscriber', subscriberSchema)


// ═══════════════════════════════════════════
// EMAIL CAMPAIGN
// ═══════════════════════════════════════════
const emailCampaignSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    body: { type: String, required: true },
    filter: { type: String, enum: ['all', 'newsletter', 'register', 'purchase', 'import'], default: 'all' },
    status: { type: String, enum: ['draft', 'sending', 'sent', 'failed'], default: 'draft' },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    scheduledAt: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true })

export const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema)

// ═══════════════════════════════════════════
// EMAIL TEMPLATE CUSTOMIZATION
// ═══════════════════════════════════════════
const emailTemplateSchema = new mongoose.Schema({
    type: { type: String, required: true, unique: true },
    subject: { type: String, default: '' },
    headerText: { type: String, default: '' },
    footerText: { type: String, default: '' },
    bodyContent: { type: String }, // Stores the full HTML body template with variables
    enabled: { type: Boolean, default: true }
}, { timestamps: true })

export const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema)
