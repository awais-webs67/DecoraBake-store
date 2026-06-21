import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import { User } from '../models.js'

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB')

        const email = 'rehanrajput5656@gmail.com'
        const password = 'Rehan5656@'

        let user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            console.log('User not found, creating new admin user...')
            user = new User({
                email: email.toLowerCase(),
                password,
                firstName: 'Rehan',
                lastName: 'Rajput',
                role: 'admin'
            })
        } else {
            console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`)
            console.log(`Current role: ${user.role}`)
            user.role = 'admin'
            user.password = password // triggers pre-save hook to hash it
        }

        await user.save()
        console.log('✓ User saved as admin successfully')
        console.log(`  Email: ${email}`)
        console.log(`  Password: ${password}`)
        console.log(`  Role: ${user.role}`)

    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        await mongoose.disconnect()
        console.log('Disconnected from MongoDB')
    }
}

makeAdmin()
