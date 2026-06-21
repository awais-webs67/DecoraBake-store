import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import { Settings } from '../models.js'

async function saveKeys() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB')

        let s = await Settings.findOne()
        if (!s) s = new Settings()

        s.qwenApiKey = process.env.QWEN_API_KEY || ''
        s.openRouterApiKey = process.env.OPENROUTER_API_KEY || ''

        await s.save()
        console.log('✓ Qwen and OpenRouter API keys saved to database settings')
        console.log('  Qwen configured:', !!s.qwenApiKey)
        console.log('  OpenRouter configured:', !!s.openRouterApiKey)
    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        await mongoose.disconnect()
    }
}

saveKeys()
