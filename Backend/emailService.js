import nodemailer from 'nodemailer'
import { EmailTemplate } from './models.js'

const BRAND = { primary: '#6B2346', dark: '#4A1830', accent: '#E8A0BF', bg: '#F9FAFB', text: '#1F2937', muted: '#6B7280' }

// ── Transporter ─────────────────────────────────────────
export async function createTransporter(settings) {
    if (!settings.emailEnabled || !settings.smtpHost || !settings.smtpUser) return null
    const port = parseInt(settings.smtpPort) || 587
    const host = settings.smtpHost.toLowerCase().trim()
    if (host === 'smtp.gmail.com') return nodemailer.createTransport({ service: 'gmail', auth: { user: settings.smtpUser, pass: settings.smtpPassword } })
    if (host.includes('office365') || host.includes('outlook') || host.includes('hotmail')) return nodemailer.createTransport({ service: 'hotmail', auth: { user: settings.smtpUser, pass: settings.smtpPassword } })
    return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: settings.smtpUser, pass: settings.smtpPassword }, tls: { rejectUnauthorized: false }, connectionTimeout: 15000 })
}

async function sendEmail(transporter, settings, to, subject, html) {
    if (!transporter) { console.log('Email not configured, skipping:', subject); return false }
    try {
        await transporter.sendMail({ from: `"${settings.emailFromName || 'DecoraBake'}" <${settings.emailFrom || settings.smtpUser}>`, to, subject, html })
        console.log('Email sent:', subject, 'to', to)
        return true
    } catch (err) { console.error('Email error:', err.message); return false }
}

// ── Template Parts ───────────────────────────────────────
function btn(text, url, bg = BRAND.primary) {
    return `<table cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="border-radius:50px;background:${bg};box-shadow:0 4px 6px rgba(0,0,0,0.1);"><a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;border-radius:50px;letter-spacing:0.5px;">${text}</a></td></tr></table>`
}
function badge(text, bg, color) {
    return `<span style="display:inline-block;padding:6px 16px;background:${bg};color:${color};border-radius:100px;font-size:12px;font-weight:700;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">${text}</span>`
}
function divider() { return `<tr><td><div style="border-top:1px solid #E5E7EB;margin:32px 0;"></div></td></tr>` }

// ── 4-Step Order Progress Bar ────────────────────────────
function renderProgressBar(currentStatus) {
    const steps = [
        { key: 'pending', label: 'Ordered', icon: '1' },
        { key: 'processing', label: 'Processing', icon: '2' },
        { key: 'shipped', label: 'Shipped', icon: '3' },
        { key: 'delivered', label: 'Delivered', icon: '4' }
    ]
    const statusOrder = { pending: 0, confirmed: 0, processing: 1, shipped: 2, delivered: 3 }
    const currentIdx = statusOrder[currentStatus] ?? 0

    const stepHtml = steps.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        const cirBg = done ? BRAND.primary : '#E5E7EB'
        const cirCol = done ? '#ffffff' : '#9CA3AF'
        const lblCol = active ? BRAND.primary : (done ? '#374151' : '#9CA3AF')
        const lblWgt = active ? '700' : '500'
        const connector = i < steps.length - 1
            ? `<td style="width:100%;vertical-align:top;padding-top:14px;"><div style="height:2px;background:${i < currentIdx ? BRAND.primary : '#E5E7EB'};margin:0 2px;"></div></td>`
            : ''
        return `<td style="text-align:center;vertical-align:top;width:60px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${cirBg};color:${cirCol};font-size:12px;font-weight:700;line-height:28px;margin:0 auto 8px;font-family:Arial,sans-serif;">${done && i < currentIdx ? '✓' : step.icon}</div>
            <div style="font-size:10px;color:${lblCol};font-weight:${lblWgt};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">${step.label}</div>
        </td>${connector}`
    }).join('')

    return `<tr><td style="padding:0 0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>${stepHtml}</tr></table>
    </td></tr>`
}

