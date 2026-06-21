import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI

// Import models
import { User, Category, Product, Slider, Settings, Testimonial, Section, Page } from '../models.js'

async function seed() {
    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected!')

        // Clear existing data
        console.log('🧹 Clearing existing data...')
        await Promise.all([
            User.deleteMany({}),
            Category.deleteMany({}),
            Product.deleteMany({}),
            Slider.deleteMany({}),
            Settings.deleteMany({}),
            Testimonial.deleteMany({}),
            Section.deleteMany({}),
            Page.deleteMany({})
        ])
        console.log('✅ Data cleared')

        // 1. Create Users
        console.log('👤 Creating users...')
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash('admin123', salt)

        await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@decorabake.com',
            password: hashedPassword,
            isAdmin: true
        })

        const userPassword = await bcrypt.hash('user123', salt)
        await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'user@decorabake.com',
            password: userPassword,
            isAdmin: false
        })
        console.log('✅ Created Admin and Test User')

        // 2. Create Categories
        console.log('📂 Creating categories...')
        const categories = await Category.insertMany([
            { name: 'Cake Toppers', slug: 'cake-toppers', description: 'Beautiful cake toppers for every occasion', showInNav: true, showOnHome: true, image: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400&h=400&fit=crop' },
            { name: 'Sprinkles', slug: 'sprinkles', description: 'Colorful sprinkles and edible decorations', showInNav: true, showOnHome: true, image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=400&fit=crop' },
            { name: 'Fondant Tools', slug: 'fondant-tools', description: 'Professional fondant tools and cutters', showInNav: true, showOnHome: true, image: 'https://images.unsplash.com/photo-1556217477-d325251ece38?w=400&h=400&fit=crop' },
            { name: 'Baking Supplies', slug: 'baking-supplies', description: 'Essential baking supplies and equipment', showInNav: true, showOnHome: true, image: 'https://images.unsplash.com/photo-1590080876351-941da357a5e4?w=400&h=400&fit=crop' },
            { name: 'Edible Decorations', slug: 'edible-decorations', description: 'Edible flowers, pearls and decorations', showInNav: true, showOnHome: false, image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=400&fit=crop' },
            { name: 'Packaging', slug: 'packaging', description: 'Cake boxes and packaging supplies', showInNav: true, showOnHome: false, image: 'https://images.unsplash.com/photo-1606103836293-c82093a5d898?w=400&h=400&fit=crop' }
        ])
        console.log(`✅ Created ${categories.length} categories`)

        // 3. Create Products
        console.log('🧁 Creating products...')
        const products = [
            // Cake Toppers
            { name: 'Happy Birthday Gold Topper', slug: 'happy-birthday-gold-topper', price: 12.95, salePrice: 9.95, categoryId: categories[0]._id, stock: 50, isNew: true, isFeatured: true, description: 'Elegant gold acrylic cake topper perfect for birthday celebrations. Measures 15cm wide.', images: ['https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=600&fit=crop'] },
            { name: 'Wedding Couple Topper', slug: 'wedding-couple-topper', price: 24.95, categoryId: categories[0]._id, stock: 30, isNew: false, isFeatured: true, description: 'Romantic bride and groom cake topper made from high quality resin.', images: ['https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=600&fit=crop'] },
            { name: 'Number 1 Candle Gold', slug: 'number-1-candle-gold', price: 4.95, categoryId: categories[0]._id, stock: 100, description: 'Gold number 1 candle, perfect for first birthdays.', images: ['https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop'] },
            { name: 'Number 2 Candle Gold', slug: 'number-2-candle-gold', price: 4.95, categoryId: categories[0]._id, stock: 100, description: 'Gold number 2 candle.', images: ['https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop'] },

            // Sprinkles
            { name: 'Rainbow Sprinkle Mix', slug: 'rainbow-sprinkle-mix', price: 6.95, salePrice: 4.95, categoryId: categories[1]._id, stock: 200, isNew: false, isFeatured: true, description: 'Colorful rainbow sprinkle mix 100g. Perfect for cupcakes and birthday cakes.', images: ['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1517427677506-ade074eb1432?w=600&h=600&fit=crop'] },
            { name: 'Gold Pearl Sprinkles', slug: 'gold-pearl-sprinkles', price: 9.95, categoryId: categories[1]._id, stock: 80, isNew: true, isFeatured: true, description: 'Luxurious gold pearl sprinkles (4mm and 7mm mix).', images: ['https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=600&fit=crop'] },
            { name: 'Chocolate Jimmies', slug: 'chocolate-jimmies', price: 5.95, categoryId: categories[1]._id, stock: 150, description: 'Classic chocolate sprinkles, 100g pack.', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop'] },
            { name: 'Pink Heart Sprinkles', slug: 'pink-heart-sprinkles', price: 7.95, categoryId: categories[1]._id, stock: 60, isNew: true, description: 'Cute pink heart shaped sprinkles.', images: ['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&h=600&fit=crop'] },

            // Fondant Tools
            { name: 'Fondant Rolling Pin', slug: 'fondant-rolling-pin', price: 29.95, salePrice: 24.95, categoryId: categories[2]._id, stock: 40, isFeatured: true, description: 'Non-stick fondant rolling pin (50cm) with thickness guides.', images: ['https://images.unsplash.com/photo-1556217477-d325251ece38?w=600&h=600&fit=crop'] },
            { name: 'Smoother Tool', slug: 'smoother-tool', price: 8.95, categoryId: categories[2]._id, stock: 120, description: 'Essential tool for smoothing fondant on cakes.', images: ['https://images.unsplash.com/photo-1556217477-d325251ece38?w=600&h=600&fit=crop'] },
            { name: 'Modelling Tool Set', slug: 'modelling-tool-set', price: 15.95, categoryId: categories[2]._id, stock: 70, description: 'Set of 8 double-ended modelling tools for fondant and gum paste.', images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop'] },

            // Baking Supplies
            { name: 'Round Cake Pan Set', slug: 'round-cake-pan-set', price: 39.95, categoryId: categories[3]._id, stock: 25, isFeatured: true, description: 'Set of 3 non-stick round cake pans (6", 8", 10").', images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=600&fit=crop'] },
            { name: 'Silicone Spatula Set', slug: 'silicone-spatula-set', price: 14.95, categoryId: categories[3]._id, stock: 90, isNew: true, description: 'Heat resistant silicone spatula set (3 pieces).', images: ['https://images.unsplash.com/photo-1558303055-97cb7b0e3c1a?w=600&h=600&fit=crop'] },
            { name: 'Piping Bag Set', slug: 'piping-bag-set', price: 19.95, salePrice: 16.95, categoryId: categories[3]._id, stock: 55, description: '100 disposable piping bags + 6 stainless steel tips.', images: ['https://images.unsplash.com/photo-1590080876351-941da357a5e4?w=600&h=600&fit=crop'] },
            { name: 'Cupcake Liners Gold', slug: 'cupcake-liners-gold', price: 6.95, categoryId: categories[3]._id, stock: 200, description: 'Pack of 50 gold foil cupcake liners.', images: ['https://images.unsplash.com/photo-1612203985729-ca8faf022d2d?w=600&h=600&fit=crop'] }
        ]

        await Product.insertMany(products)
        console.log(`✅ Created ${products.length} products`)

        // 4. Create Sliders
        console.log('🖼️ Creating sliders...')
        await Slider.insertMany([
            { title: 'Beautiful Cakes Start With <span style="color:#F9D5E0">Quality Supplies</span>', subtitle: "Australia's #1 Cake Store", description: 'Discover premium cake toppers, sprinkles, fondant tools, and everything you need to create stunning masterpieces.', buttonText: 'Shop Now', buttonLink: '/products', order: 1, enabled: true, image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1600&h=900&fit=crop' },
            { title: 'New Arrivals <span style="color:#F9D5E0">Just Landed!</span>', subtitle: 'Summer Collection 2024', description: 'Check out our latest products including new sprinkle mixes and fondant tools.', buttonText: 'View New', buttonLink: '/products?new=true', order: 2, enabled: true, image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=1600&h=900&fit=crop' }
        ])
        console.log('✅ Created sliders')

        // 5. Create Settings
        console.log('⚙️ Creating settings...')
        await Settings.create({
            siteName: 'DecoraBake',
            announcementText: '🎂 Free Australia-Wide Shipping on Orders Over $149!',
            announcementEnabled: true,
            freeShippingEnabled: true,
            freeShippingThreshold: 149,
            shippingCost: 9.95,
            contactEmail: 'support@decorabake.com.au',
            contactPhone: '1300 123 456',
            address: '123 Bakery Lane, Melbourne VIC 3000'
        })
        console.log('✅ Created settings')

        // 6. Create Pages
        console.log('📄 Creating pages...')
        await Page.insertMany([
            { slug: 'about', title: 'About Us', content: '<h2>Welcome to DecoraBake</h2><p>We are Australia\'s premier online destination for cake decorating supplies.</p><p>Founded in 2024, our mission is to bring professional-quality tools and ingredients to home bakers.</p>', isSystem: true },
            { slug: 'privacy', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. We collect information only to process your orders.</p>', isSystem: true },
            { slug: 'terms', title: 'Terms & Conditions', content: '<h2>Terms of Service</h2><p>By using this site, you agree to our terms.</p>', isSystem: true },
            { slug: 'contact', title: 'Contact Us', content: '<h2>Get in Touch</h2><p>Email: support@decorabake.com.au<br>Phone: 1300 123 456</p>', isSystem: true }
        ])
        console.log('✅ Created pages')

        // 7. Create Testimonials
        console.log('💬 Creating testimonials...')
        await Testimonial.insertMany([
            { name: 'Sarah Mitchell', location: 'Sydney, NSW', rating: 5, text: 'Absolutely love the quality of supplies from DecoraBake! The sprinkles are vibrant and the fondant tools are professional grade.', enabled: true },
            { name: 'Emma Thompson', location: 'Melbourne, VIC', rating: 5, text: 'Fast shipping and excellent customer service. The cake toppers I ordered were exactly as pictured. Will definitely order again!', enabled: true },
            { name: 'Jessica Williams', location: 'Brisbane, QLD', rating: 5, text: 'Best cake decorating store in Australia! Great variety and reasonable prices. My go-to shop for all my baking needs.', enabled: true }
        ])
        console.log('✅ Created testimonials')

        // 8. Create Sections
        console.log('🧩 Creating sections...')
        await Section.insertMany([
            {
                key: 'trust-features', data: [
                    { id: 1, icon: 'shipping', title: 'Free Shipping', description: 'On orders over $149 Australia-wide' },
                    { id: 2, icon: 'payment', title: 'Secure Payment', description: 'Multiple payment options available' },
                    { id: 3, icon: 'returns', title: 'Easy Returns', description: '30-day hassle-free returns' },
                    { id: 4, icon: 'quality', title: 'Premium Quality', description: 'Top brands & quality products' }
                ]
            },
            {
                key: 'promo', data: {
                    label: 'Limited Time Offer',
                    title: 'Get 20% Off Your First Order',
                    description: 'Join thousands of happy bakers. Use code WELCOME20 at checkout.',
                    buttonText: 'Shop Now',
                    buttonLink: '/products'
                }
            }
        ])
        console.log('✅ Created sections')

        console.log('\n✨ Database Seeded Successfully! ✨')
        console.log('Admin Login: admin@decorabake.com / admin123')
        process.exit(0)
    } catch (error) {
        console.error('❌ Seed failed:', error)
        process.exit(1)
    }
}

seed()
