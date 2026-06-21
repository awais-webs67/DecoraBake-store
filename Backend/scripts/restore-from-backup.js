// Restore from Backup Script - Imports backup-2026-02-19.json into MongoDB
// This will clear existing data and replace with backup data
// Run with: node restore-from-backup.js
import mongoose from 'mongoose'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })
const MONGODB_URI = process.env.MONGODB_URI
// Map backup keys to MongoDB collection names
const COLLECTION_MAP = {
    'Users': 'users',
    'Products': 'products',
    'Categories': 'categories',
    'Orders': 'orders',
    'Testimonials': 'testimonials',
    'Settings': 'settings',
    'Sliders': 'sliders',
    'Pages': 'pages',
    'PromoCodes': 'promocodes',
    'Subscribers': 'subscribers',
    'Reviews': 'reviews',
    'Sections': 'sections',
    'Refunds': 'refunds',
    'SupportChats': 'supportchats',
    'EmailTemplates': 'emailtemplates',
    'EmailCampaigns': 'emailcampaigns',
    'Carts': 'carts'
}
async function restore() {
    try {
        // Read backup file
        const backupPath = './backups/backup-2026-02-19.json'
        if (!fs.existsSync(backupPath)) {
            console.error('❌ Backup file not found:', backupPath)
            process.exit(1)
        }
        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
        console.log('📁 Loaded backup file')
        console.log('   Collections found:', Object.keys(backup).join(', '))
        await mongoose.connect(MONGODB_URI)
        console.log('✅ Connected to MongoDB\n')
        const db = mongoose.connection.db
        for (const [backupKey, collectionName] of Object.entries(COLLECTION_MAP)) {
            if (!backup[backupKey]) {
                console.log(`⏭️  ${backupKey}: Not in backup, skipping`)
                continue
            }
            const data = backup[backupKey]
            const collection = db.collection(collectionName)
            // Handle Settings specially (it's an object, not array)
            if (backupKey === 'Settings' && !Array.isArray(data)) {
                await collection.deleteMany({})
                await collection.insertOne(data)
                console.log(`✅ ${backupKey}: Restored (1 document)`)
                continue
            }
            if (!Array.isArray(data)) {
                // Wrap single object in array
                await collection.deleteMany({})
                await collection.insertOne(data)
                console.log(`✅ ${backupKey}: Restored (1 document)`)
                continue
            }
            if (data.length === 0) {
                console.log(`⏭️  ${backupKey}: Empty in backup, skipping`)
                continue
            }
            // Clear and restore
            await collection.deleteMany({})
            await collection.insertMany(data)
            console.log(`✅ ${backupKey}: Restored (${data.length} documents)`)
        }
        console.log('\n' + '='.repeat(50))
        console.log('✅ FULL DATABASE RESTORE COMPLETE!')
        console.log('='.repeat(50))
        console.log('\n🔄 Please restart your backend server (Ctrl+C, then npm run dev)')
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
        process.exit(0)
    } catch (error) {
        console.error('❌ Restore failed:', error.message)
        process.exit(1)
    }
}
restore()
