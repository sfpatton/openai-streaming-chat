// File: ChatContext.js
// Location: openai-streaming-chat\client\src\context\ChatContext.js

import React, { createContext, useReducer, useContext } from 'react';

// Initial state for the chat application
const initialState = {
  systemPrompt: "You are a helpful assistant.",
  userPrompt: "",
  response: "",
  isStreaming: false,
  error: null,
  models: [],
  selectedModel: "",
  isLoading: true,
  temperature: 0.7,
  maxTokens: 150,
  currentTokens: 0,
  chatHistory: []
};

// Action types for the reducer
export const ACTION_TYPES = {
  SET_SYSTEM_PROMPT: 'SET_SYSTEM_PROMPT',
  SET_USER_PROMPT: 'SET_USER_PROMPT',
  SET_RESPONSE: 'SET_RESPONSE',
  APPEND_RESPONSE: 'APPEND_RESPONSE',
  SET_STREAMING: 'SET_STREAMING',
  SET_ERROR: 'SET_ERROR',
  SET_MODELS: 'SET_MODELS',
  SET_SELECTED_MODEL: 'SET_SELECTED_MODEL',
  SET_LOADING: 'SET_LOADING',
  SET_TEMPERATURE: 'SET_TEMPERATURE',
  SET_MAX_TOKENS: 'SET_MAX_TOKENS',
  SET_CURRENT_TOKENS: 'SET_CURRENT_TOKENS',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  RESET_CHAT: 'RESET_CHAT',
  LOAD_FROM_HISTORY: 'LOAD_FROM_HISTORY'
};

// Reducer function to handle state updates based on actions
function chatReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_SYSTEM_PROMPT:
      return { ...state, systemPrompt: action.payload };
      
    case ACTION_TYPES.SET_USER_PROMPT:
      return { ...state, userPrompt: action.payload };
      
    case ACTION_TYPES.SET_RESPONSE:
      return { ...state, response: action.payload };
      
    case ACTION_TYPES.APPEND_RESPONSE:
      return { ...state, response: state.response + action.payload };
      
    case ACTION_TYPES.SET_STREAMING:
      return { ...state, isStreaming: action.payload };
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ACTION_TYPES.SET_MODELS:
      return { ...state, models: action.payload };
      
    case ACTION_TYPES.SET_SELECTED_MODEL:
      return { 
        ...state, 
        selectedModel: action.payload.id,
        maxTokens: action.payload.maxTokens || state.maxTokens
      };
      
    case ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ACTION_TYPES.SET_TEMPERATURE:
      return { ...state, temperature: action.payload };
      
    case ACTION_TYPES.SET_MAX_TOKENS:
      return { ...state, maxTokens: action.payload };
      
    case ACTION_TYPES.SET_CURRENT_TOKENS:
      return { ...state, currentTokens: action.payload };
      
    case ACTION_TYPES.ADD_TO_HISTORY:
      // Keep the most recent 20 entries
      const updatedHistory = [...state.chatHistory, action.payload].slice(-20);
      return { ...state, chatHistory: updatedHistory };
      
    case ACTION_TYPES.CLEAR_HISTORY:
      return { ...state, chatHistory: [] };
      
    case ACTION_TYPES.RESET_CHAT:
      return { 
        ...state, 
        userPrompt: "", 
        response: "", 
        error: null 
      };
      
    case ACTION_TYPES.LOAD_FROM_HISTORY:
      return {
        ...state,
        systemPrompt: action.payload.systemPrompt,
        userPrompt: action.payload.userPrompt,
        response: action.payload.response,
        selectedModel: action.payload.model || state.selectedModel,
        error: null
      };
      
    default:
      return state;
  }
}

// Create the context
const ChatContext = createContext();

// Custom provider component
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook for using the chat context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
