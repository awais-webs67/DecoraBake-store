// Database Restore Script - Restores settings, categories, slider, testimonials, pages, and email templates
// Run with: node restore-config.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })
const MONGODB_URI = process.env.MONGODB_URI
async function restore() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected to MongoDB')
        const db = mongoose.connection.db
        // ========== 1. SETTINGS ==========
        console.log('\n📋 Restoring Settings...')
        const settingsCollection = db.collection('settings')
        const existingSettings = await settingsCollection.findOne()
        if (!existingSettings) {
            await settingsCollection.insertOne({
                siteLogo: '/logo.png',
                footerLogo: '/logo.png',
                announcementText: '🎂 Free Australia-Wide Shipping on Orders Over $149!',
                announcementEnabled: true,
                freeShippingEnabled: true,
                freeShippingThreshold: 149,
                shippingCost: 9.95,
                contactEmail: 'hello@decorabake.com.au',
                contactPhone: '1300 123 456',
                address: 'Sydney, NSW, Australia',
                socialFacebook: '',
                socialInstagram: '',
                socialPinterest: '',
                socialTwitter: '',
                socialYoutube: '',
                socialTiktok: '',
                adminUsername: 'admin',
                adminPassword: 'admin123',
                siteName: 'DecoraBake',
                currency: 'AUD',
                chatbotEnabled: true,
                geminiApiKey: '',
                longcatApiKey: '',
                whatsappEnabled: false,
                whatsappNumber: '',
                emailEnabled: false,
                smtpHost: '',
                smtpPort: 587,
                smtpSecure: false,
                smtpUser: '',
                smtpPassword: '',
                emailFrom: '',
                emailFromName: 'DecoraBake',
                adminEmail: '',
                siteUrl: 'http://localhost:5173',
                sendOrderConfirmation: true,
                sendWelcomeEmail: true,
                sendShippingNotification: true,
                sendAdminOrderNotification: true,
                sendAdminRefundNotification: true,
                emailLogo: '',
                adminNotificationEmail: '',
                homeSections: {
                    heroSlider: true,
                    trustFeatures: true,
                    featuredProducts: true,
                    categoryCircles: true,
                    productGrid: true,
                    promoSection: true,
                    testimonials: true
                },
                createdAt: new Date(),
                updatedAt: new Date()
            })
            console.log('  ✅ Settings restored with defaults')
        } else {
            console.log('  ⏭️  Settings already exist, skipping')
        }
        // ========== 2. CATEGORIES ==========
        console.log('\n📂 Restoring Categories...')
        const categoriesCollection = db.collection('categories')
        const existingCats = await categoriesCollection.countDocuments()
        if (existingCats === 0) {
            const categories = [
                { name: 'Cake Toppers', slug: 'cake-toppers', description: 'Beautiful cake toppers for every occasion', image: '', showInNav: true, showOnHome: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Sprinkles & Decorations', slug: 'sprinkles-decorations', description: 'Colorful sprinkles and edible decorations', image: '', showInNav: true, showOnHome: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Fondant & Icing', slug: 'fondant-icing', description: 'Premium fondant, icing, and gum paste', image: '', showInNav: true, showOnHome: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Baking Tools', slug: 'baking-tools', description: 'Professional baking tools and equipment', image: '', showInNav: true, showOnHome: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Moulds & Cutters', slug: 'moulds-cutters', description: 'Silicone moulds and cookie cutters', image: '', showInNav: true, showOnHome: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Edible Prints & Images', slug: 'edible-prints-images', description: 'Edible wafer paper and printed images', image: '', showInNav: true, showOnHome: true, order: 6, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Packaging', slug: 'packaging', description: 'Cake boxes, boards, and packaging supplies', image: '', showInNav: true, showOnHome: false, order: 7, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Colours & Flavours', slug: 'colours-flavours', description: 'Food coloring, flavoring, and extracts', image: '', showInNav: true, showOnHome: true, order: 8, createdAt: new Date(), updatedAt: new Date() }
            ]
            await categoriesCollection.insertMany(categories)
            console.log(`  ✅ ${categories.length} categories restored`)
        } else {
            console.log(`  ⏭️  ${existingCats} categories already exist, skipping`)
        }
        // ========== 3. SLIDER ==========
        console.log('\n🖼️  Restoring Slider...')
        const slidersCollection = db.collection('sliders')
        const existingSliders = await slidersCollection.countDocuments()
        if (existingSliders === 0) {
            await slidersCollection.insertMany([
                {
                    title: 'Beautiful Cakes Start With <span style="color:#F9D5E0">Quality Supplies</span>',
                    subtitle: "Australia's #1 Cake Store",
                    description: 'Discover premium cake toppers, sprinkles, fondant tools, and everything you need to create stunning masterpieces.',
                    image: '',
                    buttonText: 'Shop Now',
                    buttonLink: '/products',
                    order: 1,
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    title: 'New Arrivals <span style="color:#F9D5E0">Just Landed</span>',
                    subtitle: 'Fresh & Trending',
                    description: 'Check out our latest collection of cake decorating essentials, tools, and edible decorations.',
                    image: '',
                    buttonText: 'View New',
                    buttonLink: '/products?new=true',
                    order: 2,
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    title: 'Free Shipping <span style="color:#F9D5E0">Over $149</span>',
                    subtitle: 'Australia Wide',
                    description: 'Enjoy free shipping on all orders over $149. Fast dispatch within 24 hours.',
                    image: '',
                    buttonText: 'Start Shopping',
                    buttonLink: '/products',
                    order: 3,
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ])
            console.log('  ✅ 3 slider items restored')
        } else {
            console.log(`  ⏭️  ${existingSliders} sliders already exist, skipping`)
        }
        // ========== 4. TESTIMONIALS ==========
        console.log('\n⭐ Restoring Testimonials...')
        const testimonialsCollection = db.collection('testimonials')
        const existingTestimonials = await testimonialsCollection.countDocuments()
        if (existingTestimonials === 0) {
            await testimonialsCollection.insertMany([
                { name: 'Sarah M.', location: 'Sydney, NSW', text: 'Absolutely love the quality of products! My cakes have never looked better. The cake toppers are stunning and the delivery was super fast.', rating: 5, avatar: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Emma L.', location: 'Melbourne, VIC', text: 'Best cake supply store in Australia! Great range, fast shipping, and the customer service team is incredibly helpful.', rating: 5, avatar: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Jessica R.', location: 'Brisbane, QLD', text: 'I run a home bakery and DecoraBake is my go-to supplier. The sprinkles are amazing quality and the prices are very competitive.', rating: 5, avatar: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { name: 'Amanda K.', location: 'Perth, WA', text: 'The fondant quality is outstanding - so smooth and easy to work with. Will definitely be ordering again!', rating: 5, avatar: '', enabled: true, createdAt: new Date(), updatedAt: new Date() }
            ])
            console.log('  ✅ 4 testimonials restored')
        } else {
            console.log(`  ⏭️  ${existingTestimonials} testimonials already exist, skipping`)
        }
        // ========== 5. PAGES (CMS) ==========
        console.log('\n📄 Restoring Pages...')
        const pagesCollection = db.collection('pages')
        const existingPages = await pagesCollection.countDocuments()
        if (existingPages === 0) {
            await pagesCollection.insertMany([
                {
                    slug: 'about',
                    title: 'About Us',
                    content: '',
                    metaDescription: "Learn about DecoraBake - Australia's premier cake decorating supply store.",
                    isPublished: true,
                    type: 'page',
                    featuredImage: '',
                    excerpt: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    slug: 'contact',
                    title: 'Contact Us',
                    content: '',
                    metaDescription: 'Get in touch with DecoraBake. We are here to help with all your cake decorating needs.',
                    isPublished: true,
                    type: 'page',
                    featuredImage: '',
                    excerpt: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    slug: 'privacy-policy',
                    title: 'Privacy Policy',
                    content: '<h2>Privacy Policy</h2><p>At DecoraBake, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p><h3>Information We Collect</h3><p>We collect information that you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, postal address, phone number, and payment information.</p><h3>How We Use Your Information</h3><p>We use the information we collect to process your orders, communicate with you, improve our services, and send you marketing communications (with your consent).</p><h3>Data Security</h3><p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p><h3>Contact Us</h3><p>If you have any questions about this Privacy Policy, please contact us at hello@decorabake.com.au</p>',
                    metaDescription: 'DecoraBake Privacy Policy - How we collect, use, and protect your personal information.',
                    isPublished: true,
                    type: 'page',
                    featuredImage: '',
                    excerpt: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    slug: 'terms',
                    title: 'Terms & Conditions',
                    content: '<h2>Terms & Conditions</h2><p>Welcome to DecoraBake. By accessing and using our website, you accept and agree to be bound by these Terms and Conditions.</p><h3>Orders & Payments</h3><p>All orders are subject to availability and confirmation of the order price. We accept payments via credit card through our secure payment processor, Stripe.</p><h3>Shipping</h3><p>We offer Australia-wide shipping. Free shipping is available on orders over $149. Orders are typically dispatched within 24 hours on business days.</p><h3>Returns & Refunds</h3><p>We accept returns of unused and unopened products within 30 days of delivery. Please contact our support team to initiate a return.</p><h3>Contact</h3><p>For any questions regarding these terms, please contact us at hello@decorabake.com.au</p>',
                    metaDescription: 'DecoraBake Terms & Conditions - Read our terms of service.',
                    isPublished: true,
                    type: 'page',
                    featuredImage: '',
                    excerpt: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    slug: 'shipping-returns',
                    title: 'Shipping & Returns',
                    content: '<h2>Shipping Information</h2><p><strong>Free Shipping:</strong> Enjoy free Australia-wide shipping on all orders over $149.</p><p><strong>Standard Shipping:</strong> $9.95 flat rate for orders under $149.</p><p><strong>Dispatch Time:</strong> Orders are dispatched within 24 hours on business days.</p><p><strong>Delivery Time:</strong> Standard delivery takes 3-7 business days depending on your location.</p><h2>Returns Policy</h2><p>We want you to be 100% happy with your purchase. If you are not satisfied, you may return unused and unopened items within 30 days for a full refund.</p><p>To initiate a return, please contact our support team through your account page or email us at hello@decorabake.com.au</p>',
                    metaDescription: 'DecoraBake Shipping & Returns - Free shipping over $149, 30-day returns.',
                    isPublished: true,
                    type: 'page',
                    featuredImage: '',
                    excerpt: '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ])
            console.log('  ✅ 5 pages restored (about, contact, privacy, terms, shipping-returns)')
        } else {
            console.log(`  ⏭️  ${existingPages} pages already exist, skipping`)
        }
        // ========== 6. EMAIL TEMPLATES ==========
        console.log('\n📧 Restoring Email Templates...')
        const emailTemplatesCollection = db.collection('emailtemplates')
        const existingTemplates = await emailTemplatesCollection.countDocuments()
        if (existingTemplates === 0) {
            await emailTemplatesCollection.insertMany([
                { type: 'order_confirmation', subject: 'Order Confirmed - {{orderId}}', headerText: 'Thank You For Your Order!', footerText: 'Thank you for shopping with DecoraBake!', bodyContent: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { type: 'welcome', subject: 'Welcome to DecoraBake!', headerText: 'Welcome to the DecoraBake Family!', footerText: 'Happy Baking! 🎂', bodyContent: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { type: 'shipping_notification', subject: 'Your Order Has Been Shipped - {{orderId}}', headerText: 'Your Order is on its Way!', footerText: 'Thank you for shopping with DecoraBake!', bodyContent: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { type: 'admin_new_order', subject: 'New Order Received - {{orderId}}', headerText: 'New Order Alert', footerText: '', bodyContent: '', enabled: true, createdAt: new Date(), updatedAt: new Date() },
                { type: 'admin_refund_request', subject: 'New Refund Request - {{refundId}}', headerText: 'Refund Request Alert', footerText: '', bodyContent: '', enabled: true, createdAt: new Date(), updatedAt: new Date() }
            ])
            console.log('  ✅ 5 email templates restored')
        } else {
            console.log(`  ⏭️  ${existingTemplates} email templates already exist, skipping`)
        }
        // ========== 7. PROMO CODES ==========
        console.log('\n🏷️  Restoring Promo Codes...')
        const promoCodesCollection = db.collection('promocodes')
        const existingPromos = await promoCodesCollection.countDocuments()
        if (existingPromos === 0) {
            await promoCodesCollection.insertMany([
                { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, usageLimit: 0, usageCount: 0, minOrder: 50, expiryDate: null, active: true, createdAt: new Date(), updatedAt: new Date() },
                { code: 'FREESHIP', discountType: 'fixed', discountValue: 9.95, usageLimit: 0, usageCount: 0, minOrder: 100, expiryDate: null, active: true, createdAt: new Date(), updatedAt: new Date() }
            ])
            console.log('  ✅ 2 promo codes restored (WELCOME10, FREESHIP)')
        } else {
            console.log(`  ⏭️  ${existingPromos} promo codes already exist, skipping`)
        }
        // ========== SUMMARY ==========
        console.log('\n' + '='.repeat(50))
        console.log('✅ DATABASE RESTORE COMPLETE!')
        console.log('='.repeat(50))
        console.log('\n⚠️  NOTE: Products were NOT restored by this script.')
        console.log('   You will need to re-add products through the Admin Panel.')
        console.log('   Go to: http://localhost:5173/admin → Products → Add Product')
        console.log('\n⚠️  NOTE: If you had custom SMTP/email settings or WhatsApp')
        console.log('   integrations, you will need to re-configure those in the')
        console.log('   Admin Panel → Settings → Integrations.')
        console.log('')
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
        process.exit(0)
    } catch (error) {
        console.error('❌ Restore failed:', error.message)
        process.exit(1)
    }
}
restore()