// ── Email Wrapper ────────────────────────────────────────
function emailWrapper(settings, title, bodyRows, progressStatus = null) {
    const siteName = settings.siteName || 'DecoraBake'
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`
    const frontendUrl = settings.frontendUrl || settings.siteUrl || process.env.FRONTEND_URL || 'https://decorabake.com.au'
    let logoUrl = ''
    if (!settings.emailShowTextLogo) {
        const potentialLogo = settings.emailLogo || settings.siteLogo
        if (potentialLogo) {
            logoUrl = potentialLogo.startsWith('http') ? potentialLogo : `${backendUrl}${potentialLogo.startsWith('/') ? '' : '/'}${potentialLogo}`
        }
    }
    const footerEmail = settings.emailFooterEmail || settings.contactEmail || 'hello@decorabake.com.au'
    const footerAddress = settings.emailFooterText || settings.address || 'Sydney, NSW, Australia'
    const progressHtml = progressStatus ? renderProgressBar(progressStatus) : ''

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>${title}</title>
        <!--[if mso]>
        <noscript>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
        </noscript>
        <![endif]-->
        <style>
            @media only screen and (max-width: 620px) {
                .email-container { width: 100% !important; border-radius: 0 !important; }
                .content-cell { padding: 32px 24px !important; }
            }
        </style>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
            <tr><td align="center">
                <table class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);border:1px solid #e5e7eb;">
                    
                    <!-- HEADER -->
                    <tr><td style="padding:28px 0 20px;text-align:center;background:#ffffff;border-bottom:1px solid #F3F4F6;">
                        ${logoUrl
            ? `<img src="${logoUrl}" alt="${siteName}" style="max-height:80px;max-width:220px;object-fit:contain;display:block;margin:0 auto;" />`
            : `<div style="font-size:26px;font-weight:800;color:${BRAND.primary};letter-spacing:-0.5px;font-family:'Playfair Display',Georgia,serif;">${siteName}</div>`
        }
                    </td></tr>
                    
                    <!-- BODY -->
                    <tr><td class="content-cell" style="padding:32px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            ${progressHtml}
                            ${bodyRows}
                        </table>
                    </td></tr>
                    
                    <!-- FOOTER -->
                    <tr><td style="padding:24px 32px;background:#F9FAFB;border-top:1px solid #F3F4F6;text-align:center;">
                        <div style="margin-bottom:20px;">
                            <a href="${frontendUrl}" style="color:${BRAND.primary};font-weight:700;text-decoration:none;font-size:14px;">${siteName}</a>
                        </div>
                        <div style="margin-bottom:24px;">
                            <a href="${frontendUrl}/products" style="color:${BRAND.muted};text-decoration:none;font-size:12px;margin:0 12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Shop</a>
                            <a href="mailto:${footerEmail}" style="color:${BRAND.muted};text-decoration:none;font-size:12px;margin:0 12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Contact Us</a>
                            <a href="${frontendUrl}/contact" style="color:${BRAND.muted};text-decoration:none;font-size:12px;margin:0 12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Help</a>
                        </div>
                        <p style="color:#9CA3AF;font-size:11px;line-height:1.6;margin:0;">
                            ${footerAddress}<br>
                            &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
                        </p>
                    </td></tr>
                    
                </table>
                <div style="height:24px;"></div>
            </td></tr>
        </table>
    </body>
    </html>`
}

// ── Row Helpers ──────────────────────────────────────────
function rowHeading(text) {
    return `<tr><td style="padding-bottom:16px;text-align:center;"><h1 style="font-size:24px;color:${BRAND.text};margin:0;font-weight:800;letter-spacing:-0.5px;line-height:1.3;font-family:'Playfair Display',Georgia,serif;">${text}</h1></td></tr>`
}
function rowText(text) {
    return `<tr><td style="padding-bottom:24px;font-size:15px;color:${BRAND.text};line-height:1.6;text-align:left;">${text}</td></tr>`
}
function rowBox(innerHtml, bg = '#F9FAFB', border = '#F3F4F6') {
    return `<tr><td style="padding-bottom:24px;"><div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:24px;">${innerHtml}</div></td></tr>`
}

