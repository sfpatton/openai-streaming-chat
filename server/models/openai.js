// File: openai.js
// Location: openai-streaming-chat/server/models/openai.js

const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to fetch available OpenAI chat models
async function getAvailableModels() {
  try {
    // Fetch the list of all available models
    const response = await openai.models.list();

    // Filter the models to include only chat models (those containing 'gpt' in their ID)
    // and map the filtered results to an array of model IDs
    const filteredModels = response.data
      .filter((model) => model.id.includes("gpt"))
      .map((model) => model.id);

    // Check if any models were found
    if (filteredModels.length === 0) {
      console.warn("No GPT models found in the response");
    }

    return filteredModels;
  } catch (error) {
    // Log any errors that occur during the API request
    console.error("Error fetching OpenAI models:", error);
    // Return an empty array instead of throwing
    return [];
  }
}

// Function to generate completion using specified model and messages
async function generateCompletion(model, messages, temperature, maxTokens) {
  try {
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
    // Rethrow the error for handling in the calling function
    throw error;
  }
}

module.exports = { getAvailableModels, generateCompletion };
