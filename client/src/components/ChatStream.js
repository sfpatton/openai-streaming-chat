// File: ChatStream.js
// Location: openai-streaming-chat\client\src\components\ChatStream.js

import React, { useState, useCallback, useRef, useEffect } from "react";
import "./ChatStream.css";

function ChatStream() {
  // State variables for managing chat stream and UI
  const [value, setValue] = useState(""); // Stores the streamed response
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant.",
  ); // Stores system prompt
  const [userPrompt, setUserPrompt] = useState(""); // Stores user prompt
  const [isStreaming, setIsStreaming] = useState(false); // Indicates if streaming is in progress
  const [error, setError] = useState(null); // Stores any error messages
  const [models, setModels] = useState([]); // Stores available AI models
  const [selectedModel, setSelectedModel] = useState(""); // Stores the currently selected model
  const [isLoading, setIsLoading] = useState(true); // Indicates if models are being loaded
  const [temperature, setTemperature] = useState(0.7); // Stores the temperature value
  const [maxTokens, setMaxTokens] = useState(150); // Stores the max tokens value
  const [currentTokens, setCurrentTokens] = useState(0); // Stores the current token count
  const abortControllerRef = useRef(null); // Ref for AbortController to cancel fetch requests

  // Fetch available models when component mounts
  useEffect(() => {
    fetchModels();
  }, []);

  // Function to fetch available AI models from the server
  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:5001/api/completion/models",
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched models:", data); // Add this line
      if (!data.openai || data.openai.length === 0) {
        setModels([]);
        setError(
          "No models available. Please check your API key and try again.",
        );
      } else {
        setModels(data.openai);
        // Set default model to "gpt-4o-mini" if available, otherwise use the first model
        const defaultModel =
          data.openai.find((model) => model.id === "gpt-4o-mini") ||
          data.openai[0];
        setSelectedModel(defaultModel.id);
        setMaxTokens(defaultModel.max_tokens);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      setError(`Failed to fetch models: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate token count (basic estimation)
  const calculateTokens = (text) => {
    return text.split(/\s+/).length;
  };

  // Function to handle the submission of user input
  const handleClick = useCallback(async () => {
    setValue(""); // Clear previous response
    console.log("Value cleared:", value); // Add console log
    setError(null); // Clear any previous errors
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      // Send request to server for AI completion
      const response = await fetch("http://localhost:5001/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: selectedModel,
          temperature,
          maxTokens,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Stream and process the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(chunk);
        console.log("Received chunk:", decodedChunk); // Add console log
        setValue((prev) => prev + decodedChunk);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
        setError("Request was aborted.");
      } else {
        console.error("Error during streaming:", error);
        setError(
          `Error during streaming: ${error.message || "An unknown error occurred."}`,
        );
      }
    } finally {
      setIsStreaming(false);
    }
  }, [systemPrompt, userPrompt, selectedModel, temperature, maxTokens, value]);

  // Handler for system prompt changes
  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    setCurrentTokens(
      calculateTokens(e.target.value) + calculateTokens(userPrompt),
    );
  };

  // Handler for user prompt changes
  const handleUserPromptChange = (e) => {
    const newPrompt = e.target.value;
    const newTokenCount =
      calculateTokens(newPrompt) + calculateTokens(systemPrompt);

    if (newTokenCount <= maxTokens) {
      setUserPrompt(newPrompt);
      setCurrentTokens(newTokenCount);
    } else {
      alert(
        `You've reached the maximum token limit for this model (${maxTokens} tokens).`,
      );
    }
  };

  // Handler for model selection changes
  const handleModelChange = (e) => {
    const selectedModelId = e.target.value;
    console.log("Selected model:", selectedModelId); // Add this line
    const newModel = models.find((model) => model.id === selectedModelId);
    if (newModel) {
      setSelectedModel(newModel.id);
      setMaxTokens(newModel.max_tokens || 4096);
      setCurrentTokens(
        calculateTokens(systemPrompt) + calculateTokens(userPrompt),
      );
    } else {
      console.error(`Model with id ${selectedModelId} not found`);
      setSelectedModel(models[0]?.id || "");
      setMaxTokens(models[0]?.max_tokens || 4096);
    }
  };

  // Handler for temperature changes
  const handleTemperatureChange = (e) => {
    setTemperature(parseFloat(e.target.value));
  };

  // Handler for max tokens changes
  const handleMaxTokensChange = (e) => {
    setMaxTokens(parseInt(e.target.value, 10));
  };

  // Handler for 'Enter' key press in input field
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isStreaming) {
      handleClick();
    }
  };

  // Render the chat interface
  return (
    <div className="chat-container">
      {isLoading ? (
        <p>Loading models...</p>
      ) : (
        <>
          <div className="input-group">
            <label htmlFor="model-select">Select Model:</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={handleModelChange}
              disabled={isStreaming}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="system-prompt">System Prompt:</label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="Enter system prompt"
              disabled={isStreaming}
            />
          </div>
          <div className="input-group">
            <label htmlFor="user-prompt">User Prompt:</label>
            <textarea
              id="user-prompt"
              value={userPrompt}
              onChange={handleUserPromptChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter user prompt"
              disabled={isStreaming}
            />
          </div>
          <div className="token-info">
            <span>
              Tokens: {currentTokens} / {maxTokens}
            </span>
          </div>
          <div className="input-group">
            <label htmlFor="temperature">Temperature:</label>
            <input
              type="number"
              id="temperature"
              value={temperature}
              onChange={handleTemperatureChange}
              min="0"
              max="1"
              step="0.1"
              disabled={isStreaming}
            />
          </div>
          <div className="input-group">
            <label htmlFor="max-tokens">Max Tokens:</label>
            <input
              type="number"
              id="max-tokens"
              value={maxTokens}
              onChange={handleMaxTokensChange}
              min="1"
              max="4096"
              step="1"
              disabled={isStreaming}
            />
          </div>
          <button onClick={handleClick} disabled={isStreaming}>
            {isStreaming ? "Streaming..." : "Submit"}
          </button>
          <div className="response-container">
            <h3>Streaming response:</h3>
            <div className="response-content">
              {error ? <p className="error">{error}</p> : value}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatStream;