// ── Generators ───────────────────────────────────────────
function generateOrderConfirmationHtml(settings, order) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const orderNum = order.orderId || order.orderNumber || order._id?.toString().slice(-8).toUpperCase()
    const itemsHtml = order.items.map(item => `
        <tr style="border-bottom:1px solid #E5E7EB;">
            <td style="padding:12px 0;font-size:14px;color:${BRAND.text};font-weight:600;">${item.name}<div style="font-size:12px;color:${BRAND.muted};font-weight:400;margin-top:2px;">Qty: ${item.quantity}</div></td>
            <td style="padding:12px 0;text-align:right;font-size:14px;font-weight:700;color:${BRAND.text};">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`).join('')

    const rows = [
        rowHeading('Order Confirmed!'),
        rowText(`Hi <strong>${order.customer?.name || 'Customer'}</strong>, thank you for your order! We've received it and will start processing it right away.`),
        rowBox(`
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td colspan="2" style="padding-bottom:16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.muted};font-weight:700;">Order Details</td></tr>
                <tr><td style="font-size:14px;color:${BRAND.muted};padding:4px 0;">Order Number</td><td style="text-align:right;font-weight:700;color:${BRAND.text};font-size:14px;">#${orderNum}</td></tr>
                <tr><td style="font-size:14px;color:${BRAND.muted};padding:4px 0;">Date</td><td style="text-align:right;color:${BRAND.text};font-size:14px;">${new Date(order.createdAt).toLocaleDateString()}</td></tr>
                <tr><td style="font-size:14px;color:${BRAND.muted};padding:4px 0;">Payment</td><td style="text-align:right;color:${BRAND.text};font-size:14px;">${order.paymentMethod === 'card' ? 'Credit/Debit Card' : (order.paymentMethod || 'Stripe')}</td></tr>
            </table>`),
        `<tr><td style="padding:24px 0 12px;"><h3 style="font-size:15px;font-weight:700;color:${BRAND.text};margin:0;">Items Ordered</h3></td></tr>`,
        `<tr><td style="padding-bottom:16px;"><table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table></td></tr>`,
        `<tr><td style="padding-bottom:24px;"><div style="background:#F9FAFB;border-radius:12px;padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.muted};">Subtotal</td><td style="text-align:right;font-size:14px;color:${BRAND.text};">$${(order.subtotal || order.total).toFixed(2)}</td></tr>
                ${order.discount ? `<tr><td style="padding:6px 0;font-size:14px;color:#059669;">Discount</td><td style="text-align:right;font-size:14px;color:#059669;">-$${order.discount.toFixed(2)}</td></tr>` : ''}
                <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.muted};">Shipping</td><td style="text-align:right;font-size:14px;color:${BRAND.text};">${!order.shippingCost ? '<span style="color:#059669;font-weight:700;">FREE</span>' : `$${(order.shippingCost || 0).toFixed(2)}`}</td></tr>
                <tr style="border-top:1px solid #E5E7EB;"><td style="padding-top:12px;font-size:16px;font-weight:800;color:${BRAND.text};">Total</td><td style="text-align:right;font-size:18px;font-weight:800;color:${BRAND.primary};padding-top:12px;">$${order.total.toFixed(2)}</td></tr>
            </table></div></td></tr>`,
        order.shippingAddress ? `<tr><td style="padding-bottom:24px;"><h3 style="font-size:14px;font-weight:700;color:${BRAND.text};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Shipping Address</h3><div style="font-size:14px;color:${BRAND.muted};line-height:1.6;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;">${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}<br>${order.shippingAddress.address || ''}<br>${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.postcode || ''}<br>${order.shippingAddress.country || 'Australia'}</div></td></tr>` : '',
        `<tr><td>${btn('View My Order', `${frontendUrl}/account`)}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'Order Confirmation', rows, 'pending')
}

function generateWelcomeHtml(settings, user) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const siteName = settings.siteName || 'DecoraBake'
    const rows = [
        rowHeading(`Welcome to ${siteName}!`),
        rowText(`Hi <strong>${user.firstName || user.name || 'Baker'}</strong>, we're thrilled to have you join our community! You can now explore our premium range of baking and decorating supplies.`),
        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            ${[['🛍️', 'Premium Supplies', 'Browse our curated collection.'], ['💡', 'Expert Tips', 'Get decorating advice & guides.'], ['⚡', 'Fast Shipping', 'Australia-wide delivery.']].map(([icon, title, desc]) => `<tr><td style="padding:12px 0;vertical-align:top;width:40px;font-size:20px;">${icon}</td><td style="padding:12px 0;"><div style="font-weight:700;font-size:15px;color:${BRAND.text};">${title}</div><div style="font-size:13px;color:${BRAND.muted};margin-top:2px;line-height:1.4;">${desc}</div></td></tr>`).join('')}
        </table>`),
        `<tr><td>${btn('Start Shopping', `${frontendUrl}/products`)}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'Welcome', rows)
}

