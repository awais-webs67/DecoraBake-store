import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Settings } from '../models.js'

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

await mongoose.connect(process.env.MONGODB_URI)
console.log('Connected to MongoDB')

await Settings.findOneAndUpdate(
    {},
    {
        imagekitEnabled: true,
        imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    },
    { upsert: true }
)
console.log('✅ ImageKit keys saved to MongoDB Settings')
await mongoose.disconnect()
process.exit(0)
