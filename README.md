# Multi-Provider Streaming Chat

This project demonstrates how to stream responses from multiple LLM providers using React and Node.js, with the ability to select from all available models including OpenAI, Anthropic, Google, LiteLLM, and OpenRouter.

## Features

- Real-time streaming of chat responses from multiple LLM providers
- Dynamic provider and model selection
- React UI with dark theme for better readability
- Adjustable temperature and max tokens settings
- Token count display for input prompts
- Chat history with provider and model information
- Markdown rendering with syntax highlighting for code

## Supported LLM Providers

- **OpenAI**: GPT-3.5, GPT-4, and other available models
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku, etc.
- **Google**: Gemini Pro, Gemini Ultra, Gemini 1.5, etc.
- **LiteLLM**: Unified API for accessing multiple LLM providers
- **OpenRouter**: Routing to various open and closed LLM models

## Setup

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- API keys for the LLM providers you want to use

### Server

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the `server` directory with your API keys:

    ```
    # OpenAI API credentials
    OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Anthropic API credentials
    ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Google Gemini API credentials
    GOOGLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # LiteLLM API credentials
    LITELLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    LITELLM_API_ENDPOINT=https://your-litellm-instance.example.com/v1

    # OpenRouter API credentials
    OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    APP_URL=http://localhost:3000

    # Server configuration
    PORT=5001
    NODE_ENV=development
    ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
    ```

4. Start the server:

   ```bash
   npm start
   ```

### Client

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the React application:

   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser.

## Usage

1. Select an LLM provider from the dropdown menu.
2. Select a model from the available models for that provider.
3. Enter a system prompt to set the context for the AI.
4. Enter your user prompt in the designated text area.
5. Adjust the temperature and max tokens settings if desired.
6. Click "Submit" to generate a response.
7. The AI's response will stream in real-time in the "Response" section.
8. Previous conversations are saved in the Chat History section.

## Project Structure

```
multi-provider-streaming-chat/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatStream.js
│   │   │   ├── ChatStream.css
│   │   │   ├── MarkdownRenderer.js
│   │   │   ├── MarkdownRenderer.css
│   │   │   ├── ProviderSelector.js
│   │   │   └── ProviderSelector.css
│   │   ├── context/
│   │   │   ├── ChatContext.js
│   │   │   └── ProviderContext.js
│   │   ├── utils/
│   │   │   └── tokenizer.js
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
├── server/
│   ├── controllers/
│   │   └── openaiController.js
│   ├── models/
│   │   ├── index.js
│   │   ├── openai.js
│   │   ├── anthropic.js
│   │   ├── google.js
│   │   ├── litellm.js
│   │   └── openrouter.js
│   ├── routes/
│   │   └── completion.js
│   ├── .env
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## Recent Improvements

### Backend Enhancements

1. **Multi-Provider Support**: Added support for Anthropic, Google, LiteLLM, and OpenRouter APIs
2. **Unified API Interface**: Created a consistent interface for all LLM providers
3. **Dynamic Provider Detection**: App automatically detects which providers are configured with valid API keys
4. **Provider-Specific Stream Handling**: Implemented custom stream handling for each provider's response format
5. **Enhanced Error Handling**: Better error reporting and recovery when API calls fail

### Frontend Improvements

1. **Provider Selection UI**: Added dropdown for selecting different LLM providers
2. **Dynamic Model Loading**: Models are loaded based on the selected provider
3. **Provider Context**: Created a dedicated context for managing providers and models
4. **Chat History Enhancement**: Added provider information to chat history entries
5. **Consistent Dark Theme**: Updated styling for better readability with a dark theme
6. **Visual Provider Indicators**: Added colored provider tags in the chat history

### User Experience Improvements

1. **Keyboard Shortcuts**: Added Ctrl+Enter to submit and Esc to cancel streaming
2. **Auto Token Adjustment**: Maximum token limits adjust based on selected model
3. **Error Recovery**: Improved handling of connection errors with partial response saving
4. **Responsive Design**: Enhanced mobile responsiveness

## Future Enhancement Plans

1. **OAuth Authentication**: Add user account support with OAuth authentication
2. **Database Integration**: Add database for server-side chat history storage
3. **Vision Model Support**: Add support for uploading and processing images
4. **Multi-Modal Responses**: Enable responses with text, images, and other formats
5. **Advanced Chat Features**: Implement conversation threading and memory
6. **Cost Tracking**: Add token usage and cost tracking features
7. **WebSocket Implementation**: Switch from HTTP streaming to WebSockets for more efficient communication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