function generateShippingHtml(settings, order, trackingNumber) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const orderNum = order.orderId || order.orderNumber || order._id?.toString().slice(-8).toUpperCase()
    const rows = [
        rowHeading('Your Order Has Shipped!'),
        rowText(`Great news, <strong>${order.customer?.name || 'Customer'}</strong>! Your order <strong>#${orderNum}</strong> is on its way.`),
        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:13px;color:${BRAND.text};padding:6px 0;">Order Number</td><td style="text-align:right;font-weight:700;color:${BRAND.text};">#${orderNum}</td></tr>
            <tr><td style="font-size:13px;color:${BRAND.text};padding:6px 0;">Status</td><td style="text-align:right;">${badge('In Transit', '#DBEAFE', '#1E40AF')}</td></tr>
            <tr><td style="font-size:13px;color:${BRAND.text};padding:6px 0;">Tracking</td><td style="text-align:right;font-weight:700;color:${BRAND.text};">${trackingNumber || 'Pending'}</td></tr>
        </table>`),
        `<tr><td style="text-align:center;padding-bottom:24px;"><div style="font-size:12px;color:${BRAND.muted};background:#F3F4F6;display:inline-block;padding:8px 16px;border-radius:100px;">Estimated delivery: 3–5 business days</div></td></tr>`,
        trackingNumber ? `<tr><td>${btn('Track Package', `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`)}</td></tr>` : '',
        `<tr><td>${btn('View My Order', `${frontendUrl}/account`, 'transparent', '#6B2346')}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'Shipping Notification', rows, 'shipped')
}

function generateOrderStatusHtml(settings, order, status, shippingData) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const orderNum = order.orderId || order.orderNumber || order._id?.toString().slice(-8).toUpperCase()
    const statusMap = {
        pending: { title: 'Order Received', emoji: '✅', msg: 'Your order has been placed and is awaiting processing.', bg: '#F0FDF4', color: '#166534', badgeBg: '#BBF7D0', badgeColor: '#166534' },
        confirmed: { title: 'Order Confirmed', emoji: '✅', msg: 'Your order has been confirmed and will be shipped soon.', bg: '#F0FDF4', color: '#166534', badgeBg: '#BBF7D0', badgeColor: '#166534' },
        processing: { title: 'Order Processing', emoji: '⚙️', msg: 'Our team is preparing your items for dispatch.', bg: '#FFFBEB', color: '#92400E', badgeBg: '#FDE68A', badgeColor: '#92400E' },
        shipped: { title: 'Order Shipped', emoji: '📦', msg: 'Your order is on its way! Track using the button below.', bg: '#EFF6FF', color: '#1E40AF', badgeBg: '#BFDBFE', badgeColor: '#1E40AF' },
        delivered: { title: 'Order Delivered', emoji: '🏠', msg: 'Your order has been delivered. Enjoy your new supplies!', bg: '#F0FDF4', color: '#166534', badgeBg: '#BBF7D0', badgeColor: '#166534' },
        cancelled: { title: 'Order Cancelled', emoji: '❌', msg: 'Your order has been cancelled. Contact us if you have questions.', bg: '#FFF1F2', color: '#9F1239', badgeBg: '#FECDD3', badgeColor: '#9F1239' }
    }
    const cfg = statusMap[status] || statusMap.processing
    const rows = [
        rowHeading(`${cfg.title}`),
        rowText(`Hi <strong>${order.customer?.name || 'Customer'}</strong>, your order <strong>#${orderNum}</strong> has been updated.`),
        rowBox(`<div style="text-align:center;padding:8px 0;">
            ${badge(cfg.title, cfg.badgeBg, cfg.badgeColor)}
            <p style="font-size:15px;color:${BRAND.text};margin:16px 0 0;font-weight:600;">${cfg.msg}</p>
        </div>`),
        `<tr><td style="padding-bottom:24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:14px;color:${BRAND.muted};padding:6px 0;">Order Number</td><td style="text-align:right;font-weight:700;color:${BRAND.text};">#${orderNum}</td></tr>
            <tr><td style="font-size:14px;color:${BRAND.muted};padding:6px 0;">Order Total</td><td style="text-align:right;font-weight:700;color:${BRAND.primary};">$${order.total.toFixed(2)}</td></tr>
        </table></td></tr>`,
        shippingData?.trackingNumber ? `<tr><td>${btn('Track Package', `https://auspost.com.au/mypost/track/#/details/${shippingData.trackingNumber}`)}</td></tr>` : '',
        `<tr><td>${btn('View My Order', `${frontendUrl}/account`)}</td></tr>`
    ].join('')
    return emailWrapper(settings, cfg.title, rows, status)
}

