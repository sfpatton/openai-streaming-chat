// File: openai.js
// Location: openai-streaming-chat/server/models/openai.js

const OpenAI = require("openai");
require("dotenv").config();

/**
 * Validates the OpenAI API key format and availability
 * @returns {boolean} - Whether the API key is valid
 */
function validateApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("Error: Missing OpenAI API Key. Please set the OPENAI_API_KEY environment variable.");
    return false;
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.error("Error: Invalid OpenAI API Key format. API keys should start with 'sk-'.");
    return false;
  }
  
  return true;
}

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to fetch available OpenAI chat models
async function getAvailableModels() {
  try {
    // Validate API key before making requests
    if (!validateApiKey()) {
      return [];
    }
    
    // Fetch the list of all available models
    const response = await openai.models.list();

    // Filter the models to include only chat models (those containing 'gpt' in their ID)
    // and map the filtered results to an array of model objects with ID and max tokens
    const filteredModels = response.data
      .filter((model) => model.id.includes("gpt"))
      .map((model) => ({
        id: model.id,
        max_tokens: model.max_tokens || 4096 // Default to 4096 if max_tokens is not provided
      }));

    // Check if any models were found
    if (filteredModels.length === 0) {
      console.warn("No GPT models found in the response");
    }

    return filteredModels;
  } catch (error) {
    // Log any errors that occur during the API request
    console.error("Error fetching OpenAI models:", error);
    
    // Provide more specific error messages based on the error type
    if (error.response) {
      console.error(`OpenAI API Error ${error.response.status}: ${error.response.data.error.message}`);
    } else if (error.message.includes('Request failed with status code 401')) {
      console.error("Authentication error: Invalid API key or unauthorized access");
    }
    
    // Return an empty array instead of throwing
    return [];
  }
}

// Function to generate completion using specified model and messages
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

    // Create a streaming chat completion using the specified model and messages
    const stream = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 150,
    });

    // Return the stream for further processing
    return stream;
  } catch (error) {
    // Log any errors that occur during the API request
    console.error("Error in OpenAI request:", error);
    
    // Provide more specific error messages based on the error type
    if (error.response) {
      console.error(`OpenAI API Error ${error.response.status}: ${error.response.data.error.message}`);
    }
    
    // Rethrow the error for handling in the calling function
    throw error;
  }
}

module.exports = { getAvailableModels, generateCompletion, validateApiKey };

