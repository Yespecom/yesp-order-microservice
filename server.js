require("dotenv").config()
const express = require("express")
const cors = require("cors") // Import the cors package
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { connectMainDB } = require("./config/db")
const orderRoutes = require("./routes/orderRoutes")
const errorHandler = require("./middleware/errorHandler")

const app = express()
const PORT = process.env.PORT || 5005

// Security middleware
app.use(helmet())

// Allow ALL CORS requests
// WARNING: This is generally NOT recommended for production environments
// as it can expose your API to potential security risks.
// For production, always specify allowed origins.
app.use(cors())

// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "YESP Order Microservice",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API routes
app.use("/api/orders", orderRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Connect to main database
    await connectMainDB()
    app.listen(PORT, () => {
      console.log(`🚀 YESP Order Microservice running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/orders`)
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...")
  process.exit(0)
})

startServer()
