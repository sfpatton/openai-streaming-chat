/**
 * Utility functions for estimating token counts for OpenAI models
 */

/**
 * Provides a rough estimate of tokens for English text
 * Based on OpenAI's guidance that 1 token ~= 4 chars in English
 * 
 * @param {string} text - Input text to estimate
 * @returns {number} - Estimated token count
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  
  // Basic method: ~4 characters per token for English
  return Math.ceil(text.length / 4);
};

/**
 * More detailed token estimation that considers different text patterns
 * 
 * @param {string} text - Input text to estimate
 * @returns {number} - Estimated token count
 */
export const estimateTokensDetailed = (text) => {
  if (!text) return 0;
  
  // Split on common token boundaries
  const words = text.split(/\s+/);
  let tokenCount = 0;
  
  for (const word of words) {
    if (word.length === 0) continue;
    
    // Common adjustment cases:
    if (word.length <= 2) {
      // Very short words or symbols typically are one token
      tokenCount += 1;
    } else if (word.length <= 6) {
      // Most common English words
      tokenCount += 1;
    } else if (word.length <= 10) {
      // Longer words may be split into multiple tokens
      tokenCount += Math.ceil(word.length / 5);
    } else {
      // Long words and technical terms
      tokenCount += Math.ceil(word.length / 4);
    }
    
    // Adjust for known patterns:
    if (word.includes('-') || word.includes('/')) {
      // Hyphenated words often split at the boundary
      tokenCount += 1;
    }
    
    if (/\d+/.test(word)) {
      // Numbers tend to be tokenized efficiently
      tokenCount += Math.ceil(word.length / 8);
    }
  }
  
  // Add a small overhead for punctuation and special tokens
  tokenCount += Math.ceil(text.length / 100);
  
  return Math.max(1, tokenCount); // Ensure at least 1 token
};

/**
 * Estimates tokens for an array of messages in the OpenAI chat format
 * 
 * @param {Array} messages - Array of {role, content} objects
 * @returns {number} - Estimated token count including message overhead
 */
export const estimateChatTokens = (messages) => {
  if (!messages || !Array.isArray(messages)) return 0;
  
  // Per OpenAI docs: each message has a 4 token overhead
  // The entire message list has a 2 token overhead
  let tokenCount = 2; // Base overhead
  
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    
    const { role, content } = message;
    
    // 4 tokens per message
    tokenCount += 4;
    
    // Role name
    if (role) {
      tokenCount += estimateTokens(role);
    }
    
    // Content
    if (content) {
      tokenCount += estimateTokens(content);
    }
  }
  
  return tokenCount;
};

export default { estimateTokens, estimateTokensDetailed, estimateChatTokens };
