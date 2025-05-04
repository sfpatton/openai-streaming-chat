// File: ProviderSelector.js
// Location: openai-streaming-chat\client\src\components\ProviderSelector.js

import React from 'react';
import { useProviderContext } from '../context/ProviderContext';
import { ACTION_TYPES } from '../context/ProviderContext';
import './ProviderSelector.css';

const ProviderSelector = ({ disabled }) => {
  const { state, dispatch } = useProviderContext();
  const { providers, selectedProvider, selectedModel } = state;

  // Handler for provider selection changes
  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    dispatch({ type: ACTION_TYPES.SET_SELECTED_PROVIDER, payload: newProvider });
    
    // Set first model of the provider as selected by default
    if (providers[newProvider].models.length > 0) {
      dispatch({ 
        type: ACTION_TYPES.SET_SELECTED_MODEL, 
        payload: providers[newProvider].models[0].id 
      });
    }
  };

  // Handler for model selection changes
  const handleModelChange = (e) => {
    dispatch({ type: ACTION_TYPES.SET_SELECTED_MODEL, payload: e.target.value });
  };

  // Get available models for the selected provider
  const availableModels = providers[selectedProvider]?.models || [];

  return (
    <div className="provider-selector">
      <div className="input-group">
        <label htmlFor="provider-select">AI Provider:</label>
        <select
          id="provider-select"
          value={selectedProvider}
          onChange={handleProviderChange}
          disabled={disabled}
        >
          {Object.entries(providers).map(([id, provider]) => (
            provider.isAvailable && (
              <option key={id} value={id}>
                {provider.name}
              </option>
            )
          ))}
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="model-select">Model:</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={handleModelChange}
          disabled={disabled || availableModels.length === 0}
        >
          {availableModels.length === 0 ? (
            <option value="">No models available</option>
          ) : (
            availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

export default ProviderSelector;
