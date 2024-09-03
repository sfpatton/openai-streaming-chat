# OpenAI Streaming Chat

This project demonstrates how to stream responses from OpenAI's API using React and Node.js, with the ability to select from all available OpenAI models.

## Features

- Real-time streaming of chat responses
- Simple React UI to display the streamed response
- Dynamic selection of available OpenAI models
- Adjustable temperature and max tokens settings
- Token count display for input prompts
- Modular structure for easy integration of future LLM providers

## Setup

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Server

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the `server` directory with your OpenAI API key:

    ```plaintext
    OPENAI_API_KEY=your-api-key-here
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

1. Select an OpenAI model from the dropdown menu.
2. Enter a system prompt to set the context for the AI.
3. Enter your user prompt in the designated text area.
4. Adjust the temperature and max tokens settings if desired.
5. Click "Submit" to generate a response.
6. The AI's response will stream in real-time in the "Streaming response" section.

## Project Structure

```
openai-streaming-chat/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatStream.js
│   │   │   └── ChatStream.css
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
│   │   └── openai.js
│   ├── routes/
│   │   └── completion.js
│   ├── .env
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## Additional Setup

1. Ensure you have created a `.gitignore` file in the root directory with the following content:

   ```
   # Dependencies
   node_modules/

   # Build outputs
   build/
   dist/

   # Environment variables
   .env
   server/.env
   **/server/.env

   # Logs
   *.log

   # OS generated files
   .DS_Store
   Thumbs.db

   # Editor directories and files
   .idea/
   .vscode/
   *.swp
   *.swo
   ```

2. Make sure not to commit the `.env` file to version control.

## Future Enhancements

The modular structure of this project allows for easy integration of additional LLM providers. To add support for providers like Grok API, Anthropic API, Google API, LiteLLM, or OpenRouter:

1. Create new files in the `server/models/` directory for each provider.
2. Implement `getAvailableModels` and `generateCompletion` functions for each provider.
3. Update `server/models/index.js` to include the new providers.
4. Modify the `getModels` function in `openaiController.js` to fetch models from all available providers.
5. Update the client-side code to handle multiple providers and their respective models.

This extensible architecture ensures that the project can evolve to support a wide range of LLM providers in the future.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).