function generateRefundStatusHtml(settings, refund, status) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const refundId = refund._id?.toString().slice(-8).toUpperCase()
    const amount = (refund.amount || 0).toFixed(2)
    const statusMap = {
        pending: { title: 'Refund Request Received', bg: '#FFFBEB', color: '#92400E', badgeBg: '#FDE68A' },
        reviewing: { title: 'Refund Under Review', bg: '#EFF6FF', color: '#1E40AF', badgeBg: '#BFDBFE' },
        approved: { title: 'Refund Approved', bg: '#F0FDF4', color: '#166534', badgeBg: '#BBF7D0' },
        denied: { title: 'Refund Declined', bg: '#FFF1F2', color: '#9F1239', badgeBg: '#FECDD3' },
        completed: { title: 'Refund Completed', bg: '#F0FDF4', color: '#166534', badgeBg: '#BBF7D0' },
        processed: { title: 'Refund Processed', bg: '#F0FDF4', color: '#166534', badgeBg: '#BBF7D0' } // Fallback
    }
    const cfg = statusMap[status] || statusMap.pending
    const rows = [
        rowHeading(cfg.title),
        rowText(status === 'approved' || status === 'completed' ? `Your refund of <strong>$${amount}</strong> has been ${status === 'completed' ? 'processed.' : 'approved.'}` : `We've received your refund request for Order #${refund.order?.orderId || refund.orderId || refund.order?.orderNumber || 'N/A'}.`),
        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:14px;color:${BRAND.text};padding:6px 0;">Refund ID</td><td style="text-align:right;font-weight:700;color:${BRAND.text};">#${refundId}</td></tr>
            <tr><td style="font-size:14px;color:${BRAND.text};padding:6px 0;">Amount</td><td style="text-align:right;font-weight:800;font-size:16px;color:${BRAND.primary};">$${amount}</td></tr>
            <tr><td style="font-size:14px;color:${BRAND.text};padding:6px 0;">Status</td><td style="text-align:right;">${badge(cfg.title.replace('Refund ', ''), cfg.badgeBg, cfg.color)}</td></tr>
        </table>`),
        refund.reason ? `<tr><td style="padding-bottom:24px;"><h3 style="font-size:14px;font-weight:700;color:${BRAND.text};margin:0 0 12px;">Reason</h3><p style="font-size:14px;color:${BRAND.muted};background:#F9FAFB;padding:16px;border-radius:12px;margin:0;line-height:1.6;">${refund.reason}</p></td></tr>` : '',
        `<tr><td>${btn('View My Account', `${frontendUrl}/account`)}</td></tr>`
    ].join('')
    return emailWrapper(settings, cfg.title, rows)
}

function generateAdminOrderHtml(settings, order) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const orderNum = order.orderId || order.orderNumber || order._id?.toString().slice(-8).toUpperCase()
    const itemsHtml = order.items?.map(i => `<tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-size:14px;">${i.name} × ${i.quantity}</td><td style="text-align:right;padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:700;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('') || ''

    const isBankTransfer = order.paymentMethod === 'bank_transfer'
    const paymentLabel = isBankTransfer ? '🏦 Bank Transfer' : '💳 Stripe (Online)'
    const paymentStatusColor = order.paymentStatus === 'paid' ? '#16A34A' : order.paymentStatus === 'failed' ? '#DC2626' : '#D97706'
    const paymentStatusBg = order.paymentStatus === 'paid' ? '#DCFCE7' : order.paymentStatus === 'failed' ? '#FEE2E2' : '#FEF9C3'
    const paymentStatusText = (order.paymentStatus || 'pending').toUpperCase()

    const receiptBlock = (isBankTransfer && order.bankReceiptUrl)
        ? `<tr><td style="padding-bottom:24px;">
            <p style="font-size:13px;font-weight:700;color:#92400E;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">Payment Receipt Uploaded</p>
            <a href="${order.bankReceiptUrl}" target="_blank" style="display:block;">
              <img src="${order.bankReceiptUrl}" alt="Payment Receipt" style="max-width:100%;border-radius:8px;border:2px solid #FDE68A;display:block;" />
            </a>
            <a href="${order.bankReceiptUrl}" target="_blank" style="display:inline-block;margin-top:10px;font-size:13px;color:#1E40AF;font-weight:600;">View Full Receipt →</a>
          </td></tr>`
        : isBankTransfer
        ? `<tr><td style="padding-bottom:16px;"><p style="background:#FEF9C3;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400E;margin:0;">⚠️ No payment receipt uploaded yet. Waiting for customer to upload proof of payment.</p></td></tr>`
        : ''

    const rows = [
        rowHeading('🛒 New Order Received!'),
        rowText(`A new order has been placed on your store. <strong>Action required</strong> — review and process below.`),
        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            <tr><td colspan="2" style="padding-bottom:12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#1E40AF;font-weight:700;">Order Summary</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Order #</td><td style="text-align:right;font-weight:700;font-size:15px;color:#6B2346;">${orderNum}</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Customer</td><td style="text-align:right;">${order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Guest'}</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Email</td><td style="text-align:right;">${order.customer?.email || '-'}</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Phone</td><td style="text-align:right;">${order.customer?.phone || '-'}</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Items</td><td style="text-align:right;">${order.items?.length || 0} items</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Shipping</td><td style="text-align:right;">${order.shippingCost === 0 ? 'Free' : `$${(order.shippingCost || 0).toFixed(2)}`}</td></tr>
            ${order.promoCode ? `<tr><td style="font-size:14px;padding:6px 0;color:#16A34A;">Promo (${order.promoCode})</td><td style="text-align:right;color:#16A34A;">-$${(order.promoDiscount || 0).toFixed(2)}</td></tr>` : ''}
            <tr><td style="font-size:14px;font-weight:700;padding-top:10px;border-top:2px solid #E5E7EB;">Total (AUD)</td><td style="text-align:right;font-size:20px;font-weight:700;padding-top:10px;border-top:2px solid #E5E7EB;color:#6B2346;">$${(order.total || 0).toFixed(2)}</td></tr>
        </table>`, '#F0F9FF', '#BAE6FD'),

        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            <tr><td colspan="2" style="padding-bottom:12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5B21B6;font-weight:700;">Payment Information</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Method</td><td style="text-align:right;font-weight:700;">${paymentLabel}</td></tr>
            <tr><td style="font-size:14px;padding:6px 0;">Status</td><td style="text-align:right;"><span style="background:${paymentStatusBg};color:${paymentStatusColor};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;">${paymentStatusText}</span></td></tr>
            ${order.stripeSessionId ? `<tr><td style="font-size:13px;padding:6px 0;color:#888;">Stripe Session</td><td style="text-align:right;font-size:12px;color:#888;word-break:break-all;">${order.stripeSessionId}</td></tr>` : ''}
        </table>`, '#FAF5FF', '#DDD6FE'),

        `<tr><td style="padding-bottom:16px;"><p style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#374151;margin:0 0 10px;">Items Ordered</p><table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table></td></tr>`,
        receiptBlock,
        `<tr><td style="padding-bottom:24px;">
            ${order.shipping ? `<p style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#374151;margin:0 0 8px;">Ship to</p>
            <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">${order.shipping.address || ''}<br/>${order.shipping.city || ''}, ${order.shipping.state || ''} ${order.shipping.postcode || ''}</p>` : ''}
        </td></tr>`,
        `<tr><td>${btn('View Order in Admin Panel', `${frontendUrl}/admin/orders`, '#6B2346')}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'New Order', rows)
}

