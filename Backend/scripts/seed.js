// Seed script - Run with: node seed.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI

// Import models from models.js
import { User, Category, Product, Slider, Settings, Testimonial, Section } from '../models.js'

// ============ SEED DATA ============
async function seed() {
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected!')

        // Drop existing indexes that might cause issues
        console.log('Dropping problematic indexes...')
        try {
            await Category.collection.dropIndexes()
            await Product.collection.dropIndexes()
        } catch (e) { console.log('(Indexes may not exist yet)') }

        // Clear existing data
        console.log('Clearing existing data...')
        await Category.deleteMany({})
        await Product.deleteMany({})
        await Slider.deleteMany({})
        await Settings.deleteMany({})
        await Testimonial.deleteMany({})
        await Section.deleteMany({})

        // Create Categories
        console.log('Creating categories...')
        const categories = await Category.insertMany([
            { name: 'Cake Toppers', slug: 'cake-toppers', description: 'Beautiful cake toppers for every occasion', showInNav: true, showOnHome: true },
            { name: 'Sprinkles', slug: 'sprinkles', description: 'Colorful sprinkles and edible decorations', showInNav: true, showOnHome: true },
            { name: 'Fondant Tools', slug: 'fondant-tools', description: 'Professional fondant tools and cutters', showInNav: true, showOnHome: true },
            { name: 'Baking Supplies', slug: 'baking-supplies', description: 'Essential baking supplies and equipment', showInNav: true, showOnHome: true },
            { name: 'Edible Decorations', slug: 'edible-decorations', description: 'Edible flowers, pearls and decorations', showInNav: true, showOnHome: false },
            { name: 'Packaging', slug: 'packaging', description: 'Cake boxes and packaging supplies', showInNav: true, showOnHome: false }
        ])
        console.log(`✅ Created ${categories.length} categories`)

        // Create Products with placeholder images
        console.log('Creating products...')
        const products = await Product.insertMany([
            // Cake Toppers
            { name: 'Happy Birthday Gold Topper', slug: 'happy-birthday-gold-topper', price: 12.95, salePrice: 9.95, categoryId: categories[0]._id.toString(), stock: 50, isNew: true, isFeatured: true, description: 'Elegant gold acrylic cake topper perfect for birthday celebrations', images: ['https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400&h=400&fit=crop'] },
            { name: 'Wedding Couple Topper', slug: 'wedding-couple-topper', price: 24.95, categoryId: categories[0]._id.toString(), stock: 30, isNew: false, isFeatured: true, description: 'Romantic bride and groom cake topper', images: ['https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400&h=400&fit=crop'] },
            { name: 'Number Candles Set', slug: 'number-candles-set', price: 8.95, categoryId: categories[0]._id.toString(), stock: 100, isNew: true, description: 'Gold number candles 0-9', images: ['https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=400&fit=crop'] },
            // Sprinkles
            { name: 'Rainbow Sprinkle Mix', slug: 'rainbow-sprinkle-mix', price: 6.95, salePrice: 4.95, categoryId: categories[1]._id.toString(), stock: 200, isNew: false, isFeatured: true, description: 'Colorful rainbow sprinkle mix 100g', images: ['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=400&fit=crop'] },
            { name: 'Gold Pearl Sprinkles', slug: 'gold-pearl-sprinkles', price: 9.95, categoryId: categories[1]._id.toString(), stock: 80, isNew: true, isFeatured: true, description: 'Luxurious gold pearl sprinkles', images: ['https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop'] },
            { name: 'Chocolate Jimmies', slug: 'chocolate-jimmies', price: 5.95, categoryId: categories[1]._id.toString(), stock: 150, description: 'Delicious chocolate sprinkles', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop'] },
            // Fondant Tools
            { name: 'Fondant Rolling Pin Set', slug: 'fondant-rolling-pin-set', price: 29.95, salePrice: 24.95, categoryId: categories[2]._id.toString(), stock: 40, isFeatured: true, description: 'Professional rolling pin set with guides', images: ['https://images.unsplash.com/photo-1556217477-d325251ece38?w=400&h=400&fit=crop'] },
            { name: 'Flower Cutter Set', slug: 'flower-cutter-set', price: 18.95, categoryId: categories[2]._id.toString(), stock: 60, isNew: true, description: '12-piece flower cutter set', images: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=400&fit=crop'] },
            { name: 'Modelling Tools 8pc', slug: 'modelling-tools-8pc', price: 15.95, categoryId: categories[2]._id.toString(), stock: 70, description: 'Essential modelling tools set', images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop'] },
            // Baking Supplies
            { name: 'Round Cake Pan Set', slug: 'round-cake-pan-set', price: 39.95, categoryId: categories[3]._id.toString(), stock: 25, isFeatured: true, description: '3-piece non-stick cake pan set', images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop'] },
            { name: 'Silicone Spatula Set', slug: 'silicone-spatula-set', price: 14.95, categoryId: categories[3]._id.toString(), stock: 90, isNew: true, description: 'Heat resistant spatula set', images: ['https://images.unsplash.com/photo-1558303055-97cb7b0e3c1a?w=400&h=400&fit=crop'] },
            { name: 'Piping Bag Set', slug: 'piping-bag-set', price: 19.95, salePrice: 16.95, categoryId: categories[3]._id.toString(), stock: 55, description: 'Reusable piping bags with tips', images: ['https://images.unsplash.com/photo-1590080876351-941da357a5e4?w=400&h=400&fit=crop'] }
        ])
        console.log(`✅ Created ${products.length} products`)

        // Create Slider
        console.log('Creating slider...')
        await Slider.insertMany([
            { title: 'Beautiful Cakes Start With <span style="color:#F9D5E0">Quality Supplies</span>', subtitle: "Australia's #1 Cake Store", description: 'Discover premium cake toppers, sprinkles, fondant tools, and everything you need to create stunning masterpieces.', buttonText: 'Shop Now', buttonLink: '/products', order: 1, enabled: true },
            { title: 'New Arrivals <span style="color:#F9D5E0">Just Landed!</span>', subtitle: 'Summer Collection 2024', description: 'Check out our latest products including new sprinkle mixes and fondant tools.', buttonText: 'View New', buttonLink: '/products?new=true', order: 2, enabled: true }
        ])
        console.log('✅ Created slider slides')

        // Create Settings
        console.log('Creating settings...')
        await Settings.create({
            announcementText: '🎂 Free Australia-Wide Shipping on Orders Over $149!',
            announcementEnabled: true,
            freeShippingEnabled: true,
            freeShippingThreshold: 149,
            shippingCost: 9.95,
            contactEmail: 'hello@decorabake.com.au',
            contactPhone: '1300 123 456'
        })
        console.log('✅ Created settings')

        // Create Testimonials
        console.log('Creating testimonials...')
        await Testimonial.insertMany([
            { name: 'Sarah Mitchell', location: 'Sydney, NSW', rating: 5, text: 'Absolutely love the quality of supplies from DecoraBake! The sprinkles are vibrant and the fondant tools are professional grade.', enabled: true },
            { name: 'Emma Thompson', location: 'Melbourne, VIC', rating: 5, text: 'Fast shipping and excellent customer service. The cake toppers I ordered were exactly as pictured. Will definitely order again!', enabled: true },
            { name: 'Jessica Williams', location: 'Brisbane, QLD', rating: 5, text: 'Best cake decorating store in Australia! Great variety and reasonable prices. My go-to shop for all my baking needs.', enabled: true }
        ])
        console.log('✅ Created testimonials')

        // Create Sections (for trust features and promo)
        console.log('Creating sections...')
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

        console.log('\n🎉 Seed completed successfully!')
        console.log('   - 6 categories')
        console.log('   - 12 products')
        console.log('   - 2 slider slides')
        console.log('   - 3 testimonials')
        console.log('   - 1 settings')
        console.log('   - 2 sections (trust-features, promo)')
        console.log('\n📝 Admin login: admin / admin123')

        process.exit(0)
    } catch (error) {
        console.error('❌ Seed failed:', error.message)
        console.error(error)
        process.exit(1)
    }
}

seed()
