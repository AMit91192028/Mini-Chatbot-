import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { io } from "socket.io-client";

const useViewportHeight = () => {
  const setVh = useCallback(() => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }, [])

  useEffect(() => {
    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
    
    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('orientationchange', setVh)
    }
  }, [setVh])
}


const Message = ({ message }) => {
  const displayText = typeof message.text === 'object' ? 
    JSON.stringify(message.text) : String(message.text);

  
  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
  };

  
  const formatBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="bold-text">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

 
  const formatText = (text) => {
    
    return text.split('\n').map((paragraph, i) => {
     
      if (!paragraph.trim()) return null;

      if (paragraph.trim().startsWith('*') && !paragraph.trim().startsWith('**')) {
        return (
          <li key={i} className="message-bullet">
            {formatBoldText(paragraph.trim().substring(1).trim())}
          </li>
        );
      }
    
      return paragraph.trim() && (
        <p key={i}>
          {formatBoldText(paragraph)}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className={`message ${message.sender}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="sender-name">{message.sender === 'user' ? 'You' : 'Bot'}</span>
          {message.sender === 'bot' && (
            <button 
              onClick={handleCopy}
              className="copy-button"
              title="Copy message"
            >
              📋
            </button>
          )}
        </div>
        <div className="message-content">
          {formatText(displayText)}
        </div>
        <span className="timestamp">{message.timestamp}</span>
      </div>
    </div>
  );
}

const ChatInput = ({ message, setMessage, handleSubmit, inputRef }) => (
  <form onSubmit={handleSubmit} className="input-form">
    <input
      ref={inputRef}
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Type your message..."
      className="message-input"
    />
    <button type="submit" className="send-button">
      <span>Send</span>
    </button>
  </form>
)



export default function App() {
  const [message, setMessage] = useState('')
  const [conversations, setConversations] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const [socket,setSocket] = useState(null)
useEffect(()=>{
   let  socketInstance = io("https://mini-chatbot-backend-x6x6.onrender.com")
   setSocket(socketInstance)

   socketInstance.on('ai-response',(response)=>{
    const responseText = typeof response === 'object' ? response.response : response;
    const botMessage = {
        id: Date.now(),
        text: String(responseText), 
        sender: 'bot',
        timestamp: formatTime(new Date())
      }
      setConversations(prev => [...prev, botMessage])
      setIsTyping(false)
   })
},[])

  useViewportHeight()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
    inputRef.current?.focus()
  }, [conversations])



  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() === '') return

    const newMessage = {
      id:Date.now(),
      text: message,
      sender: 'user',
      timestamp: formatTime(new Date())
    }

    setConversations(prev => [...prev, newMessage])
    socket.emit('ai-message',message)
    setMessage('')
    setIsTyping(true)

  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="app-wrapper">
      <div className="background-effects">
        <div className="floating-shapes">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      
      <div className="chat-container" ref={containerRef}>
        <div className="chat-header">
          <div className="chat-header-content">
            <h1>Ami Mitra</h1>
            <p className="header-subtitle">
              <span className="keyboard-shortcut">/</span> to focus input
              <span className="typing-status">
                {isTyping ? ' • AI is typing...' : ' • Ready to chat'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="messages-container custom-scrollbar">
          {conversations.length === 0 && (
            <div className="empty-state">
              <div className="welcome-animation">
                <div className="welcome-icon">🤖</div>
              </div>
              <h2>Welcome to Ami Mitra!</h2>
              <p>Start a conversation and I'll be happy to help.</p>
            </div>
          )}
          
          {conversations.map((msg, index) => (
            <Message key={index} message={msg} />
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="message-bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-wrapper">
          <ChatInput 
            message={message}
            setMessage={setMessage}
            handleSubmit={handleSubmit}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  )
}
