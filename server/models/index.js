// File: index.js
// Location: openai-streaming-chat/server/models/index.js

const openai = require("./openai");
// For future integration of more LLM models
// const anthropic = require("./anthropic");
// const google = require("./google");
// const litellm = require("./litellm");
// const openrouter = require("./openrouter");

const models = {
  openai: openai,
  // For implementation of future models
  // anthropic: anthropic,
  // google: google,
  // litellm: litellm,
  // openrouter: openrouter,
  // Add other providers here in the future
};

module.exports = models;
