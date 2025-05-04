// File: index.js
// Location: openai-streaming-chat/server/models/index.js

const openai = require("./openai");
const anthropic = require("./anthropic");
const google = require("./google");
const litellm = require("./litellm");
const openrouter = require("./openrouter");

const models = {
  openai,
  anthropic,
  google,
  litellm,
  openrouter
  // Add other providers here in the future
};

module.exports = models;
