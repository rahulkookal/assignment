import { useState } from "react";
import axios from 'axios';
import "./App.css";

function App() {
  // State for user input message
  const [message, setMessage] = useState("");

  // State for whether the user is typing
  const [isTyping, setIsTyping] = useState(false);

  // State for storing chat messages
  const [chats, setChats] = useState([]);

  // State for handling file upload
  const [selectedFile, setSelectedFile] = useState(null);

  // State for handling the "Embedded" checkbox
  const [checked, setChecked] = useState(false);

  // Function to handle user input and initiate chat
  const handleChat = async (e, message) => {
    e.preventDefault();

    if (!message) return;

    setIsTyping(true);
    scrollTo(0, 1e10);

    // Add user message to the chat
    setChats((prevChats) => [...prevChats, { role: "user", content: message }]);
    setMessage("");

    const url = checked ? "http://localhost:8000/ask" : "http://localhost:8000/";

    try {
      // Send chat data to the server
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chats }),
      });

      const data = await response.json();

      // Add server response to the chat
      setChats((prevChats) => [...prevChats, data.output]);
      setIsTyping(false);
      scrollTo(0, 1e10);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Function to handle file input change
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Function to handle "Embedded" checkbox change
  const showEmbedded = (e) => {
    setChecked(e.target.checked);
  };

  // Function to handle file upload
  const handleUpload = (event) => {
    event.preventDefault();

    const data = new FormData();
    data.append('file', selectedFile, selectedFile.name);

    // Send file to the server
    axios.post('http://localhost:8000/upload', data)
      .then((res) => {
        console.log(res.statusText);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <main>
      <h1>AI Assignment</h1>

      {/* Display chat messages */}
      <section>
        {chats.map((chat, index) => (
          <p key={index} className={chat.role === "user" ? "user_msg" : ""}>
            <span>
              <b>{chat.role.toUpperCase()}</b>
            </span>
            <span>:</span>
            <span>{chat.content}</span>
          </p>
        ))}
      </section>

      {/* Display "Typing" message */}
      <div className={isTyping ? "" : "hide"}>
        <p>
          <i>{isTyping ? "Typing" : ""}</i>
        </p>
      </div>

      {/* User input form */}
      <form className="chat-form" onSubmit={(e) => handleChat(e, message)}>
        <input
          type="text"
          name="message"
          className="text"
          value={message}
          placeholder="Type a message here and hit Enter..."
          onChange={(e) => setMessage(e.target.value)}
        />
        {/* Embedded checkbox */}
        <input type="checkbox" className="embededCheck" checked={checked} onChange={showEmbedded} />
        <label> Embedded</label>
      </form>

      {/* File input for uploading */}
      <form className="upload-form" onSubmit={(e) => handleChat(e, message)}>
        <input type="file" name="file" onChange={handleFileChange} />
        {/* Button to initiate file upload */}
        <button onClick={handleUpload}>Upload</button>
      </form>
      
    </main>
  );
}

export default App;
