// File: google.js
// Location: openai-streaming-chat/server/models/google.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Validates the Google API key availability
 * @returns {boolean} - Whether the API key is valid
 */
function validateApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error("Error: Missing Google API Key. Please set the GOOGLE_API_KEY environment variable.");
    return false;
  }
  
  return true;
}

// Initialize Google Generative AI client with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Get available Google Gemini models
 * @returns {Promise<Array>} - Array of model objects with id and max_tokens
 */
async function getAvailableModels() {
  try {
    // Validate API key before making requests
    if (!validateApiKey()) {
      return [];
    }
    
    // Google doesn't have a comprehensive models endpoint, so we hardcode the available models
    // This will need to be updated as Google releases new models
    const models = [
      {
        id: "gemini-pro",
        max_tokens: 8192
      },
      {
        id: "gemini-ultra",
        max_tokens: 8192
      },
      {
        id: "gemini-1.5-pro",
        max_tokens: 16384
      },
      {
        id: "gemini-1.5-flash",
        max_tokens: 16384
      }
    ];
    
    return models;
  } catch (error) {
    console.error("Error preparing Google models:", error);
    return [];
  }
}

/**
 * Generate completion using Google Gemini model
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

    // Initialize the model
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: maxTokens || 1024,
      },
    });
    
    // Convert OpenAI message format to Google Gemini format
    const convertedMessages = messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'user', parts: [{ text: `System instruction: ${msg.content}` }] };
      } else if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else if (msg.role === 'assistant') {
        return { role: 'model', parts: [{ text: msg.content }] };
      }
      return null;
    }).filter(Boolean);

    // Create a streaming chat completion
    const chat = geminiModel.startChat({
      history: convertedMessages.slice(0, -1),
    });

    const result = await chat.sendMessageStream(
      convertedMessages[convertedMessages.length - 1].parts[0].text
    );
    
    return result.stream;
  } catch (error) {
    console.error("Error in Google Gemini request:", error);
    throw error;
  }
}

module.exports = { getAvailableModels, generateCompletion, validateApiKey };
