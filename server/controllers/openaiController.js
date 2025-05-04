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
  const { systemPrompt, userPrompt, model, provider, temperature, maxTokens } = body;
  
  const errors = [];
  
  if (!systemPrompt) errors.push("System prompt is required");
  if (!userPrompt) errors.push("User prompt is required");
  if (!model) errors.push("Model ID is required");
  if (!provider) errors.push("Provider is required");
  
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

/**
 * Check if API keys are configured for each provider
 * @returns {Object} - Object with provider availability status
 */
function checkProvidersAvailability() {
  const availability = {
    openai: models.openai.validateApiKey(),
    anthropic: models.anthropic?.validateApiKey() || false,
    google: models.google?.validateApiKey() || false,
    litellm: models.litellm?.validateApiConfig() || false,
    openrouter: models.openrouter?.validateApiKey() || false
  };
  
  return availability;
}

// Function to get available models from all configured providers
const getModels = async (req, res) => {
  try {
    // Check cache first
    const cachedModels = modelCache.get("all_models");
    if (cachedModels) {
      console.log("Returning cached models");
      return res.json(cachedModels);
    }
    
    // Check which providers are available
    const providersAvailability = checkProvidersAvailability();
    console.log("Providers availability:", providersAvailability);
    
    // Fetch models from each configured provider
    const modelPromises = [];
    const results = {};
    
    // Only fetch from providers that have valid API keys
    if (providersAvailability.openai) {
      modelPromises.push(
        models.openai.getAvailableModels()
          .then(models => { results.openai = models; })
          .catch(error => {
            console.error("Error fetching OpenAI models:", error);
            results.openai = [];
          })
      );
    } else {
      results.openai = [];
    }
    
    if (providersAvailability.anthropic) {
      modelPromises.push(
        models.anthropic.getAvailableModels()
          .then(models => { results.anthropic = models; })
          .catch(error => {
            console.error("Error fetching Anthropic models:", error);
            results.anthropic = [];
          })
      );
    } else {
      results.anthropic = [];
    }
    
    if (providersAvailability.google) {
      modelPromises.push(
        models.google.getAvailableModels()
          .then(models => { results.google = models; })
          .catch(error => {
            console.error("Error fetching Google models:", error);
            results.google = [];
          })
      );
    } else {
      results.google = [];
    }
    
    if (providersAvailability.litellm) {
      modelPromises.push(
        models.litellm.getAvailableModels()
          .then(models => { results.litellm = models; })
          .catch(error => {
            console.error("Error fetching LiteLLM models:", error);
            results.litellm = [];
          })
      );
    } else {
      results.litellm = [];
    }
    
    if (providersAvailability.openrouter) {
      modelPromises.push(
        models.openrouter.getAvailableModels()
          .then(models => { results.openrouter = models; })
          .catch(error => {
            console.error("Error fetching OpenRouter models:", error);
            results.openrouter = [];
          })
      );
    } else {
      results.openrouter = [];
    }
    
    // Wait for all model fetching to complete
    await Promise.all(modelPromises);
    
    // Check if any models were fetched
    const totalModels = Object.values(results).reduce((sum, models) => sum + models.length, 0);
    if (totalModels === 0) {
      return res.status(404).json({
        error: "No models available",
        details: "No models were found from any configured provider. Please check your API keys and try again."
      });
    }
    
    // Cache the results
    modelCache.set("all_models", results);
    
    // Send the fetched models as a response
    res.json(results);
  } catch (error) {
    // Log and send error if fetching fails
    console.error("Error fetching models:", error);
    
    let statusCode = 500;
    let errorMessage = "Failed to fetch models";
    
    // Customize error message based on the error type
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `API Error: ${error.response.data?.error?.message || JSON.stringify(error.response.data)}`;
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
  
  const { systemPrompt, userPrompt, model, provider, temperature = 0.7, maxTokens = 150 } = req.body;

  try {
    // Check if the provider is available
    if (!models[provider]) {
      return res.status(400).json({
        error: "Invalid provider",
        details: `Provider '${provider}' is not supported or not configured.`
      });
    }
    
    // Validate API key for the requested provider
    let isValidApiKey = false;
    
    if (provider === 'openai') {
      isValidApiKey = models.openai.validateApiKey();
    } else if (provider === 'anthropic') {
      isValidApiKey = models.anthropic.validateApiKey();
    } else if (provider === 'google') {
      isValidApiKey = models.google.validateApiKey();
    } else if (provider === 'litellm') {
      isValidApiKey = models.litellm.validateApiConfig();
    } else if (provider === 'openrouter') {
      isValidApiKey = models.openrouter.validateApiKey();
    }
    
    if (!isValidApiKey) {
      return res.status(500).json({
        error: "API key validation failed",
        details: `Please check your ${provider.toUpperCase()} API key configuration`
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
    
    // Prepare messages for the LLM
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    
    // Generate completion stream based on provider
    let stream;
    if (provider === 'openai') {
      stream = await models.openai.generateCompletion(model, messages, temperature, maxTokens);
    } else if (provider === 'anthropic') {
      stream = await models.anthropic.generateCompletion(model, messages, temperature, maxTokens);
    } else if (provider === 'google') {
      stream = await models.google.generateCompletion(model, messages, temperature, maxTokens);
    } else if (provider === 'litellm') {
      stream = await models.litellm.generateCompletion(model, messages, temperature, maxTokens);
    } else if (provider === 'openrouter') {
      stream = await models.openrouter.generateCompletion(model, messages, temperature, maxTokens);
    }

    // Variables to track response stats
    let tokenCount = 0;
    let contentLength = 0;
    
    // Different providers may have different stream handling
    if (provider === 'openai') {
      // Stream the response chunks for OpenAI
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(content);
          tokenCount++;
          contentLength += content.length;
        }
      }
    } else if (provider === 'anthropic') {
      // Stream the response chunks for Anthropic
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.text) {
          res.write(chunk.delta.text);
          tokenCount++;
          contentLength += chunk.delta.text.length;
        }
      }
    } else if (provider === 'google') {
      // Stream the response chunks for Google
      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(chunk.text);
          tokenCount++;
          contentLength += chunk.text.length;
        }
      }
    } else if (provider === 'litellm' || provider === 'openrouter') {
      // Stream the response chunks for LiteLLM and OpenRouter
      // These providers return an Axios response stream that needs to be processed
      stream.on('data', (chunk) => {
        // Parse the SSE data
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                res.write(content);
                tokenCount++;
                contentLength += content.length;
              }
            } catch (e) {
              // Skip malformed data
              console.warn('Error parsing SSE data:', e);
            }
          }
        }
      });
      
      // Wait for the stream to end
      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    }

    // Log completion stats
    const duration = Date.now() - startTime;
    console.log(`Completion finished: ${duration}ms, ~${tokenCount} chunks, ${contentLength} chars, provider: ${provider}, model: ${model}`);
    
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
      errorMessage = `API Error: ${error.response.data?.error?.message || JSON.stringify(error.response.data)}`;
    } else if (error.message.includes("Invalid input parameters")) {
      statusCode = 400;
      errorMessage = "Invalid input parameters. Please check your request format.";
    } else if (error.message.includes("Request failed with status code 401")) {
      statusCode = 401;
      errorMessage = "Authentication failed. Please check your API key.";
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
