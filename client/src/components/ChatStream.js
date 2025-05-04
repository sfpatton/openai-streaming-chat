// File: ChatStream.js
// Location: openai-streaming-chat\client\src\components\ChatStream.js

import React, { useState, useCallback, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { estimateTokens } from "../utils/tokenizer";
import "./ChatStream.css";
import "./MarkdownRenderer.css";

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
  const [chatHistory, setChatHistory] = useState([]); // Stores chat history
  const abortControllerRef = useRef(null); // Ref for AbortController to cancel fetch requests
  const responseRef = useRef(null); // Ref for scrolling in response container

  // Fetch available models when component mounts
  useEffect(() => {
    fetchModels();
    
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  // Add keyboard shortcuts (Ctrl+Enter to submit, Esc to cancel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isStreaming && userPrompt.trim()) handleClick();
      }
      
      // Escape to cancel streaming
      if (e.key === 'Escape' && isStreaming) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStreaming, userPrompt]);

  // Auto-scroll the response container when new content is received
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [value]);

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
      if (error.message.includes("Failed to fetch")) {
        setError("Unable to connect to server. Is the backend running?");
      } else {
        setError(`Failed to fetch models: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save current chat to history
  const saveToHistory = () => {
    if (!userPrompt.trim() || !value.trim()) return;
    
    const newEntry = {
      id: Date.now(),
      systemPrompt,
      userPrompt,
      response: value,
      model: selectedModel,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [...chatHistory, newEntry].slice(-20); // Keep only the latest 20 entries
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  // Function to handle the submission of user input
  const handleClick = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt before submitting.");
      return;
    }
    
    setValue(""); // Clear previous response
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
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      // Stream and process the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(chunk);
        setValue((prev) => prev + decodedChunk);
      }
      
      // Save to history after successful completion
      setTimeout(() => saveToHistory(), 500);
      
    } catch (error) {
      if (error.name === "AbortError") {
        setError("Request was cancelled.");
      } else if (error.message.includes("Failed to fetch")) {
        setError("Unable to connect to server. Please check your connection and try again.");
      } else {
        console.error("Error during streaming:", error);
        setError(`Error: ${error.message || "Unknown error occurred"}`);
      }
      
      // Add recovery suggestion for partial responses
      if (value.length > 0) {
        setError((prev) => `${prev} Your partial response was saved.`);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [systemPrompt, userPrompt, selectedModel, temperature, maxTokens, value, chatHistory]);

  // Handler for system prompt changes
  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    setCurrentTokens(
      estimateTokens(e.target.value) + estimateTokens(userPrompt),
    );
  };

  // Handler for user prompt changes
  const handleUserPromptChange = (e) => {
    const newPrompt = e.target.value;
    const newTokenCount =
      estimateTokens(newPrompt) + estimateTokens(systemPrompt);

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
    const newModel = models.find((model) => model.id === selectedModelId);
    if (newModel) {
      setSelectedModel(newModel.id);
      setMaxTokens(newModel.max_tokens || 4096);
      setCurrentTokens(
        estimateTokens(systemPrompt) + estimateTokens(userPrompt),
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

  // Clear the current chat
  const handleClear = () => {
    if (isStreaming) return;
    setValue("");
    setUserPrompt("");
    setError(null);
  };

  // Load a chat from history
  const loadFromHistory = (entry) => {
    if (isStreaming) return;
    
    setSystemPrompt(entry.systemPrompt);
    setUserPrompt(entry.userPrompt);
    setValue(entry.response);
    if (entry.model && models.some(model => model.id === entry.model)) {
      setSelectedModel(entry.model);
    }
    
    setCurrentTokens(
      estimateTokens(entry.systemPrompt) + estimateTokens(entry.userPrompt)
    );
  };

  // Format date for chat history display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
              placeholder="Enter user prompt (Ctrl+Enter to submit)"
              disabled={isStreaming}
            />
          </div>
          <div className="token-info">
            <span>
              Tokens (estimated): {currentTokens} / {maxTokens}
            </span>
          </div>
          <div className="input-row">
            <div className="input-group half">
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
            <div className="input-group half">
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
          </div>
          <div className="button-group">
            <button onClick={handleClick} disabled={isStreaming || !userPrompt.trim()} className="primary-button">
              {isStreaming ? "Streaming..." : "Submit"}
            </button>
            <button onClick={handleClear} disabled={isStreaming} className="secondary-button">
              Clear
            </button>
          </div>
          
          <div className="response-container">
            <h3>Response:</h3>
            <div className="response-content" ref={responseRef}>
              {error ? (
                <p className="error">{error}</p>
              ) : (
                <div className="markdown-content">
                  <MarkdownRenderer content={value} />
                </div>
              )}
            </div>
          </div>
          
          {chatHistory.length > 0 && (
            <div className="history-container">
              <h3>Chat History:</h3>
              <div className="history-list">
                {chatHistory.slice().reverse().map((entry) => (
                  <div className="history-item" key={entry.id} onClick={() => loadFromHistory(entry)}>
                    <div className="history-prompt">{entry.userPrompt.substring(0, 50)}{entry.userPrompt.length > 50 ? '...' : ''}</div>
                    <div className="history-meta">
                      <span className="history-model">{entry.model}</span>
                      <span className="history-time">{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="keyboard-shortcuts">
            <p>Keyboard shortcuts: <span className="shortcut">Ctrl+Enter</span> to submit, <span className="shortcut">Esc</span> to cancel</p>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatStream;
