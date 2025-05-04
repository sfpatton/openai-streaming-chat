// File: index.js
// Location: openai-streaming-chat\server\index.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const completionRoutes = require("./routes/completion");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
    details: "Rate limit exceeded"
  },
  skip: (req) => process.env.NODE_ENV === "development"
});

// Apply rate limiting to all requests
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// JSON body parser
app.use(express.json({ limit: '1mb' }));

// API routes
app.use("/api/completion", completionRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "up", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  
  // Customize error response based on error type
  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: "Invalid JSON in request body",
      details: err.message
    });
  }
  
  if (err.message.includes("Not allowed by CORS")) {
    return res.status(403).json({
      error: "CORS error",
      details: "Origin not allowed"
    });
  }
  
  // Default error response
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found", 
    details: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  
  // Log API key status
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: No OpenAI API key found. Please set OPENAI_API_KEY in .env file.");
  } else {
    console.log("OpenAI API key: " + "*".repeat(5) + apiKey.slice(-4));
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
