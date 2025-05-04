// File: App.js
// Location: openai-streaming-chat\client\src\App.js

import React from "react";
import ChatStream from "./components/ChatStream";
import { ChatProvider } from "./context/ChatContext";
import { ProviderContextProvider } from "./context/ProviderContext";
import "./App.css";

function App() {
  return (
    <ProviderContextProvider>
      <ChatProvider>
        <div className="App">
          <header className="App-header">
            <h1>Multi-Provider Streaming Chat</h1>
            <ChatStream />
          </header>
        </div>
      </ChatProvider>
    </ProviderContextProvider>
  );
}

export default App;