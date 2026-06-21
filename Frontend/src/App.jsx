import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './context/ToastContext'
import { WishlistProvider } from './context/WishlistContext'

// Always-loaded components (tiny, needed immediately)
import Header from './components/Header'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'
import CookieConsent from './components/CookieConsent'
import ErrorBoundary from './components/ErrorBoundary'
import Analytics from './components/Analytics'
import EmailPopup from './components/EmailPopup'
import SocialProof from './components/SocialProof'
import PromoBanner from './components/PromoBanner'
import ScrollToTop from './components/ScrollToTop'
import CartDrawer from './components/CartDrawer'

// Lazy-loaded customer pages
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Category = lazy(() => import('./pages/Category'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'))
const Account = lazy(() => import('./pages/Account'))
const Contact = lazy(() => import('./pages/Contact'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Blog = lazy(() => import('./pages/Blog'))
const Terms = lazy(() => import('./pages/Terms'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Lazy-loaded admin pages
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Login = lazy(() => import('./admin/Login'))
const Dashboard = lazy(() => import('./admin/Dashboard'))
const AdminProducts = lazy(() => import('./admin/Products'))
const Categories = lazy(() => import('./admin/Categories'))
const Orders = lazy(() => import('./admin/Orders'))
const Customers = lazy(() => import('./admin/Customers'))
const Slider = lazy(() => import('./admin/Slider'))
const Sections = lazy(() => import('./admin/Sections'))
const AdminPages = lazy(() => import('./admin/Pages'))
const Testimonials = lazy(() => import('./admin/Testimonials'))
const PromoCodes = lazy(() => import('./admin/PromoCodes'))
const Refunds = lazy(() => import('./admin/Refunds'))
const SupportChats = lazy(() => import('./admin/SupportChats'))
const Reports = lazy(() => import('./admin/Reports'))
const Settings = lazy(() => import('./admin/Settings'))
const Diagnostics = lazy(() => import('./admin/Diagnostics'))
const Newsletter = lazy(() => import('./admin/Newsletter'))
const EmailTemplates = lazy(() => import('./admin/EmailTemplates'))

const PageLoader = () => (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #f0e8ec', borderTopColor: '#6B2346', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
)

function CustomerLayout() {
    return (
        <div className="customer-layout">
            <Analytics gaId={import.meta.env.VITE_GA_ID} fbPixelId={import.meta.env.VITE_FB_PIXEL_ID} gadsId={import.meta.env.VITE_GADS_ID} />
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
            <ChatBot />
            <CookieConsent />
            <EmailPopup />
            <SocialProof />
            <PromoBanner />
            <CartDrawer />
        </div>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <ScrollToTop />
                <AuthProvider>
                    <UserProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <ToastProvider>
                                    <Suspense fallback={<PageLoader />}>
                                        <Routes>
                                            {/* Customer Routes */}
                                            <Route element={<CustomerLayout />}>
                                                <Route path="/" element={<Home />} />
                                                <Route path="/products" element={<Products />} />
                                                <Route path="/product/:id" element={<ProductDetail />} />
                                                <Route path="/category/:slug" element={<Category />} />
                                                <Route path="/cart" element={<Cart />} />
                                                <Route path="/checkout" element={<Checkout />} />
                                                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                                                <Route path="/account" element={<Account />} />
                                                <Route path="/wishlist" element={<Wishlist />} />
                                                <Route path="/contact" element={<Contact />} />
                                                <Route path="/about" element={<About />} />
                                                <Route path="/privacy" element={<Privacy />} />
                                                <Route path="/terms" element={<Terms />} />
                                                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                                                <Route path="/blog" element={<Blog />} />
                                                <Route path="/blog/:slug" element={<Blog />} />
                                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                                <Route path="/reset-password" element={<ResetPassword />} />
                                            </Route>

                                            {/* Admin Routes */}
                                            <Route path="/admin/login" element={<Login />} />
                                            <Route path="/admin" element={<AdminLayout />}>
                                                <Route index element={<Dashboard />} />
                                                <Route path="products" element={<AdminProducts />} />
                                                <Route path="categories" element={<Categories />} />
                                                <Route path="orders" element={<Orders />} />
                                                <Route path="customers" element={<Customers />} />
                                                <Route path="slider" element={<Slider />} />
                                                <Route path="sections" element={<Sections />} />
                                                <Route path="pages" element={<AdminPages />} />
                                                <Route path="testimonials" element={<Testimonials />} />
                                                <Route path="promo-codes" element={<PromoCodes />} />
                                                <Route path="refunds" element={<Refunds />} />
                                                <Route path="support" element={<SupportChats />} />
                                                <Route path="reports" element={<Reports />} />
                                                <Route path="settings" element={<Settings />} />
                                                <Route path="diagnostics" element={<Diagnostics />} />
                                                <Route path="newsletter" element={<Newsletter />} />
                                                <Route path="email-templates" element={<EmailTemplates />} />
                                            </Route>

                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </Suspense>
                                </ToastProvider>
                            </WishlistProvider>
                        </CartProvider>
                    </UserProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
