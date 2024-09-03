// File: index.js
// Location: openai-streaming-chat\server\index.js

const express = require("express");
const cors = require("cors");
const completionRoutes = require("./routes/completion");

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        // Add more localhost ports as needed
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api/completion", completionRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
