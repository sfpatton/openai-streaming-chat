// File: anthropic.js
// Location: openai-streaming-chat/server/models/anthropic.js

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

/**
 * Validates the Anthropic API key format and availability
 * @returns {boolean} - Whether the API key is valid
 */
function validateApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error("Error: Missing Anthropic API Key. Please set the ANTHROPIC_API_KEY environment variable.");
    return false;
  }
  
  if (!apiKey.startsWith('sk-ant-')) {
    console.error("Error: Invalid Anthropic API Key format. API keys should start with 'sk-ant-'.");
    return false;
  }
  
  return true;
}

// Initialize Anthropic client with API key from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Get available Anthropic Claude models
 * @returns {Promise<Array>} - Array of model objects with id and max_tokens
 */
async function getAvailableModels() {
  try {
    // Validate API key before making requests
    if (!validateApiKey()) {
      return [];
    }
    
    // Anthropic doesn't have a models endpoint, so we hardcode the available models
    // This will need to be updated as Anthropic releases new models
    const models = [
      {
        id: "claude-3-opus-20240229",
        max_tokens: 4096
      },
      {
        id: "claude-3-sonnet-20240229",
        max_tokens: 4096
      },
      {
        id: "claude-3-haiku-20240307",
        max_tokens: 4096
      },
      {
        id: "claude-3-5-sonnet-20240620",
        max_tokens: 8192
      },
      {
        id: "claude-3-7-sonnet-20240503",
        max_tokens: 16384
      }
    ];
    
    return models;
  } catch (error) {
    console.error("Error preparing Anthropic models:", error);
    return [];
  }
}

/**
 * Generate completion using Anthropic Claude model
 * @param {string} model - Model ID
 * @param {Array} messages - Array of message objects
 * @param {number} temperature - Temperature parameter
 * @param {number} maxTokens - Maximum tokens parameter
 * @returns {Promise<Object>} - Stream object for async iteration
 */
async function generateCompletion(model, messages, temperature, maxTokens) {
  try {
    // Validate API key and input parameters
    if (!validateApiKey()) {
      throw new Error("Invalid or missing API key");
    }
    
    // Validate input parameters
    if (!model || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid input parameters");
    }

    // Convert OpenAI message format to Anthropic format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.role === 'system' ? [{ type: 'text', text: msg.content }] : msg.content
    }));

    // System message needs special handling for Anthropic
    const systemMessage = messages.find(msg => msg.role === 'system');
    const systemPrompt = systemMessage ? systemMessage.content : '';

    // Create a streaming chat completion
    const stream = await anthropic.messages.create({
      model: model,
      messages: formattedMessages.filter(msg => msg.role !== 'system'),
      system: systemPrompt,
      stream: true,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1024,
    });

    return stream;
  } catch (error) {
    console.error("Error in Anthropic request:", error);
    throw error;
  }
}

module.exports = { getAvailableModels, generateCompletion, validateApiKey };