function generateAdminRefundHtml(settings, refund) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const rows = [
        rowHeading('New Refund Request'),
        rowText('A customer has submitted a refund request.'),
        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:14px;color:#92400E;padding:6px 0;">Order</td><td style="text-align:right;font-weight:700;color:#92400E;">#${refund.order?.orderId || refund.orderId || refund.order?.orderNumber || 'N/A'}</td></tr>
            <tr><td style="font-size:14px;color:#92400E;padding:6px 0;">Customer</td><td style="text-align:right;color:#92400E;">${refund.order?.customer?.name || refund.customerName || refund.customer?.firstName || 'N/A'}</td></tr>
            <tr><td style="font-size:14px;font-weight:800;color:#92400E;padding-top:12px;border-top:1px solid #FDE68A;">Amount</td><td style="text-align:right;font-size:20px;font-weight:800;color:#92400E;padding-top:12px;border-top:1px solid #FDE68A;">$${(refund.amount || 0).toFixed(2)}</td></tr>
        </table>`, '#FFFBEB', '#FDE68A'),
        refund.reason ? `<tr><td style="padding-bottom:24px;"><p style="font-size:14px;background:#F9FAFB;padding:16px;border-radius:12px;margin:0;"><strong>Reason:</strong> ${refund.reason}</p></td></tr>` : '',
        `<tr><td>${btn('Review Refund', `${frontendUrl}/admin/refunds`, '#D97706')}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'Refund Request', rows)
}

