// File: App.js
// Location: openai-streaming-chat\client\src\App.js

import React from "react";
import ChatStream from "./components/ChatStream";
import { ChatProvider } from "./context/ChatContext";
import "./App.css";

function App() {
  return (
    <ChatProvider>
      <div className="App">
        <header className="App-header">
          <h1>OpenAI Streaming Chat</h1>
          <ChatStream />
        </header>
      </div>
    </ChatProvider>
  );
}

export default App;

