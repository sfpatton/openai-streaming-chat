// File: completion.js
// Location: openai-streaming-chat\server\routes\completion.js

const express = require("express");
const {
  handleCompletion,
  getModels,
} = require("../controllers/openaiController");

const router = express.Router();

router.get("/models", getModels);
router.post("/", handleCompletion);

module.exports = router;