function generateRefundMessageHtml(settings, refund, message) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const refundId = refund._id?.toString().slice(-8).toUpperCase()
    const rows = [
        rowHeading('New Message'),
        rowText('Our support team has sent you a message regarding your refund request.'),
        `<tr><td style="padding-bottom:24px;"><div style="background:#F9FAFB;border-left:4px solid ${BRAND.primary};padding:24px;border-radius:0 12px 12px 0;"><p style="font-size:15px;color:${BRAND.text};margin:0;">${message}</p></div></td></tr>`,
        `<tr><td>${btn('View My Account', `${frontendUrl}/account`)}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'Refund Message', rows)
}

function generateContactFormHtml(settings, { name, subject, message }) {
    const rows = [
        rowHeading('Thanks for reaching out!'),
        rowText(`Hi <strong>${name}</strong>, we've received your message and will get back to you soon.`),
        rowBox(`<p style="font-size:15px;color:${BRAND.text};margin:0;">${message}</p>`)
    ].join('')
    return emailWrapper(settings, 'Contact Confirmation', rows)
}

function generateAdminContactHtml(settings, { name, email, phone, subject, message }) {
    const rows = [
        rowHeading('New Contact Submission'),
        rowBox(`<table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:13px;padding:6px 0;">Name</td><td style="text-align:right;">${name}</td></tr>
            <tr><td style="font-size:13px;padding:6px 0;">Email</td><td style="text-align:right;">${email}</td></tr>
            ${phone ? `<tr><td style="font-size:13px;padding:6px 0;">Phone</td><td style="text-align:right;">${phone}</td></tr>` : ''}
            <tr><td style="font-size:13px;padding:6px 0;">Subject</td><td style="text-align:right;font-weight:700;">${subject}</td></tr>
        </table>`, '#EFF6FF', '#BFDBFE'),
        `<tr><td style="padding-bottom:12px;"><p style="background:#F9FAFB;padding:16px;border-radius:12px;margin:0;">${message}</p></td></tr>`
    ].join('')
    return emailWrapper(settings, `Contact: ${subject}`, rows)
}

function generateNewsletterHtml(settings, content) {
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || ''
    const rows = [
        `<tr><td style="padding-bottom:32px;font-size:16px;color:${BRAND.text};">${content}</td></tr>`,
        `<tr><td>${btn('Shop Now', `${frontendUrl}/products`)}</td></tr>`
    ].join('')
    return emailWrapper(settings, 'Newsletter', rows)
}

// ── Sending Functions ────────────────────────────────────
export async function sendOrderConfirmation(settings, order) {
    if (!settings.sendOrderConfirmation) return false
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateOrderConfirmationHtml(settings, order)
    return sendEmail(transporter, settings, order.customer?.email || order.email, `Order Confirmed #${order.orderId || order.orderNumber || order._id}`, html)
}

export async function sendWelcomeEmail(settings, user) {
    if (!settings.sendWelcomeEmail) return false
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateWelcomeHtml(settings, user)
    return sendEmail(transporter, settings, user.email, `Welcome to ${settings.siteName || 'DecoraBake'}!`, html)
}

export async function sendShippingNotification(settings, order, trackingNumber = '') {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateShippingHtml(settings, order, trackingNumber)
    return sendEmail(transporter, settings, order.customer?.email || order.email, `Order Shipped #${order.orderId || order.orderNumber || order._id}`, html)
}

export async function sendOrderStatusEmail(settings, order, status, shippingData = {}) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateOrderStatusHtml(settings, order, status, shippingData)
    return sendEmail(transporter, settings, order.customer?.email || order.email, `Order Updated #${order.orderId || order.orderNumber || order._id}`, html)
}

export async function sendRefundStatusEmail(settings, refund, status) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateRefundStatusHtml(settings, refund, status)
    return sendEmail(transporter, settings, refund.customer?.email || refund.order?.customer?.email || refund.email, `Refund Status`, html)
}

export async function sendRefundMessageEmail(settings, refund, message) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateRefundMessageHtml(settings, refund, message)
    return sendEmail(transporter, settings, refund.customer?.email || refund.customerEmail, `Refund Message`, html)
}

export async function sendAdminOrderNotification(settings, order) {
    const adminTo = settings.adminNotificationEmail || settings.adminEmail
    if (!adminTo) return false
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateAdminOrderHtml(settings, order)
    const isUpdate = order.paymentMethod === 'bank_transfer' && order.bankReceiptUrl
    const subject = isUpdate 
        ? `Receipt Uploaded for Order #${order.orderId || order.orderNumber || 'N/A'}`
        : `New Order #${order.orderId || order.orderNumber || 'N/A'}`
    return sendEmail(transporter, settings, adminTo, subject, html)
}

