// File: ProviderContext.js
// Location: openai-streaming-chat\client\src\context\ProviderContext.js

import React, { createContext, useReducer, useContext, useEffect } from 'react';

// Initial state for providers
const initialState = {
  providers: {
    openai: { name: 'OpenAI', isAvailable: false, models: [] },
    anthropic: { name: 'Anthropic', isAvailable: false, models: [] },
    google: { name: 'Google', isAvailable: false, models: [] },
    litellm: { name: 'LiteLLM', isAvailable: false, models: [] },
    openrouter: { name: 'OpenRouter', isAvailable: false, models: [] }
  },
  selectedProvider: 'openai',
  selectedModel: '',
  isLoading: true,
  error: null
};

// Action types for the reducer
export const ACTION_TYPES = {
  SET_PROVIDERS: 'SET_PROVIDERS',
  SET_PROVIDER_MODELS: 'SET_PROVIDER_MODELS',
  SET_SELECTED_PROVIDER: 'SET_SELECTED_PROVIDER',
  SET_SELECTED_MODEL: 'SET_SELECTED_MODEL',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Reducer function to handle state updates based on actions
function providerReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_PROVIDERS:
      return { 
        ...state, 
        providers: action.payload,
        isLoading: false
      };
      
    case ACTION_TYPES.SET_PROVIDER_MODELS:
      return { 
        ...state, 
        providers: {
          ...state.providers,
          [action.payload.provider]: {
            ...state.providers[action.payload.provider],
            models: action.payload.models,
            isAvailable: action.payload.models.length > 0
          }
        }
      };
      
    case ACTION_TYPES.SET_SELECTED_PROVIDER:
      return { 
        ...state, 
        selectedProvider: action.payload,
        // Reset selected model when changing provider
        selectedModel: ''
      };
      
    case ACTION_TYPES.SET_SELECTED_MODEL:
      return { 
        ...state, 
        selectedModel: action.payload 
      };
      
    case ACTION_TYPES.SET_LOADING:
      return { 
        ...state, 
        isLoading: action.payload 
      };
      
    case ACTION_TYPES.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        isLoading: false
      };
      
    default:
      return state;
  }
}

// Create the context
const ProviderContext = createContext();

// Custom provider component
export function ProviderContextProvider({ children }) {
  const [state, dispatch] = useReducer(providerReducer, initialState);
  
  // Fetch providers and models on initialization
  useEffect(() => {
    async function fetchProviders() {
      try {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
        
        const response = await fetch('http://localhost:5001/api/completion/models');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const updatedProviders = { ...state.providers };
        let firstAvailableProvider = null;
        let firstAvailableModel = null;
        
        // Update providers with available models
        Object.keys(data).forEach(provider => {
          if (state.providers[provider]) {
            const models = data[provider] || [];
            updatedProviders[provider] = {
              ...state.providers[provider],
              isAvailable: models.length > 0,
              models: models
            };
            
            // Save first available provider for default selection
            if (models.length > 0 && !firstAvailableProvider) {
              firstAvailableProvider = provider;
              firstAvailableModel = models[0]?.id;
            }
          }
        });
        
        dispatch({ type: ACTION_TYPES.SET_PROVIDERS, payload: updatedProviders });
        
        // Set default provider and model
        if (firstAvailableProvider) {
          dispatch({ type: ACTION_TYPES.SET_SELECTED_PROVIDER, payload: firstAvailableProvider });
          dispatch({ type: ACTION_TYPES.SET_SELECTED_MODEL, payload: firstAvailableModel });
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        dispatch({ 
          type: ACTION_TYPES.SET_ERROR, 
          payload: error.message || 'Failed to fetch providers and models'
        });
      }
    }
    
    fetchProviders();
  }, []);
  
  return (
    <ProviderContext.Provider value={{ state, dispatch }}>
      {children}
    </ProviderContext.Provider>
  );
}

// Custom hook for using the provider context
export function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProviderContext must be used within a ProviderContextProvider');
  }
  return context;
}

export default ProviderContext;
