// File: openaiController.js
// Location: openai-streaming-chat\server\controllers\openaiController.js

const models = require("../models");
const OpenAI = require("openai");
const NodeCache = require("node-cache");

// Create a cache for model data with 1 hour expiration
const modelCache = new NodeCache({ stdTTL: 3600 });

/**
 * Validates request body against required parameters
 * @param {Object} body - Request body
 * @returns {Object} - Validation result
 */
function validateRequestBody(body) {
  const { systemPrompt, userPrompt, model, temperature, maxTokens } = body;
  
  const errors = [];
  
  if (!systemPrompt) errors.push("System prompt is required");
  if (!userPrompt) errors.push("User prompt is required");
  if (!model) errors.push("Model ID is required");
  
  if (temperature !== undefined) {
    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      errors.push("Temperature must be a number between 0 and 2");
    }
  }
  
  if (maxTokens !== undefined) {
    const tokens = parseInt(maxTokens);
    if (isNaN(tokens) || tokens < 1 || tokens > 32768) {
      errors.push("Max tokens must be a positive integer (1-32768)");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Function to get available models
const getModels = async (req, res) => {
  try {
    // Check cache first
    const cachedModels = modelCache.get("openai_models");
    if (cachedModels) {
      console.log("Returning cached models");
      return res.json({ openai: cachedModels });
    }
    
    // If not in cache, fetch from OpenAI API
    console.log("Fetching models from OpenAI API");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    if (!models.openai.validateApiKey()) {
      return res.status(500).json({ 
        error: "API key validation failed", 
        details: "Please check your OpenAI API key configuration"
      });
    }
    
    const response = await openai.models.list();

    const openaiModels = response.data
      .filter((model) => model.id.includes("gpt"))
      .map((model) => ({
        id: model.id,
        max_tokens: model.max_tokens || 4096, // Default to 4096 if max_tokens is not provided
      }));

    // Check if models were fetched successfully
    if (openaiModels.length === 0) {
      throw new Error("No models fetched from OpenAI API");
    }

    // Cache the results
    modelCache.set("openai_models", openaiModels);
    
    // Send the fetched models as a response
    res.json({ openai: openaiModels });
  } catch (error) {
    // Log and send error if fetching fails
    console.error("Error fetching models:", error);
    
    let statusCode = 500;
    let errorMessage = "Failed to fetch models";
    
    // Customize error message based on the error type
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `OpenAI API Error: ${error.response.data.error.message}`;
    } else if (error.message.includes("No models fetched")) {
      errorMessage = "No compatible models found. Please check your API key permissions.";
    } else if (error.message.includes("Request failed with status code 401")) {
      statusCode = 401;
      errorMessage = "Authentication failed. Please check your OpenAI API key.";
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Function to handle chat completion
const handleCompletion = async (req, res) => {
  console.log("Completion request received:", new Date().toISOString());
  
  // Validate request body
  const validation = validateRequestBody(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: "Invalid request parameters", 
      details: validation.errors 
    });
  }
  
  const { systemPrompt, userPrompt, model, temperature = 0.7, maxTokens = 150 } = req.body;

  try {
    // Validate API key
    if (!models.openai.validateApiKey()) {
      return res.status(500).json({ 
        error: "API key validation failed", 
        details: "Please check your OpenAI API key configuration"
      });
    }
    
    // Set up response headers for streaming
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Record start time for performance tracking
    const startTime = Date.now();
    
    // Generate completion stream
    const stream = await models.openai.generateCompletion(
      model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      maxTokens,
    );

    // Variables to track response stats
    let tokenCount = 0;
    let contentLength = 0;
    
    // Stream the response chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(content);
        tokenCount++;
        contentLength += content.length;
      }
    }

    // Log completion stats
    const duration = Date.now() - startTime;
    console.log(`Completion finished: ${duration}ms, ~${tokenCount} chunks, ${contentLength} chars`);
    
    // End the response stream
    res.end();
  } catch (error) {
    // Log and send error if completion fails
    console.error("Error in completion request:", error);
    
    let errorMessage = "An error occurred while processing your request.";
    let statusCode = 500;
    
    // Customize error message based on the error type
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `OpenAI API Error: ${error.response.data.error.message}`;
    } else if (error.message.includes("Invalid input parameters")) {
      statusCode = 400;
      errorMessage = "Invalid input parameters. Please check your request format.";
    } else if (error.message.includes("Request failed with status code 401")) {
      statusCode = 401;
      errorMessage = "Authentication failed. Please check your OpenAI API key.";
    } else if (error.message.includes("Connection timeout")) {
      errorMessage = "Request timed out. Please try again later.";
    }
    
    // If headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(statusCode).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } else {
      // If streaming has already started, try to end with an error message
      try {
        res.write(`\n\nError: ${errorMessage}`);
        res.end();
      } catch (err) {
        console.error("Failed to write error to stream:", err);
      }
    }
  }
};

module.exports = { getModels, handleCompletion };

