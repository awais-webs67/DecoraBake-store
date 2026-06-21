import { useState, useEffect, useRef } from 'react'
import './ChatBot.css'
import API_BASE_URL from '../config/api'

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hi! 👋 Welcome to DecoraBake! I'm your AI assistant. How can I help you today?"
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [settings, setSettings] = useState({ chatbotEnabled: true })
    const [settingsLoaded, setSettingsLoaded] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                if (data) setSettings(prev => ({ ...prev, ...data }))
                setSettingsLoaded(true)
            })
            .catch(err => {
                console.error('Failed to load settings:', err)
                setSettingsLoaded(true)
            })
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (directMessage) => {
        const messageText = directMessage || inputValue
        if (!messageText.trim() || isLoading) return

        const userMessage = { id: Date.now(), type: 'user', text: messageText }
        setMessages(prev => [...prev, userMessage])
        const msgToSend = messageText
        setInputValue('')
        setIsLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgToSend })
            })
            const data = await response.json()
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: data.response || "I'm sorry, I couldn't process your request."
            }])
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: `I'm having trouble connecting. Please try again or contact us at ${settings.contactEmail || 'hello@decorabake.com.au'}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const openWhatsApp = () => {
        if (settings.whatsappNumber) {
            window.open(`https://wa.me/${settings.whatsappNumber}?text=Hi! I have a question about DecoraBake products.`, '_blank')
        }
    }

    const quickActions = [
        { label: '📦 Shipping', message: 'What are your shipping options?' },
        { label: '🎂 Products', message: 'What are your most popular products?' },
        { label: '💳 Payment', message: 'What payment methods do you accept?' },
        { label: '↩️ Returns', message: 'What is your return policy?' }
    ]

    // Hide if explicitly disabled
    if (settingsLoaded && settings.chatbotEnabled === false && !settings.whatsappEnabled) {
        return null
    }

    return (
        <div className={`chatbot ${isOpen ? 'chatbot--open' : ''}`}>
            {/* Single Toggle Button */}
            <button
                className="chatbot__toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                    </svg>
                )}
                {!isOpen && <span className="chatbot__badge">1</span>}
            </button>

            {/* Chat Window */}
            <div className="chatbot__window">
                <div className="chatbot__header">
                    <div className="chatbot__header-info">
                        <div className="chatbot__avatar">
                            <img src="/logo.png" alt="DecoraBake" />
                        </div>
                        <div>
                            <h4 className="chatbot__title">DecoraBake</h4>
                            <span className="chatbot__status">
                                <span className="chatbot__status-dot"></span>
                                Online
                            </span>
                        </div>
                    </div>
                    <div className="chatbot__header-actions">
                        {/* WhatsApp Button inside header */}
                        {settings.whatsappEnabled && settings.whatsappNumber && (
                            <button
                                className="chatbot__whatsapp-btn"
                                onClick={openWhatsApp}
                                title="Chat on WhatsApp"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                WhatsApp
                            </button>
                        )}
                        <button
                            className="chatbot__close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="chatbot__messages">
                    {messages.map(message => (
                        <div key={message.id} className={`chatbot__message chatbot__message--${message.type}`}>
                            {message.type === 'bot' && <div className="chatbot__message-avatar">🎂</div>}
                            <div className="chatbot__message-content">
                                <p>{message.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chatbot__message chatbot__message--bot">
                            <div className="chatbot__message-avatar">🎂</div>
                            <div className="chatbot__message-content">
                                <div className="chatbot__typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length <= 2 && (
                    <div className="chatbot__quick-actions">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className="chatbot__quick-action"
                                onClick={() => sendMessage(action.message)}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="chatbot__input">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button onClick={sendMessage} disabled={!inputValue.trim() || isLoading} aria-label="Send message">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>

                <div className="chatbot__footer">
                    Powered by AI • DecoraBake
                </div>
            </div>
        </div>
    )
}

export default ChatBot
