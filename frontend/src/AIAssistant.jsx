import React, { useState } from "react";
import axios from "axios";

function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      text: "Hello! I'm   Sri,Sri Sakthi Enterprise AI Assistant. Ask me about your inventory, sales, revenue, or low-stock products."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();

    setMessages((previous) => [
      ...previous,
      { type: "user", text: userQuestion }
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/ai/assistant",
        {
          params: { question: userQuestion }
        }
      );

      let answer = response.data.answer;

      if (response.data.data) {
        answer += "\n\n";

        response.data.data.forEach((product) => {
          answer += `${product.name} | ${product.brand} | Quantity: ${product.quantity}\n`;
        });
      }

      setMessages((previous) => [
        ...previous,
        { type: "assistant", text: answer }
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          type: "assistant",
          text: "Sorry, I couldn't connect to the server. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-page">
      <div className="ai-chat-heading">
        <h2> Sri</h2>
        <p>Your business assistant for Sri Sakthi Enterprises</p>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-message ${message.type}`}
          >
            {message.text}
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant">
            Thinking...
          </div>
        )}
      </div>

      <div className="ai-chat-input-area">
        <input
          type="text"
          value={question}
          placeholder="Ask about your business..."
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
        />

        <button onClick={sendMessage} disabled={loading || !question.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default AIAssistant;