export async function sendAdminRefundNotification(settings, refund) {
    const adminTo = settings.adminNotificationEmail || settings.adminEmail
    if (!adminTo) return false
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateAdminRefundHtml(settings, refund)
    return sendEmail(transporter, settings, adminTo, `Refund Request`, html)
}

export async function sendContactFormEmail(settings, data) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateContactFormHtml(settings, data)
    return sendEmail(transporter, settings, data.email, `Contact Confirmation`, html)
}

export async function sendAdminContactNotification(settings, data) {
    const adminTo = settings.adminNotificationEmail || settings.adminEmail
    if (!adminTo) return false
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateAdminContactHtml(settings, data)
    return sendEmail(transporter, settings, adminTo, `New Contact: ${data.subject}`, html)
}

export async function sendNewsletterEmail(settings, recipientEmail, subject, htmlContent) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    const html = generateNewsletterHtml(settings, htmlContent)
    return sendEmail(transporter, settings, recipientEmail, subject, html)
}



// Generic email sender (used for password reset, etc.)
export async function sendGenericEmail(settings, { to, subject, html }) {
    const transporter = await createTransporter(settings)
    if (!transporter) return false
    return sendEmail(transporter, settings, to, subject, html)
}

export async function testEmailConnection(settings) {
    const transporter = await createTransporter(settings)
    if (!transporter) return { success: false, error: 'Email not configured' }
    try { await transporter.verify(); return { success: true, message: 'Connection successful!' } }
    catch (err) { return { success: false, error: err.message } }
}

// ── Template Preview (Using ACTUAL logic) ────────────────
export async function renderTemplatePreview(settings, templateId) {
    const mockOrder = {
        orderId: 'DB-2024-TEST',
        total: 85.90, subtotal: 65.95, shippingCost: 19.95, discount: 0,
        customer: { name: 'John Doe', email: 'john@example.com' },
        createdAt: new Date(), paymentMethod: 'card',
        items: [{ name: 'Premium Cake Flour', quantity: 2, price: 12.50 }, { name: 'Gold Dust 50g', quantity: 1, price: 40.95 }],
        shippingAddress: { firstName: 'John', lastName: 'Doe', address: '123 Bakery Lane', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia' }
    }
    const mockRefund = {
        _id: 'REF-TEST', amount: 40.95, reason: 'Item arrived damaged', status: 'pending',
        order: mockOrder, customer: mockOrder.customer
    }

    // Direct mapping to generators
    switch (templateId) {
        case 'order-confirmation': return generateOrderConfirmationHtml(settings, mockOrder)
        case 'welcome': return generateWelcomeHtml(settings, { firstName: 'John', email: 'john@example.com' })
        case 'shipping-notification': return generateShippingHtml(settings, mockOrder, 'AUS-TRACK-123')
        case 'order-status': return generateOrderStatusHtml(settings, mockOrder, 'processing')
        case 'admin-order': return generateAdminOrderHtml(settings, mockOrder)
        case 'refund-pending': return generateRefundStatusHtml(settings, mockRefund, 'pending')
        case 'refund-approved': return generateRefundStatusHtml(settings, mockRefund, 'approved')
        case 'admin-refund': return generateAdminRefundHtml(settings, mockRefund)
        case 'refund-message': return generateRefundMessageHtml(settings, mockRefund, 'Please verify your bank details.')
        case 'contact-confirmation': return generateContactFormHtml(settings, { name: 'John Doe', message: 'Hello, I have a question.' })
        case 'newsletter': return generateNewsletterHtml(settings, '<p>This is a preview of your <strong>Newsletter</strong> content.</p>')
        default: return emailWrapper(settings, 'Preview', rowText('Preview not available for this type.'))
    }
}

export const DEFAULT_TEMPLATES = {
    'order-confirmation': '<!-- Order Confirmation Template (Managed in Code) -->',
    'welcome': '<!-- Welcome Email Template (Managed in Code) -->',
    'shipping-notification': '<!-- Shipping Notification Template (Managed in Code) -->',
    'order-status': '<!-- Order Status Template (Managed in Code) -->',
    'admin-order': '<!-- Admin Order Notification (Managed in Code) -->',
    'refund-pending': '<!-- Refund Request Template (Managed in Code) -->',
    'refund-approved': '<!-- Refund Approved Template (Managed in Code) -->',
    'admin-refund': '<!-- Admin Refund Notification (Managed in Code) -->',
    'refund-message': '<!-- Refund Message Template (Managed in Code) -->',
    'contact-confirmation': '<!-- Contact Form Template (Managed in Code) -->',
    'newsletter': '<!-- Newsletter Template (Managed in Code) -->'
}
