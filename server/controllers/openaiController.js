// File: openaiController.js
// Location: openai-streaming-chat\server\controllers\openaiController.js

const models = require("../models");
const OpenAI = require("openai");

// Function to get available models
const getModels = async (req, res) => {
  try {
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
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

    // Send the fetched models as a response
    res.json({ openai: openaiModels });
  } catch (error) {
    // Log and send error if fetching fails
    console.error("Error fetching models:", error);
    res.status(500).json({
      error: "Failed to fetch models",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Function to handle chat completion
const handleCompletion = async (req, res) => {
  const { systemPrompt, userPrompt, model, temperature, maxTokens } = req.body;

  if (!systemPrompt || !userPrompt || !model) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

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

    // Stream the response chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(content);
      }
    }

    // End the response stream
    res.end();
  } catch (error) {
    // Log and send error if completion fails
    console.error("Error in completion request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};

module.exports = { getModels, handleCompletion };
