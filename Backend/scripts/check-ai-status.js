import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import { Settings } from '../models.js'

async function check() {
    await mongoose.connect(process.env.MONGODB_URI)
    const s = await Settings.findOne()

    console.log('=== API Keys in DB ===')
    console.log('geminiApiKey:', s?.geminiApiKey ? `SET (${s.geminiApiKey.substring(0,10)}...)` : 'NOT SET')
    console.log('qwenApiKey:', s?.qwenApiKey ? `SET (${s.qwenApiKey.substring(0,10)}...)` : 'NOT SET')
    console.log('openRouterApiKey:', s?.openRouterApiKey ? `SET (${s.openRouterApiKey.substring(0,10)}...)` : 'NOT SET')
    console.log('longcatApiKey:', s?.longcatApiKey ? `SET (${s.longcatApiKey.substring(0,10)}...)` : 'NOT SET')

    console.log('\n=== ENV Keys ===')
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `SET (${process.env.GEMINI_API_KEY.substring(0,10)}...)` : 'NOT SET')
    console.log('QWEN_API_KEY:', process.env.QWEN_API_KEY ? 'SET' : 'NOT SET')
    console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET')
    console.log('LONGCAT_API_KEY:', process.env.LONGCAT_API_KEY ? 'SET' : 'NOT SET')

    console.log('\n=== Testing OpenRouter directly ===')
    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${s?.openRouterApiKey || process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://decorabake.com.au',
                'X-Title': 'DecoraBake'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [{ role: 'user', content: 'Say ok' }],
                max_tokens: 10
            })
        })
        const data = await res.json()
        console.log('OpenRouter response:', JSON.stringify(data).substring(0, 400))
    } catch (e) {
        console.log('OpenRouter error:', e.message)
    }

    await mongoose.disconnect()
}

check()
