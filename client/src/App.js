// File: App.js
// Location: openai-streaming-chat\client\src\App.js

import React from "react";
import ChatStream from "./components/ChatStream";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>OpenAI Streaming Chat</h1>
        <ChatStream />
      </header>
    </div>
  );
}

export default App;
