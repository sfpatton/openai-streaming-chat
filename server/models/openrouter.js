// File: openrouter.js
// Location: openai-streaming-chat/server/models/openrouter.js

const axios = require('axios');
require('dotenv').config();

/**
 * Validates the OpenRouter API key format and availability
 * @returns {boolean} - Whether the API key is valid
 */
function validateApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("Error: Missing OpenRouter API Key. Please set the OPENROUTER_API_KEY environment variable.");
    return false;
  }
  
  return true;
}

/**
 * Get available models through OpenRouter
 * @returns {Promise<Array>} - Array of model objects with id and max_tokens
 */
async function getAvailableModels() {
  try {
    // Validate API key before making requests
    if (!validateApiKey()) {
      return [];
    }
    
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000', // Required by OpenRouter
        'X-Title': 'Streaming Chat App',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data.data) {
      console.warn("No models found in OpenRouter response");
      return [];
    }
    
    // Map the models to the format expected by the frontend
    const models = response.data.data.map(model => ({
      id: model.id,
      max_tokens: model.context_length,
      pricing: model.pricing,
      provider: model.provider,
      native_provider: model.base_model?.provider || model.provider
    }));
    
    return models;
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    
    if (error.response) {
      console.error(`OpenRouter API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    
    return [];
  }
}

/**
 * Generate completion using OpenRouter
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

    // Create a streaming chat completion
    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Streaming Chat App',
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      data: {
        model: model,
        messages: messages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 150,
        stream: true
      },
      responseType: 'stream'
    });
    
    // Return the stream for further processing
    return response.data;
  } catch (error) {
    console.error("Error in OpenRouter request:", error);
    
    if (error.response) {
      console.error(`OpenRouter API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

module.exports = { getAvailableModels, generateCompletion, validateApiKey };
