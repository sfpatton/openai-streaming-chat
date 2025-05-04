// File: litellm.js
// Location: openai-streaming-chat/server/models/litellm.js

const axios = require('axios');
require('dotenv').config();

/**
 * Validates the LiteLLM API key and endpoint availability
 * @returns {boolean} - Whether the API configuration is valid
 */
function validateApiConfig() {
  const apiKey = process.env.LITELLM_API_KEY;
  const endpoint = process.env.LITELLM_API_ENDPOINT;
  
  if (!apiKey) {
    console.error("Error: Missing LiteLLM API Key. Please set the LITELLM_API_KEY environment variable.");
    return false;
  }
  
  if (!endpoint) {
    console.error("Error: Missing LiteLLM API Endpoint. Please set the LITELLM_API_ENDPOINT environment variable.");
    return false;
  }
  
  return true;
}

/**
 * Get available models through LiteLLM
 * @returns {Promise<Array>} - Array of model objects with id and max_tokens
 */
async function getAvailableModels() {
  try {
    // Validate API configuration before making requests
    if (!validateApiConfig()) {
      return [];
    }
    
    const response = await axios.get(`${process.env.LITELLM_API_ENDPOINT}/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.data) {
      console.warn("No models found in LiteLLM response");
      return [];
    }
    
    // Map the models to the format expected by the frontend
    const models = response.data.data.map(model => ({
      id: model.id,
      max_tokens: model.context_length || 4096,
      provider: model.provider || 'litellm'
    }));
    
    return models;
  } catch (error) {
    console.error("Error fetching LiteLLM models:", error);
    
    if (error.response) {
      console.error(`LiteLLM API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    
    return [];
  }
}

/**
 * Generate completion using LiteLLM
 * @param {string} model - Model ID
 * @param {Array} messages - Array of message objects
 * @param {number} temperature - Temperature parameter
 * @param {number} maxTokens - Maximum tokens parameter
 * @returns {Promise<Object>} - Stream object for async iteration
 */
async function generateCompletion(model, messages, temperature, maxTokens) {
  try {
    // Validate API configuration and input parameters
    if (!validateApiConfig()) {
      throw new Error("Invalid or missing API configuration");
    }
    
    // Validate input parameters
    if (!model || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid input parameters");
    }

    // Create a streaming chat completion
    const response = await axios({
      method: 'post',
      url: `${process.env.LITELLM_API_ENDPOINT}/chat/completions`,
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
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
    console.error("Error in LiteLLM request:", error);
    
    if (error.response) {
      console.error(`LiteLLM API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

module.exports = { getAvailableModels, generateCompletion, validateApiConfig };
