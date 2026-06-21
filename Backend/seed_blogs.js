import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Page } from './models.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables!")
    process.exit(1)
}

const blogs = [
    {
        title: "The Ultimate Guide to Using Silicone Cake Molds: Tips & Tricks for Perfect Results",
        slug: "ultimate-guide-silicone-cake-molds",
        type: "blog",
        isPublished: true,
        excerpt: "Discover the secret to using silicone cake molds like a professional. Learn how to prevent sticking, ensure even baking, and achieve flawless detail every time.",
        metaDescription: "Master the art of baking with silicone cake molds. Read our expert tips on prepping, baking, and cleaning silicone molds for professional-looking cakes.",
        featuredImage: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        content: `
            <p>Silicone baking molds have revolutionized the cake decorating world. Known for their flexibility, non-stick properties, and ability to handle intricate, gorgeous designs, they are a must-have in any modern baker's arsenal. However, baking with silicone requires a slightly different approach than traditional metal pans.</p>
            
            <h2>Why Choose Silicone Cake Molds?</h2>
            <p>Unlike metal or glass, silicone molds can flex, allowing you to pop out cakes, chocolates, and gelatin desserts with zero effort. They are also incredibly heat-resistant, dishwasher safe, and free from BPA. For cake decorators, they offer the ability to create complex 3D shapes—such as geometric hearts, flowers, and high-detail borders—that would be impossible to release from a rigid tin.</p>
            
            <h2>Top Tips for Perfect Silicone Baking Results</h2>
            <ul>
                <li><strong>Always Grease Your Molds First:</strong> Although silicone is non-stick, greasing them lightly with butter, cooking spray, or a dust of flour is highly recommended for the first few uses, especially for highly intricate designs.</li>
                <li><strong>Place Molds on a Baking Tray:</strong> Silicone is floppy! Always place your mold on a sturdy baking sheet before filling it with batter to ensure stability when placing it in and out of the oven.</li>
                <li><strong>Let it Cool Completely:</strong> The golden rule of silicone molds is patience. Never attempt to remove a cake while it is hot. Letting it cool completely ensures the details set and prevent tearing.</li>
                <li><strong>Tempering the Batter:</strong> Silicone molds absorb and distribute heat differently than metal. You may need to bake your recipe for a few extra minutes at a slightly lower temperature (approx. 5-10°C less) to prevent outer burning.</li>
            </ul>

            <h2>How to Clean and Store Silicone Molds</h2>
            <p>Never use sharp knives, scourers, or abrasive detergents on your molds as they can damage the non-stick silicone layer. Instead, soak them in warm soapy water and use a soft sponge. To maintain their shape, store them flat or in a single layer—do not fold or crush them under heavy baking pans.</p>

            <p>Ready to elevate your cake design game? Check out our professional-grade range of <a href="/products">baking tools and silicone molds</a> to start crafting masterpieces at home today!</p>
        `
    },
    {
        title: "5 Essential Cake Decorating Tools Every Beginner Baker Needs",
        slug: "5-essential-cake-decorating-tools-beginners",
        type: "blog",
        isPublished: true,
        excerpt: "Ready to take your cake decorating from amateur to professional? Here are the 5 essential tools that will transform your kitchen into a master bakery.",
        metaDescription: "Starting your cake decorating journey? Learn about the 5 essential tools you need, from turntables to icing scrapers, to achieve a professional finish.",
        featuredImage: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80",
        content: `
            <p>Stepping into the world of cake decorating can be overwhelming. With thousands of specialty tips, cutters, stencils, and tools on the market, it is easy to spend a fortune on gadgets you might never use. To help you get started without the clutter, we have compiled the top 5 absolute must-have tools that will instantly elevate your baking game.</p>

            <h2>1. A Sturdy Revolving Cake Turntable</h2>
            <p>If you try to frost a cake on a standard plate or cutting board, you will find yourself constantly shifting and breaking your posture. A smooth, heavy-duty rotating turntable allows you to apply frosting in one continuous, fluid motion, giving you that coveted bakery-smooth edge.</p>

            <h2>2. An Offset Spatula</h2>
            <p>Unlike regular butter knives or straight spatulas, an offset spatula features a bent metal blade. This bend keeps your fingers and knuckles away from the frosting as you spread buttercream, ensuring a perfectly flat, clean canvas.</p>

            <h2>3. Icing Scrapers and Smoothers</h2>
            <p>To achieve those perfectly sharp, modern edges, you need a high-quality acrylic or metal icing scraper. Simply hold the scraper flush against the turntable and spin. It will scrape away excess frosting and leave a smooth, flawless finish.</p>

            <h2>4. Precision Cake Stencils</h2>
            <p>You don't need years of piping practice to create breathtaking patterns. Cake stencils allow you to transfer beautiful floral, geometric, or lace textures onto your cake using buttercream, royal icing, or luster dust. They are easy, fast, and incredibly high-impact.</p>

            <h2>5. Silicone Piping Bags & Tips</h2>
            <p>A starter set of stainless steel piping tips (including a round tip, star tip, and petal tip) along with a reusable silicone piping bag will cover 90% of your cake border and lettering needs. Reusable silicone bags are environmentally friendly, easy to clean, and offer a much better grip than disposable plastic bags.</p>

            <p>At DecoraBake, we believe that the right tools make all the difference. Visit our <a href="/products">online catalog</a> to grab your beginner cake decorating kit and start your sweet journey today!</p>
        `
    },
    {
        title: "Mastering Cake Stencils: How to Create Staggering Designs with Buttercream",
        slug: "mastering-cake-stencils-buttercream",
        type: "blog",
        isPublished: true,
        excerpt: "Learn how to use cake stencils like a professional pastry chef. Read our step-by-step guide to applying stencils with royal icing, buttercream, and luster dusts.",
        metaDescription: "Elevate your cakes with beautiful stenciled patterns. Learn step-by-step how to apply stencils using buttercream and royal icing for crisp, clean results.",
        featuredImage: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
        content: `
            <p>Cake stenciling is one of the most elegant, modern, and deceptively simple cake decorating techniques. Whether you are aiming for a classic lace effect, a sleek geometric pattern, or a bold floral motif, cake stencils allow you to achieve professional-grade results in minutes.</p>

            <h2>The Secret is in the Buttercream Consistency</h2>
            <p>The most common mistake beginners make is using runny or too-soft buttercream. For clean, sharp stencil lines, your icing needs to be thick and smooth. Royal icing is the easiest to stencil with because it dries hard, but a stiff American or Swiss Meringue buttercream works beautifully if you chill the cake first.</p>

            <h2>Step-by-Step Guide to Perfect Cake Stenciling</h2>
            <ol>
                <li><strong>Chill Your Cake:</strong> Before applying the stencil, your frosted cake must be ice-cold and firm to the touch. Keep it in the fridge for at least 30-45 minutes so you don't ruin the smooth base coat.</li>
                <li><strong>Secure the Stencil:</strong> Wrap the stencil snugly around the cake. Secure it using dressmaker pins (inserted into the cake at a slight angle) or toothpick markers to make sure it doesn't shift.</li>
                <li><strong>Apply the Icing:</strong> Place a dollop of buttercream or royal icing onto an angled spatula. Spread a thin, even layer over the stencil openings.</li>
                <li><strong>Scrape Off the Excess:</strong> Using a wide plastic scraper, gently scrape away the excess icing. You should be able to see the pattern of the stencil underneath. The layer of frosting should be flush with the stencil itself.</li>
                <li><strong>Peel with Confidence:</strong> Carefully remove the pins and pull the stencil away in one swift, outward motion. Avoid dragging it sideways.</li>
            </ol>

            <h2>Pro-Tip: Try Luster Dusts for a Metallic Shine</h2>
            <p>If you want a shimmering gold, silver, or bronze design, you can paint over the stencil with luster dust mixed with a drop of vodka or lemon extract. It dries quickly and leaves an incredibly luxurious metallic pattern.</p>

            <p>Ready to try this technique yourself? Explore our collection of premium, reusable <a href="/products">cake stencils and baking accessories</a>. Don't forget to share your creations with us!</p>
        `
    }
]

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log("Connected to database for seeding...")
        
        // Remove existing blogs to prevent duplicates
        const deleteRes = await Page.deleteMany({ type: "blog" })
        console.log(`Deleted ${deleteRes.deletedCount} existing blog posts.`)

        const insertRes = await Page.insertMany(blogs)
        console.log(`Successfully seeded ${insertRes.length} professional, SEO-optimized blog posts!`)

        await mongoose.connection.close()
        console.log("Database connection closed.")
    } catch (err) {
        console.error("Seeding failed:", err)
        process.exit(1)
    }
}

seed()
